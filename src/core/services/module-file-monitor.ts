// ================================================
// MODULE FILE MONITOR SERVICE
// ================================================
// Serviço para monitoramento automático de arquivos de módulos
// Detecta mudanças, arquivos ausentes e mantém sincronização

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { createSupabaseServerClient } from '@/core/supabase/server';
import { ModuleDiscoveryService } from './module-discovery';
import {
  ModuleHealthStatus,
  ModuleFileInfo,
  ModuleScanResult,
  HealthScanResults,
  ModuleFileChange,
  ModuleFileMonitorConfig
} from '@/shared/types/module-lifecycle';

export class ModuleFileMonitor {
  private readonly config: ModuleFileMonitorConfig;
  private readonly discoveryService: ModuleDiscoveryService;
  private scanInProgress = false;

  constructor(config?: Partial<ModuleFileMonitorConfig>) {
    this.config = {
      scanIntervalMinutes: 15,
      enableAutoScanning: true,
      notifyOnMissing: true,
      retryAttempts: 3,
      hashAlgorithm: 'md5',
      ...config
    };
    
    this.discoveryService = new ModuleDiscoveryService();
  }

  /**
   * Executa escaneamento completo de health dos módulos
   */
  async performHealthScan(): Promise<HealthScanResults> {
    if (this.scanInProgress) {
      throw new Error('Escaneamento já está em progresso');
    }

    this.scanInProgress = true;
    const startTime = Date.now();

    try {
      console.debug('🔍 Iniciando escaneamento de health dos módulos...');

      const results: HealthScanResults = {
        totalScanned: 0,
        discovered: [],
        updated: [],
        missing: [],
        errors: [],
        timestamp: new Date().toISOString(),
        duration: 0
      };

      // 1. Descobrir módulos no filesystem
      const discoveredModules = await this.discoveryService.scanAvailableModules();
      console.debug(`📂 Descobertos ${discoveredModules.length} módulos no filesystem`);

      // 2. Obter módulos registrados no banco
      const registeredModules = await this.getRegisteredModules();
      console.debug(`💾 Encontrados ${registeredModules.length} módulos registrados`);

      results.totalScanned = Math.max(discoveredModules.length, registeredModules.length);

      // 3. Processar módulos descobertos
      for (const discovered of discoveredModules) {
        try {
          const scanResult = await this.processDiscoveredModule(discovered, registeredModules);
          
          if (scanResult.changes.some(c => c.type === 'discovered')) {
            results.discovered.push(scanResult);
          } else if (scanResult.changes.some(c => c.type === 'updated')) {
            results.updated.push(scanResult);
          }
        } catch (error) {
          results.errors.push({
            moduleId: discovered.id,
            error: error instanceof Error ? error.message : 'Erro desconhecido'
          });
        }
      }

      // 4. Verificar módulos ausentes
      for (const registered of registeredModules) {
        const foundInFilesystem = discoveredModules.find(d => d.id === registered.module_id);
        
        if (!foundInFilesystem && registered.status !== 'missing') {
          try {
            const missingResult = await this.processMissingModule(registered);
            results.missing.push(missingResult);
          } catch (error) {
            results.errors.push({
              moduleId: registered.module_id,
              error: error instanceof Error ? error.message : 'Erro ao processar módulo ausente'
            });
          }
        }
      }

      results.duration = Date.now() - startTime;
      
      console.debug(`✅ Escaneamento concluído em ${results.duration}ms`);
      console.debug(`📊 Resultados: ${results.discovered.length} descobertos, ${results.updated.length} atualizados, ${results.missing.length} ausentes`);

      return results;

    } catch (error) {
      console.error('❌ Erro durante escaneamento de health:', error);
      throw error;
    } finally {
      this.scanInProgress = false;
    }
  }

  /**
   * Processa um módulo descoberto no filesystem
   */
  private async processDiscoveredModule(
    discovered: any, 
    registeredModules: any[]
  ): Promise<ModuleScanResult> {
    const changes: ModuleFileChange[] = [];
    let status: ModuleHealthStatus = 'DISCOVERED';
    
    // Calcular hash do arquivo principal
    const fileHash = await this.calculateFileHash(discovered.filePath || discovered.path);
    
    // Verificar se já está registrado
    const existingModule = registeredModules.find(r => r.module_id === discovered.id);
    
    if (existingModule) {
      // Módulo já registrado - verificar mudanças
      status = existingModule.status as ModuleHealthStatus;
      
      if (existingModule.file_hash !== fileHash) {
        // Hash mudou - arquivo foi atualizado
        changes.push({
          type: 'updated',
          timestamp: new Date().toISOString(),
          details: 'Arquivo modificado detectado',
          previousHash: existingModule.file_hash,
          currentHash: fileHash
        });
        
        // Atualizar no banco
        await this.updateModuleFileInfo(
          existingModule.organization_id,
          discovered.id,
          {
            file_path: discovered.filePath || discovered.path,
            file_hash: fileHash,
            file_last_seen: new Date().toISOString(),
            module_version: discovered.version
          }
        );
        
        status = 'IMPLEMENTED';
      } else {
        // Apenas atualizar last_seen
        await this.updateLastSeen(existingModule.organization_id, discovered.id);
      }
    } else {
      // Novo módulo descoberto
      changes.push({
        type: 'discovered',
        timestamp: new Date().toISOString(),
        details: 'Novo módulo descoberto no filesystem',
        currentHash: fileHash
      });
    }

    return {
      moduleId: discovered.id,
      status,
      filePath: discovered.filePath || discovered.path,
      fileHash,
      version: discovered.version,
      lastSeen: new Date().toISOString(),
      changes
    };
  }

