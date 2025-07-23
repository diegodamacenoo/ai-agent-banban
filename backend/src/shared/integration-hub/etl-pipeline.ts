import { SupabaseService } from '../services/supabase-service';

export interface ETLConfig {
  client: string;
  organizationId: string;
  batchSize?: number;
  retryAttempts?: number;
  timeoutMs?: number;
}

export interface ETLResult {
  success: boolean;
  records_processed: number;
  records_successful: number;
  records_failed: number;
  execution_time_ms: number;
  errors?: string[];
  details?: any;
}

export interface ETLStep {
  name: string;
  description: string;
  execute: (data: any) => Promise<any>;
  rollback?: (data: any) => Promise<void>;
}

/**
 * Pipeline ETL base para processamento de dados
 * Fornece funcionalidade comum para extração, transformação e carregamento
 */
export abstract class BaseETLPipeline {
  protected config: ETLConfig;
  protected supabaseService: SupabaseService;
  protected steps: ETLStep[] = [];

  constructor(config: ETLConfig) {
    this.config = config;
    this.supabaseService = SupabaseService.getInstance();
  }

  /**
   * Adiciona um passo ao pipeline
   */
  protected addStep(step: ETLStep): void {
    this.steps.push(step);
  }

  /**
   * Executa o pipeline completo
   */
  async execute(inputData?: any): Promise<ETLResult> {
    const startTime = Date.now();
    let processedRecords = 0;
    let successfulRecords = 0;
    let failedRecords = 0;
    const errors: string[] = [];
    const executedSteps: { step: ETLStep; result: any }[] = [];

    console.debug(`[${this.config.client}] Starting ETL pipeline`, {
      steps: this.steps.length,
      organization_id: this.config.organizationId,
      timestamp: new Date().toISOString()
    });

    try {
      let currentData = inputData;

      // Executar cada passo do pipeline
      for (const step of this.steps) {
        console.debug(`[${this.config.client}] Executing ETL step: ${step.name}`);
        
        try {
          const stepResult = await this.executeStepWithTimeout(step, currentData);
          executedSteps.push({ step, result: stepResult });
          currentData = stepResult;
          
          // Contar registros processados (se aplicável)
          if (stepResult && typeof stepResult === 'object') {
            if (stepResult.records_processed) {
              processedRecords += stepResult.records_processed;
            }
            if (stepResult.records_successful) {
              successfulRecords += stepResult.records_successful;
            }
            if (stepResult.records_failed) {
              failedRecords += stepResult.records_failed;
            }
          }

        } catch (stepError: any) {
          console.error(`[${this.config.client}] ETL step failed: ${step.name}`, {
            error: stepError.message
          });

          errors.push(`Step '${step.name}': ${stepError.message}`);
          
          // Tentar rollback dos passos executados
          await this.rollbackSteps(executedSteps.reverse());
          
          return {
            success: false,
            records_processed: processedRecords,
            records_successful: successfulRecords,
            records_failed: failedRecords + 1,
            execution_time_ms: Date.now() - startTime,
            errors
          };
        }
      }

      const executionTime = Date.now() - startTime;

      console.debug(`[${this.config.client}] ETL pipeline completed successfully`, {
        records_processed: processedRecords,
        records_successful: successfulRecords,
        records_failed: failedRecords,
        execution_time_ms: executionTime
      });

      // Log da execução
      await this.logExecution({
        success: true,
        records_processed: processedRecords,
        records_successful: successfulRecords,
        records_failed: failedRecords,
        execution_time_ms: executionTime,
        errors
      });

      return {
        success: true,
        records_processed: processedRecords,
        records_successful: successfulRecords,
        records_failed: failedRecords,
        execution_time_ms: executionTime,
        details: currentData
      };

    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      
      console.error(`[${this.config.client}] ETL pipeline failed`, {
        error: error.message,
        execution_time_ms: executionTime
      });

      errors.push(`Pipeline error: ${error.message}`);

      // Log da execução com erro
      await this.logExecution({
        success: false,
        records_processed: processedRecords,
        records_successful: successfulRecords,
        records_failed: failedRecords + 1,
        execution_time_ms: executionTime,
        errors
      });

      return {
        success: false,
        records_processed: processedRecords,
        records_successful: successfulRecords,
        records_failed: failedRecords + 1,
        execution_time_ms: executionTime,
        errors
      };
    }
  }

