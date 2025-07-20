#!/usr/bin/env tsx

/**
 * Script para publicação de widgets no sistema de dashboard dinâmico
 * 
 * Este script:
 * 1. Lê arquivos widget.json dos módulos
 * 2. Valida os contratos contra o schema
 * 3. Faz upsert na tabela dashboard_widgets do Supabase
 * 4. Gera logs detalhados do processo
 * 
 * Uso:
 * npm run publish-widgets
 * npm run publish-widgets -- --module analytics
 * npm run publish-widgets -- --dry-run
 */

import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

// Carregar variáveis de ambiente
config();

// Configuração
const CONFIG = {
  modulesPath: './src/core/modules',
  schemaPath: './docs/implementations/widget-contract-schema.json',
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  logLevel: process.env.LOG_LEVEL || 'info'
} as const;

// Tipos
interface WidgetContract {
  moduleId: string;
  version: string;
  description?: string;
  widgets: Widget[];
  dependencies?: Dependency[];
}

interface Widget {
  id: string;
  title: string;
  description?: string;
  componentPath: string;
  category?: string;
  tags?: string[];
  queryConfig: QueryConfig;
  defaultParams?: Record<string, any>;
  defaultSize?: WidgetSize;
  minSize?: WidgetSize;
  maxSize?: WidgetSize;
  resizable?: boolean;
  configurable?: boolean;
  configSchema?: any;
  refreshInterval?: number;
  permissions?: string[];
  compatibility?: CompatibilityConfig;
}

interface QueryConfig {
  type: 'rpc' | 'rest' | 'sql';
  function?: string;
  endpoint?: string;
  method?: string;
  headers?: Record<string, string>;
  query?: string;
  params?: Record<string, any>;
}

interface WidgetSize {
  width: number;
  height: number;
}

interface CompatibilityConfig {
  minScreenWidth?: number;
  mobile?: boolean;
  clientTypes?: string[];
}

interface Dependency {
  moduleId: string;
  minVersion: string;
}

interface PublishResult {
  success: boolean;
  widgetsProcessed: number;
  widgetsPublished: number;
  errors: string[];
  warnings: string[];
}

// Logger
class Logger {
  private level: string;

  constructor(level: string = 'info') {
    this.level = level;
  }