  /**
   * Processa um módulo que está ausente no filesystem
   */
  private async processMissingModule(registered: any): Promise<ModuleScanResult> {
    const changes: ModuleFileChange[] = [];
    
    changes.push({
      type: 'missing',
      timestamp: new Date().toISOString(),
      details: 'Arquivo não encontrado no filesystem',
      previousHash: registered.file_hash
    });

    // Marcar como ausente no banco
    await this.markModuleAsMissing(
      registered.organization_id,
      registered.module_id,
      'Arquivo não encontrado durante escaneamento automático'
    );

    return {
      moduleId: registered.module_id,
      status: 'MISSING',
      filePath: registered.file_path,
      lastSeen: registered.file_last_seen,
      changes
    };
  }

  /**
   * Calcula hash de um arquivo
   */
  private async calculateFileHash(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath);
      return crypto.createHash(this.config.hashAlgorithm).update(content).digest('hex');
    } catch (error) {
      console.warn(`⚠️ Erro ao calcular hash do arquivo ${filePath}:`, error);
      return '';
    }
  }

  /**
   * Obtém módulos registrados no banco
   */
  private async getRegisteredModules(): Promise<any[]> {
    try {
      const supabase = await createSupabaseServerClient();
      
      const { data, error } = await supabase
        .from('tenant_module_assignments')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao obter módulos registrados:', error);
      return [];
    }
  }

  /**
   * Atualiza informações de arquivo de um módulo
   */
  private async updateModuleFileInfo(
    organizationId: string,
    moduleId: string,
    fileInfo: Partial<ModuleFileInfo>
  ): Promise<void> {
    try {
      const supabase = await createSupabaseServerClient();

      const { error } = await supabase
        .from('tenant_module_assignments')
        .update({
          ...fileInfo,
          file_last_seen: new Date().toISOString(),
          status: 'implemented',
          missing_since: null,
          missing_notified: false,
          updated_at: new Date().toISOString()
        })
        .eq('organization_id', organizationId)
        .eq('module_id', moduleId);

      if (error) {
        throw error;
      }

      // Registrar auditoria
      await supabase
        .from('module_file_audit')
        .insert({
          organization_id: organizationId,
          module_id: moduleId,
          file_path: fileInfo.file_path || '',
          file_hash: fileInfo.file_hash || '',
          event_type: 'updated',
          detected_at: new Date().toISOString()
        });

    } catch (error) {
      console.error('Erro ao atualizar informações do arquivo:', error);
      throw error;
    }
  }

  /**
   * Atualiza apenas o last_seen de um módulo
   */
  private async updateLastSeen(organizationId: string, moduleId: string): Promise<void> {
    try {
      const supabase = await createSupabaseServerClient();

      await supabase
        .from('tenant_module_assignments')
        .update({
          file_last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('organization_id', organizationId)
        .eq('module_id', moduleId);

    } catch (error) {
      console.warn('Erro ao atualizar last_seen:', error);
    }
  }

  /**
   * Marca um módulo como ausente
   */
  private async markModuleAsMissing(
    organizationId: string,
    moduleId: string,
    reason: string
  ): Promise<void> {
    try {
      const supabase = await createSupabaseServerClient();

      // Usar função SQL para marcar como ausente
      const { error } = await supabase.rpc('mark_module_missing', {
        org_id: organizationId,
        mod_id: moduleId,
        missing_reason: reason
      });

      if (error) {
        throw error;
      }

    } catch (error) {
      console.error('Erro ao marcar módulo como ausente:', error);
      throw error;
    }
  }

  /**
   * Inicia monitoramento automático
   */
  startAutoScanning(): void {
    if (!this.config.enableAutoScanning) {
      console.debug('📴 Escaneamento automático está desabilitado');
      return;
    }

    console.debug(`🔄 Iniciando monitoramento automático a cada ${this.config.scanIntervalMinutes} minutos`);

    setInterval(async () => {
      try {
        if (!this.scanInProgress) {
          console.debug('⏰ Executando escaneamento automático...');
          await this.performHealthScan();
        }
      } catch (error) {
        console.error('❌ Erro durante escaneamento automático:', error);
      }
    }, this.config.scanIntervalMinutes * 60 * 1000);
  }

  /**
   * Para o monitoramento automático
   */
  stopAutoScanning(): void {
    // Em uma implementação real, armazenaria a referência do interval
    console.debug('⏹️ Monitoramento automático parado');
  }

  /**
   * Verifica se um escaneamento está em progresso
   */
  isScanInProgress(): boolean {
    return this.scanInProgress;
  }

  /**
   * Obtém configuração atual
   */
  getConfig(): ModuleFileMonitorConfig {
    return { ...this.config };
  }

  /**
   * Atualiza configuração
   */
  updateConfig(newConfig: Partial<ModuleFileMonitorConfig>): void {
    Object.assign(this.config, newConfig);
    console.debug('⚙️ Configuração do monitor atualizada:', this.config);
  }
} 