  /**
   * Executa um passo com timeout
   */
  private async executeStepWithTimeout(step: ETLStep, data: any): Promise<any> {
    const timeout = this.config.timeoutMs || 300000; // 5 minutos padrão

    return Promise.race([
      step.execute(data),
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Step '${step.name}' timed out after ${timeout}ms`));
        }, timeout);
      })
    ]);
  }

  /**
   * Faz rollback dos passos executados
   */
  private async rollbackSteps(executedSteps: { step: ETLStep; result: any }[]): Promise<void> {
    console.debug(`[${this.config.client}] Rolling back ${executedSteps.length} steps`);

    for (const { step, result } of executedSteps) {
      if (step.rollback) {
        try {
          await step.rollback(result);
          console.debug(`[${this.config.client}] Rolled back step: ${step.name}`);
        } catch (rollbackError: any) {
          console.error(`[${this.config.client}] Rollback failed for step: ${step.name}`, {
            error: rollbackError.message
          });
        }
      }
    }
  }

  /**
   * Log da execução no banco de dados
   */
  private async logExecution(result: ETLResult): Promise<void> {
    try {
      await this.supabaseService.getClient()
        .from('etl_execution_log')
        .insert({
          organization_id: this.config.organizationId,
          client: this.config.client,
          pipeline_type: this.constructor.name,
          success: result.success,
          records_processed: result.records_processed,
          records_successful: result.records_successful,
          records_failed: result.records_failed,
          execution_time_ms: result.execution_time_ms,
          errors: result.errors,
          details: result.details,
          created_at: new Date().toISOString()
        });
    } catch (logError: any) {
      console.error(`[${this.config.client}] Failed to log ETL execution`, {
        error: logError.message
      });
    }
  }

  /**
   * Cria passo de extração de dados
   */
  protected createExtractionStep(name: string, query: string, params?: any): ETLStep {
    return {
      name,
      description: `Extract data: ${name}`,
      execute: async () => {
        const { data, error } = await this.supabaseService.getClient()
          .rpc(query, params);

        if (error) {
          throw new Error(`Extraction failed: ${error.message}`);
        }

        return {
          extracted_data: data,
          records_processed: Array.isArray(data) ? data.length : 1
        };
      }
    };
  }

  /**
   * Cria passo de transformação de dados
   */
  protected createTransformationStep(
    name: string, 
    transformFn: (data: any) => Promise<any>
  ): ETLStep {
    return {
      name,
      description: `Transform data: ${name}`,
      execute: async (data: any) => {
        const transformedData = await transformFn(data);
        
        return {
          transformed_data: transformedData,
          records_processed: Array.isArray(transformedData) ? transformedData.length : 1
        };
      }
    };
  }

  /**
   * Cria passo de carregamento de dados
   */
  protected createLoadStep(name: string, tableName: string): ETLStep {
    return {
      name,
      description: `Load data to: ${tableName}`,
      execute: async (data: any) => {
        const records = data.transformed_data || data.extracted_data || data;
        
        if (!Array.isArray(records) || records.length === 0) {
          return {
            records_processed: 0,
            records_successful: 0,
            records_failed: 0
          };
        }

        const { data: insertResult, error } = await this.supabaseService.getClient()
          .from(tableName)
          .upsert(records);

        if (error) {
          throw new Error(`Load failed: ${error.message}`);
        }

        return {
          loaded_data: insertResult,
          records_processed: records.length,
          records_successful: records.length,
          records_failed: 0
        };
      },
      rollback: async (data: any) => {
        // Implementar rollback se necessário
        console.debug(`Rollback not implemented for load step: ${name}`);
      }
    };
  }

  /**
   * Método abstrato para configurar o pipeline - deve ser implementado pelas subclasses
   */
  protected abstract setupPipeline(): void;
}