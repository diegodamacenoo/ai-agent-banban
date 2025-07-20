#!/usr/bin/env tsx

/**
 * Script para rollback de widgets no sistema de dashboard dinâmico
 * 
 * Este script permite:
 * 1. Reverter publicação de módulos específicos
 * 2. Restaurar versões anteriores de widgets
 * 3. Desativar widgets sem remover dados
 * 4. Backup antes de mudanças destrutivas
 * 
 * Uso:
 * npm run rollback-widgets -- --module analytics
 * npm run rollback-widgets -- --version 1.0.0
 * npm run rollback-widgets -- --deactivate-only
 */

import fs from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Configuração
const CONFIG = {
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  backupPath: './backups/widgets',
  logLevel: process.env.LOG_LEVEL || 'info'
} as const;

// Tipos
interface RollbackOptions {
  moduleId?: string;
  version?: string;
  deactivateOnly: boolean;
  createBackup: boolean;
  dryRun: boolean;
}

interface WidgetBackup {
  id: string;
  module_id: string;
  version: string;
  data: any;
  backup_timestamp: string;
}

interface RollbackResult {
  success: boolean;
  widgetsProcessed: number;
  widgetsAffected: number;
  backupCreated: boolean;
  backupPath?: string;
  errors: string[];
  warnings: string[];
}

// Logger (reutilizando do publish_widgets.ts)
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

// Widget Rollback Manager
class WidgetRollbackManager {
  private supabase: any;
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
    
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

  async findTargetWidgets(options: RollbackOptions): Promise<any[]> {
    let query = this.supabase.from('dashboard_widgets').select('*');

    // Filtrar por módulo
    if (options.moduleId) {
      query = query.eq('module_id', options.moduleId);
    }

    // Filtrar por versão
    if (options.version) {
      query = query.eq('version', options.version);
    }

    // Apenas widgets ativos por padrão
    if (!options.deactivateOnly) {
      query = query.eq('is_active', true);
    }

    const { data: widgets, error } = await query;

    if (error) {
      throw new Error(`Falha ao buscar widgets: ${error.message}`);
    }

    this.logger.debug(`Encontrados ${widgets?.length || 0} widgets para rollback`);
    return widgets || [];
  }

  async createBackup(widgets: any[]): Promise<string> {
    if (widgets.length === 0) {
      this.logger.warn('Nenhum widget para backup');
      return '';
    }

    // Criar diretório de backup se não existir
    await fs.mkdir(CONFIG.backupPath, { recursive: true });

    // Gerar nome do arquivo de backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `widgets-backup-${timestamp}.json`;
    const backupFilePath = path.join(CONFIG.backupPath, backupFileName);

    // Criar estrutura de backup
    const backup: WidgetBackup[] = widgets.map(widget => ({
      id: widget.id,
      module_id: widget.module_id,
      version: widget.version,
      data: widget,
      backup_timestamp: new Date().toISOString()
    }));

    const backupData = {
      created_at: new Date().toISOString(),
      widgets_count: widgets.length,
      widgets: backup
    };

    // Salvar backup
    await fs.writeFile(backupFilePath, JSON.stringify(backupData, null, 2));
    
    this.logger.success(`Backup criado: ${backupFilePath}`);
    return backupFilePath;
  }

  async deactivateWidgets(widgets: any[], dryRun: boolean = false): Promise<number> {
    if (widgets.length === 0) {
      return 0;
    }

    const widgetIds = widgets.map(w => w.id);
    
    if (dryRun) {
      this.logger.info(`[DRY RUN] Desativaria ${widgetIds.length} widgets:`, widgetIds);
      return widgetIds.length;
    }

    const { error } = await this.supabase
      .from('dashboard_widgets')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .in('id', widgetIds);

    if (error) {
      throw new Error(`Falha ao desativar widgets: ${error.message}`);
    }

    this.logger.success(`Desativados ${widgetIds.length} widgets`);
    return widgetIds.length;
  }