  private shouldLog(level: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  debug(message: string, ...args: any[]) {
    if (this.shouldLog('debug')) {
      console.log(`🔍 [DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]) {
    if (this.shouldLog('info')) {
      console.log(`ℹ️  [INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]) {
    if (this.shouldLog('warn')) {
      console.warn(`⚠️  [WARN] ${message}`, ...args);
    }
  }

  error(message: string, ...args: any[]) {
    if (this.shouldLog('error')) {
      console.error(`❌ [ERROR] ${message}`, ...args);
    }
  }

  success(message: string, ...args: any[]) {
    console.log(`✅ [SUCCESS] ${message}`, ...args);
  }
}

// Validador de Schema
class SchemaValidator {
  private ajv: Ajv;
  private schema: any;

  constructor(schemaPath: string) {
    this.ajv = new Ajv({ allErrors: true });
    addFormats(this.ajv);
  }

  async initialize(): Promise<void> {
    try {
      const schemaContent = await fs.readFile(CONFIG.schemaPath, 'utf-8');
      this.schema = JSON.parse(schemaContent);
      this.ajv.addSchema(this.schema, 'widget-contract');
    } catch (error) {
      throw new Error(`Falha ao carregar schema: ${error instanceof Error ? error.message : error}`);
    }
  }

  validate(contract: any): { valid: boolean; errors: string[] } {
    const validate = this.ajv.getSchema('widget-contract');
    if (!validate) {
      throw new Error('Schema não encontrado');
    }

    const valid = validate(contract);
    const errors = validate.errors?.map(err => 
      `${err.instancePath || 'root'}: ${err.message}`
    ) || [];

    return { valid: !!valid, errors };
  }
}

// Publicador de Widgets
class WidgetPublisher {
  private supabase: any;
  private logger: Logger;
  private validator: SchemaValidator;

  constructor(logger: Logger, validator: SchemaValidator) {
    this.logger = logger;
    this.validator = validator;
    
    if (!CONFIG.supabaseUrl || !CONFIG.supabaseServiceKey) {
      throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar definidos');
    }

    this.supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  async findWidgetFiles(moduleFilter?: string): Promise<string[]> {
    const pattern = moduleFilter 
      ? `${CONFIG.modulesPath}/${moduleFilter}/widget.json`
      : `${CONFIG.modulesPath}/*/widget.json`;
    
    const files = await glob(pattern);
    this.logger.debug(`Encontrados ${files.length} arquivos widget.json`, files);
    return files;
  }

  async loadWidgetContract(filePath: string): Promise<WidgetContract> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const contract = JSON.parse(content);
      
      this.logger.debug(`Carregado contrato do módulo ${contract.moduleId}`, {
        widgets: contract.widgets?.length || 0,
        version: contract.version
      });

      return contract;
    } catch (error) {
      throw new Error(`Falha ao carregar ${filePath}: ${error instanceof Error ? error.message : error}`);
    }
  }

  async validateContract(contract: WidgetContract, filePath: string): Promise<void> {
    const { valid, errors } = this.validator.validate(contract);
    
    if (!valid) {
      const errorMessage = `Contrato inválido em ${filePath}:\n${errors.join('\n')}`;
      throw new Error(errorMessage);
    }

    this.logger.debug(`Contrato válido: ${contract.moduleId}`);
  }

  async publishWidget(widget: Widget, moduleId: string, moduleVersion: string, dryRun: boolean = false): Promise<void> {
    const widgetData = {
      title: widget.title,
      description: widget.description || '',
      component_path: widget.componentPath,
      module_id: moduleId,
      query_type: widget.queryConfig.type,
      query_config: widget.queryConfig,
      default_params: widget.defaultParams || {},
      default_width: widget.defaultSize?.width || 4,
      default_height: widget.defaultSize?.height || 4,
      category: widget.category || 'general',
      tags: widget.tags || [],
      version: moduleVersion,
      is_active: true
    };

    if (dryRun) {
      this.logger.info(`[DRY RUN] Widget publicado: ${moduleId}.${widget.id}`, widgetData);
      return;
    }

    try {
      // Verificar se o widget já existe
      const { data: existingWidget } = await this.supabase
        .from('dashboard_widgets')
        .select('id')
        .eq('component_path', widgetData.component_path)
        .single();

      if (existingWidget) {
        // Atualizar widget existente
        const { error: updateError } = await this.supabase
          .from('dashboard_widgets')
          .update({
            title: widgetData.title,
            description: widgetData.description,
            module_id: widgetData.module_id,
            query_type: widgetData.query_type,
            query_config: widgetData.query_config,
            default_params: widgetData.default_params,
            default_width: widgetData.default_width,
            default_height: widgetData.default_height,
            category: widgetData.category,
            tags: widgetData.tags,
            version: widgetData.version,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingWidget.id);

        if (updateError) {
          throw new Error(`Erro ao atualizar widget: ${updateError.message}`);
        }

        this.logger.success(`✅ Widget atualizado: ${widgetData.title}`);
      } else {
        // Criar novo widget
        const { error: insertError } = await this.supabase
          .from('dashboard_widgets')
          .insert({
            ...widgetData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_active: true
          });

        if (insertError) {
          throw new Error(`Erro ao criar widget: ${insertError.message}`);
        }

        this.logger.success(`✅ Widget criado: ${widgetData.title}`);
      }
    } catch (error) {
      throw new Error(`Falha ao publicar widget ${widget.id}: ${error instanceof Error ? error.message : error}`);
    }
  }

  async publishContract(contract: WidgetContract, dryRun: boolean = false): Promise<number> {
    let publishedCount = 0;

    for (const widget of contract.widgets) {
      try {
        await this.publishWidget(widget, contract.moduleId, contract.version, dryRun);
        publishedCount++;
        this.logger.success(`Publicado: ${contract.moduleId}.${widget.id} - ${widget.title}`);
      } catch (error) {
        this.logger.error(`Falha ao publicar widget ${widget.id}:`, error instanceof Error ? error.message : error);
        throw error; // Re-throw para parar o processo em caso de erro
      }
    }

    return publishedCount;
  }

  async publishModules(moduleFilter?: string, dryRun: boolean = false): Promise<PublishResult> {
    const result: PublishResult = {
      success: true,
      widgetsProcessed: 0,
      widgetsPublished: 0,
      errors: [],
      warnings: []
    };

    try {
      // Encontrar arquivos de widget
      const widgetFiles = await this.findWidgetFiles(moduleFilter);
      
      if (widgetFiles.length === 0) {
        const message = moduleFilter 
          ? `Nenhum arquivo widget.json encontrado para o módulo: ${moduleFilter}`
          : 'Nenhum arquivo widget.json encontrado';
        this.logger.warn(message);
        result.warnings.push(message);
        return result;
      }

      this.logger.info(`Processando ${widgetFiles.length} módulos...`);

      // Processar cada arquivo
      for (const filePath of widgetFiles) {
        try {
          // Carregar contrato
          const contract = await this.loadWidgetContract(filePath);
          
          // Validar contrato
          await this.validateContract(contract, filePath);
          
          // Publicar widgets
          result.widgetsProcessed += contract.widgets.length;
          const published = await this.publishContract(contract, dryRun);
          result.widgetsPublished += published;
          
          this.logger.info(`Módulo ${contract.moduleId}: ${published}/${contract.widgets.length} widgets publicados`);
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          result.errors.push(`${filePath}: ${errorMessage}`);
          result.success = false;
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(errorMessage);
      result.success = false;
    }

    return result;
  }
}

// CLI Parser
function parseArgs(): { module?: string; dryRun: boolean; help: boolean } {
  const args = process.argv.slice(2);
  const result = { module: undefined as string | undefined, dryRun: false, help: false };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--module':
      case '-m':
        result.module = args[++i];
        break;
      case '--dry-run':
      case '-d':
        result.dryRun = true;
        break;
      case '--help':
      case '-h':
        result.help = true;
        break;
    }
  }

  return result;
}

function showHelp() {
  console.log(`
📦 Widget Publisher - Sistema de Dashboard Dinâmico

USAGE:
  npm run publish-widgets [OPTIONS]

OPTIONS:
  --module, -m <name>     Publicar apenas o módulo especificado
  --dry-run, -d          Executar sem fazer alterações no banco
  --help, -h             Mostrar esta ajuda

EXAMPLES:
  npm run publish-widgets                    # Publicar todos os módulos
  npm run publish-widgets -- --module analytics     # Publicar apenas analytics
  npm run publish-widgets -- --dry-run              # Simular sem persistir

ENVIRONMENT VARIABLES:
  SUPABASE_URL                   URL do projeto Supabase
  SUPABASE_SERVICE_ROLE_KEY      Service Role Key do Supabase
  LOG_LEVEL                      Nível de log (debug, info, warn, error)
`);
}

// Main Function
async function main() {
  const args = parseArgs();
  
  if (args.help) {
    showHelp();
    process.exit(0);
  }

  const logger = new Logger(CONFIG.logLevel);
  
  logger.info('🚀 Iniciando publicação de widgets...');
  
  if (args.dryRun) {
    logger.warn('⚠️  Modo DRY RUN ativado - nenhuma alteração será persistida');
  }

  try {
    // Inicializar validador
    const validator = new SchemaValidator(CONFIG.schemaPath);
    await validator.initialize();
    logger.debug('Schema carregado com sucesso');

    // Inicializar publicador
    const publisher = new WidgetPublisher(logger, validator);

    // Executar publicação
    const result = await publisher.publishModules(args.module, args.dryRun);

    // Relatório final
    console.log('\n📊 RELATÓRIO FINAL:');
    console.log(`   Widgets processados: ${result.widgetsProcessed}`);
    console.log(`   Widgets publicados: ${result.widgetsPublished}`);
    console.log(`   Erros: ${result.errors.length}`);
    console.log(`   Warnings: ${result.warnings.length}`);

    if (result.errors.length > 0) {
      console.log('\n❌ ERROS:');
      result.errors.forEach(error => console.log(`   - ${error}`));
    }

    if (result.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      result.warnings.forEach(warning => console.log(`   - ${warning}`));
    }

    if (result.success) {
      logger.success('🎉 Publicação concluída com sucesso!');
      process.exit(0);
    } else {
      logger.error('💥 Publicação falhou');
      process.exit(1);
    }

  } catch (error) {
    logger.error('Erro fatal:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Execute se chamado diretamente
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Erro inesperado:', error);
    process.exit(1);
  });
}

export { WidgetPublisher, SchemaValidator, Logger };