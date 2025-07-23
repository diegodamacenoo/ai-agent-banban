import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';
import { ModuleInstance, ModuleInfo } from '../../../../shared/types/module-types';
import { supabaseService } from '../../../../shared/services/supabase-service';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

export class BanBanETLFlowModule implements ModuleInstance {
  name = 'banban-etl-flow';
  version = '2.0.0';
  description = 'Módulo ETL para processamento de dados Banban';
  baseModule = 'flow-base';

  constructor() {}

  async register(fastify: FastifyInstance, prefix?: string): Promise<void> {
    const secretToken = process.env.WEBHOOK_SECRET_TOKEN || 'banban_webhook_secret_2025';
    
    // OPTIONS handler for CORS
    fastify.options('/api/webhooks/banban/etl/*', async (request, reply) => {
      return reply.headers(corsHeaders).send();
    });

    // Rota POST para ETL diário
    fastify.post('/api/webhooks/banban/etl/daily', {
      schema: {
        description: 'Executa ETL diário para dados Banban',
        tags: ['Banban', 'ETL', 'Webhooks'],
        body: {
          type: 'object',
          properties: {
            force: { type: 'boolean', default: false },
            organization_id: { type: 'string' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              action: { type: 'string' },
              attributes: { type: 'object' },
              metadata: { type: 'object' }
            }
          }
        }
      }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
      const startTime = Date.now();

      try {
        const eventUuid = randomUUID();
        const payload = request.body as any;

        console.debug('ETL daily process started:', {
          event_uuid: eventUuid,
          organization_id: payload?.organization_id,
          force: payload?.force
        });

        // Executar ETL diário (chamada para RPC do Supabase)
        const { data, error } = await supabaseService.getClient().rpc('run_daily_etl', {
          organization_id: payload?.organization_id,
          force_run: payload?.force || false
        });

        if (error) {
          console.error('ETL Supabase RPC error:', error);
          throw new Error(`ETL RPC failed: ${error.message}`);
        }

        const result = {
          message: 'ETL diário executado com sucesso',
          event_uuid: eventUuid,
          records_processed: data?.records_processed || 0,
          records_updated: data?.records_updated || 0,
          records_created: data?.records_created || 0,
          execution_time_ms: data?.execution_time_ms || 0,
          data
        };

        const processingTime = Date.now() - startTime;

        console.debug('ETL daily process completed:', {
          event_uuid: eventUuid,
          processing_time_ms: processingTime,
          result
        });

        return reply.headers(corsHeaders).send({
          success: true,
          action: 'daily_etl',
          attributes: {
            success: true,
            summary: {
              message: 'ETL diário executado com sucesso',
              records_processed: result.records_processed,
              records_successful: result.records_updated + result.records_created,
              records_failed: 0
            },
            details: result
          },
          metadata: {
            processed_at: new Date().toISOString(),
            event_uuid: eventUuid,
            processing_time_ms: processingTime,
            action: 'daily_etl'
          }
        });

      } catch (error: any) {
        const processingTime = Date.now() - startTime;
        
        console.error('ETL daily process error:', {
          error: error.message,
          processing_time_ms: processingTime
        });

        return reply.headers(corsHeaders).code(500).send({
          success: false,
          action: 'daily_etl',
          attributes: {
            success: false,
            summary: {
              message: error.message
            }
          },
          metadata: {
            processed_at: new Date().toISOString(),
            processing_time_ms: processingTime,
            action: 'daily_etl',
            event_uuid: randomUUID()
          },
          error: {
            code: 'ETL_PROCESSING_ERROR',
            message: error.message,
            details: {
              timestamp: new Date().toISOString()
            }
          }
        });
      }
    });

    // Rota POST para ETL personalizado
    fastify.post('/api/webhooks/banban/etl/custom', {
      schema: {
        description: 'Executa ETL personalizado com parâmetros específicos',
        tags: ['Banban', 'ETL', 'Webhooks'],
        body: {
          type: 'object',
          required: ['etl_type', 'organization_id'],
          properties: {
            etl_type: { type: 'string', enum: ['inventory', 'sales', 'transfers', 'full'] },
            organization_id: { type: 'string' },
            date_from: { type: 'string', format: 'date' },
            date_to: { type: 'string', format: 'date' },
            parameters: { type: 'object' }
          }
        }
      }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
      const startTime = Date.now();
      const payload = request.body as any;

      try {
        const eventUuid = randomUUID();

        console.debug('ETL custom process started:', {
          event_uuid: eventUuid,
          etl_type: payload.etl_type,
          organization_id: payload.organization_id
        });

        // Executar ETL customizado baseado no tipo
        const { data, error } = await supabaseService.getClient().rpc('run_custom_etl', {
          etl_type: payload.etl_type,
          organization_id: payload.organization_id,
          date_from: payload.date_from,
          date_to: payload.date_to,
          parameters: payload.parameters || {}
        });

        if (error) {
          console.error('ETL Custom Supabase RPC error:', error);
          throw new Error(`Custom ETL RPC failed: ${error.message}`);
        }

        const result = {
          message: `ETL ${payload.etl_type} executado com sucesso`,
          event_uuid: eventUuid,
          etl_type: payload.etl_type,
          records_processed: data?.records_processed || 0,
          records_updated: data?.records_updated || 0,
          records_created: data?.records_created || 0,
          execution_time_ms: data?.execution_time_ms || 0,
          data
        };

        const processingTime = Date.now() - startTime;

        return reply.headers(corsHeaders).send({
          success: true,
          action: 'custom_etl',
          attributes: {
            success: true,
            summary: {
              message: result.message,
              records_processed: result.records_processed,
              records_successful: result.records_updated + result.records_created,
              records_failed: 0
            },
            details: result
          },
          metadata: {
            processed_at: new Date().toISOString(),
            event_uuid: eventUuid,
            processing_time_ms: processingTime,
            action: 'custom_etl'
          }
        });

      } catch (error: any) {
        const processingTime = Date.now() - startTime;
        
        console.error('ETL custom process error:', {
          error: error.message,
          processing_time_ms: processingTime
        });

        return reply.headers(corsHeaders).code(500).send({
          success: false,
          action: 'custom_etl',
          error: {
            code: 'ETL_CUSTOM_ERROR',
            message: error.message,
            details: {
              timestamp: new Date().toISOString()
            }
          }
        });
      }
    });

    // Rota GET para status do ETL
    fastify.get('/api/webhooks/banban/etl/status', {
      schema: {
        description: 'Consulta status das execuções ETL',
        tags: ['Banban', 'ETL'],
        querystring: {
          type: 'object',
          properties: {
            organization_id: { type: 'string' },
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 }
          }
        }
      }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const query = request.query as any;
        
        // Consultar histórico de execuções ETL
        const { data, error } = await supabaseService.getClient()
          .from('etl_execution_log')
          .select('*')
          .eq('organization_id', query.organization_id)
          .order('created_at', { ascending: false })
          .limit(query.limit || 10);

        if (error) {
          throw new Error(`Query ETL status failed: ${error.message}`);
        }

        return reply.headers(corsHeaders).send({
          success: true,
          data: {
            executions: data || [],
            total: data?.length || 0
          },
          timestamp: new Date().toISOString()
        });

      } catch (error: any) {
        console.error('ETL status query error:', error);
        return reply.headers(corsHeaders).code(500).send({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Health check específico do módulo ETL
    fastify.get('/api/integrations/banban/etl/health', {
      schema: {
        description: 'Health check do módulo ETL Flow',
        tags: ['Banban', 'ETL', 'Health']
      }
    }, async (request, reply) => {
      return reply.headers(corsHeaders).send({
        module: this.name,
        status: 'healthy',
        version: this.version,
        baseModule: this.baseModule,
        features: [
          'daily-etl',
          'custom-etl',
          'inventory-processing',
          'sales-aggregation',
          'transfer-consolidation',
          'execution-monitoring'
        ],
        etl_types: ['inventory', 'sales', 'transfers', 'full'],
        timestamp: new Date().toISOString()
      });
    });
  }

  async handleRequest(request: FastifyRequest, reply: FastifyReply): Promise<any> {
    return reply.send({ 
      message: 'BanBan ETL Flow Module is active',
      version: this.version,
      timestamp: new Date().toISOString()
    });
  }

  getModuleInfo(): ModuleInfo {
    return {
      name: this.name,
      type: 'custom',
      version: this.version,
      description: this.description,
      endpoints: [
        '/api/webhooks/banban/etl/daily',
        '/api/webhooks/banban/etl/custom',
        '/api/webhooks/banban/etl/status',
        '/api/integrations/banban/etl/health'
      ],
      features: [
        'daily-etl',
        'custom-etl',
        'inventory-processing',
        'sales-aggregation',
        'transfer-consolidation',
        'execution-monitoring'
      ],
      inheritsFrom: this.baseModule
    };
  }

  getEndpoints(): string[] {
    return this.getModuleInfo().endpoints;
  }
}