  async deleteWidgets(widgets: any[], dryRun: boolean = false): Promise<number> {
    if (widgets.length === 0) {
      return 0;
    }

    const widgetIds = widgets.map(w => w.id);
    
    if (dryRun) {
      this.logger.info(`[DRY RUN] Removeria ${widgetIds.length} widgets:`, widgetIds);
      return widgetIds.length;
    }

    // Primeiro, remover widgets habilitados dos tenants
    const { error: tenantError } = await this.supabase
      .from('tenant_dashboard_widgets')
      .delete()
      .in('widget_id', widgetIds);

    if (tenantError) {
      this.logger.warn(`Aviso ao remover widgets de tenants: ${tenantError.message}`);
    }

    // Depois, remover widgets da tabela principal
    const { error } = await this.supabase
      .from('dashboard_widgets')
      .delete()
      .in('id', widgetIds);

    if (error) {
      throw new Error(`Falha ao remover widgets: ${error.message}`);
    }

    this.logger.success(`Removidos ${widgetIds.length} widgets`);
    return widgetIds.length;
  }

  async restoreFromBackup(backupPath: string, dryRun: boolean = false): Promise<number> {
    try {
      const backupContent = await fs.readFile(backupPath, 'utf-8');
      const backupData = JSON.parse(backupContent);
      
      if (!backupData.widgets || !Array.isArray(backupData.widgets)) {
        throw new Error('Formato de backup inválido');
      }

      const widgets = backupData.widgets.map((backup: WidgetBackup) => backup.data);
      
      if (dryRun) {
        this.logger.info(`[DRY RUN] Restauraria ${widgets.length} widgets do backup`);
        return widgets.length;
      }

      // Restaurar widgets
      const { error } = await this.supabase
        .from('dashboard_widgets')
        .upsert(widgets, { onConflict: 'id' });

      if (error) {
        throw new Error(`Falha ao restaurar backup: ${error.message}`);
      }

      this.logger.success(`Restaurados ${widgets.length} widgets do backup`);
      return widgets.length;

    } catch (error) {
      throw new Error(`Falha ao ler backup: ${error instanceof Error ? error.message : error}`);
    }
  }

  async executeRollback(options: RollbackOptions): Promise<RollbackResult> {
    const result: RollbackResult = {
      success: true,
      widgetsProcessed: 0,
      widgetsAffected: 0,
      backupCreated: false,
      errors: [],
      warnings: []
    };

    try {
      // Encontrar widgets alvo
      const widgets = await this.findTargetWidgets(options);
      result.widgetsProcessed = widgets.length;

      if (widgets.length === 0) {
        const message = 'Nenhum widget encontrado para rollback';
        this.logger.warn(message);
        result.warnings.push(message);
        return result;
      }

      this.logger.info(`Processando rollback de ${widgets.length} widgets...`);

      // Criar backup se solicitado
      if (options.createBackup) {
        try {
          result.backupPath = await this.createBackup(widgets);
          result.backupCreated = true;
        } catch (error) {
          const errorMessage = `Falha ao criar backup: ${error instanceof Error ? error.message : error}`;
          result.warnings.push(errorMessage);
          this.logger.warn(errorMessage);
        }
      }

      // Executar rollback
      if (options.deactivateOnly) {
        result.widgetsAffected = await this.deactivateWidgets(widgets, options.dryRun);
      } else {
        result.widgetsAffected = await this.deleteWidgets(widgets, options.dryRun);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(errorMessage);
      result.success = false;
    }

    return result;
  }

  async listBackups(): Promise<string[]> {
    try {
      const files = await fs.readdir(CONFIG.backupPath);
      return files.filter(file => file.startsWith('widgets-backup-') && file.endsWith('.json'));
    } catch (error) {
      this.logger.warn('Diretório de backup não encontrado ou vazio');
      return [];
    }
  }
}

// CLI Parser
function parseArgs(): RollbackOptions & { help: boolean; listBackups: boolean; restoreBackup?: string } {
  const args = process.argv.slice(2);
  const result = {
    moduleId: undefined as string | undefined,
    version: undefined as string | undefined,
    deactivateOnly: false,
    createBackup: true,
    dryRun: false,
    help: false,
    listBackups: false,
    restoreBackup: undefined as string | undefined
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--module':
      case '-m':
        result.moduleId = args[++i];
        break;
      case '--version':
      case '-v':
        result.version = args[++i];
        break;
      case '--deactivate-only':
      case '-d':
        result.deactivateOnly = true;
        break;
      case '--no-backup':
        result.createBackup = false;
        break;
      case '--dry-run':
        result.dryRun = true;
        break;
      case '--list-backups':
      case '-l':
        result.listBackups = true;
        break;
      case '--restore':
      case '-r':
        result.restoreBackup = args[++i];
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
🔄 Widget Rollback - Sistema de Dashboard Dinâmico

USAGE:
  npm run rollback-widgets [OPTIONS]

OPTIONS:
  --module, -m <name>        Rollback apenas do módulo especificado
  --version, -v <version>    Rollback de versão específica
  --deactivate-only, -d      Apenas desativar (não remover)
  --no-backup               Não criar backup antes do rollback
  --dry-run                 Simular sem fazer alterações
  --list-backups, -l        Listar backups disponíveis
  --restore, -r <file>      Restaurar de backup específico
  --help, -h                Mostrar esta ajuda

EXAMPLES:
  npm run rollback-widgets -- --module analytics        # Rollback do módulo analytics
  npm run rollback-widgets -- --version 1.0.0          # Rollback da versão 1.0.0
  npm run rollback-widgets -- --deactivate-only        # Apenas desativar widgets
  npm run rollback-widgets -- --list-backups           # Listar backups
  npm run rollback-widgets -- --restore widgets-backup-2025-06-30.json

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
  
  try {
    const manager = new WidgetRollbackManager(logger);

    // Listar backups
    if (args.listBackups) {
      const backups = await manager.listBackups();
      console.log('\n📋 BACKUPS DISPONÍVEIS:');
      if (backups.length === 0) {
        console.log('   Nenhum backup encontrado');
      } else {
        backups.forEach(backup => console.log(`   - ${backup}`));
      }
      process.exit(0);
    }

    // Restaurar backup
    if (args.restoreBackup) {
      logger.info(`🔄 Restaurando backup: ${args.restoreBackup}`);
      
      if (args.dryRun) {
        logger.warn('⚠️  Modo DRY RUN ativado - nenhuma alteração será persistida');
      }

      const backupPath = path.join(CONFIG.backupPath, args.restoreBackup);
      const restored = await manager.restoreFromBackup(backupPath, args.dryRun);
      
      logger.success(`🎉 Backup restaurado: ${restored} widgets`);
      process.exit(0);
    }

    // Rollback normal
    logger.info('🔄 Iniciando rollback de widgets...');
    
    if (args.dryRun) {
      logger.warn('⚠️  Modo DRY RUN ativado - nenhuma alteração será persistida');
    }

    const result = await manager.executeRollback(args);

    // Relatório final
    console.log('\n📊 RELATÓRIO DE ROLLBACK:');
    console.log(`   Widgets processados: ${result.widgetsProcessed}`);
    console.log(`   Widgets afetados: ${result.widgetsAffected}`);
    console.log(`   Backup criado: ${result.backupCreated ? 'Sim' : 'Não'}`);
    if (result.backupPath) {
      console.log(`   Caminho do backup: ${result.backupPath}`);
    }
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
      logger.success('🎉 Rollback concluído com sucesso!');
      process.exit(0);
    } else {
      logger.error('💥 Rollback falhou');
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

export { WidgetRollbackManager };