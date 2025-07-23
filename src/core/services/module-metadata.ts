// ================================================
// SERVIÇO DE METADADOS DE MÓDULOS DINÂMICO
// ================================================
// Lê informações dos módulos diretamente dos arquivos module.json
// ELIMINA todas as listas hardcoded de nomes de módulos

import path from 'path';

// Import para debug condicional
import { conditionalDebugLog } from '@/app/actions/admin/modules/system-config-utils';

// Importação condicional para evitar erros no cliente
let fs: any = null;
if (typeof window === 'undefined') {
  // Apenas no servidor
  fs = require('fs/promises');
}

export interface ModuleMetadata {
  id: string;
  name: string;
  slug: string;
  version: string;
  description: string;
  category: string;
  vendor?: string;
  author?: string;
  type: 'custom' | 'standard';
  features?: string[];
  configPath: string;
}

export class ModuleMetadataService {
  private cache = new Map<string, ModuleMetadata>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_TTL = 300000; // 5 minutos

  /**
   * Obtém metadados de um módulo específico
   */
  async getModuleMetadata(moduleId: string, modulePath?: string): Promise<ModuleMetadata | null> {
    // Não executar no cliente
    if (typeof window !== 'undefined' || !fs) {
      console.warn(`⚠️ [ModuleMetadata] getModuleMetadata() só funciona no servidor`);
      return null;
    }

    try {
      // Verificar cache primeiro
      if (this.isValidCache(moduleId)) {
        return this.cache.get(moduleId) || null;
      }

      await conditionalDebugLog(`Carregando metadados para: ${moduleId}`);

      // Se não temos o caminho, tentar descobrir
      if (!modulePath) {
        const discoveredPath = await this.discoverModulePath(moduleId);
        if (!discoveredPath) {
          await conditionalDebugLog(`Caminho não encontrado para: ${moduleId}`);
          return null;
        }
        modulePath = discoveredPath;
      }

      const configPath = path.join(modulePath, 'module.json');
      
      try {
        await fs.access(configPath);
      } catch {
        await conditionalDebugLog(`module.json não encontrado em: ${configPath}`);
        return null;
      }

      // Ler arquivo de configuração
      const configContent = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(configContent);

      // Extrair metadados
      const metadata: ModuleMetadata = {
        id: moduleId,
        name: config.name || this.formatModuleName(moduleId),
        slug: config.slug || moduleId,
        version: config.version || '1.0.0',
        description: config.description || `Módulo ${config.name || moduleId}`,
        category: config.category || 'custom',
        vendor: config.vendor,
        author: config.author,
        type: this.detectModuleType(moduleId, modulePath),
        features: config.features,
        configPath
      };

      // Cache do resultado
      this.cache.set(moduleId, metadata);
      this.cacheExpiry.set(moduleId, Date.now() + this.CACHE_TTL);

      await conditionalDebugLog(`Metadados carregados para ${moduleId}`, { name: metadata.name });
      return metadata;

    } catch (error) {
      console.error(`❌ [ModuleMetadata] Erro ao carregar metadados de ${moduleId}:`, error);
      return null;
    }
  }

  /**
   * Obtém nome amigável de um módulo (SUBSTITUI getModuleName hardcoded)
   */
  async getModuleFriendlyName(moduleId: string, modulePath?: string): Promise<string> {
    const metadata = await this.getModuleMetadata(moduleId, modulePath);
    return metadata?.name || this.formatModuleName(moduleId);
  }

  /**
   * Obtém metadados de múltiplos módulos
   */
  async getMultipleModulesMetadata(moduleIds: string[]): Promise<Map<string, ModuleMetadata>> {
    const results = new Map<string, ModuleMetadata>();
    
    await Promise.all(
      moduleIds.map(async (moduleId) => {
        const metadata = await this.getModuleMetadata(moduleId);
        if (metadata) {
          results.set(moduleId, metadata);
        }
      })
    );

    return results;
  }

  /**
   * Escaneia todos os módulos disponíveis e retorna seus metadados
   */
  async getAllModulesMetadata(): Promise<ModuleMetadata[]> {
    // Não executar no cliente
    if (typeof window !== 'undefined' || !fs) {
      console.warn(`⚠️ [ModuleMetadata] getAllModulesMetadata() só funciona no servidor`);
      return [];
    }

    const results: ModuleMetadata[] = [];

    try {
      // Diretórios base para módulos
      const moduleBases = [
        'src/core/modules/banban',
        'src/core/modules/standard'
      ];

      for (const baseDir of moduleBases) {
        try {
          const modules = await this.scanModulesInDirectory(baseDir);
          results.push(...modules);
        } catch (error) {
          console.warn(`⚠️ [ModuleMetadata] Erro ao escanear ${baseDir}:`, error);
        }
      }

      await conditionalDebugLog(`Escaneamento concluído: ${results.length} módulos encontrados`);
      return results;

    } catch (error) {
      console.error('❌ [ModuleMetadata] Erro no escaneamento geral:', error);
      return [];
    }
  }

  /**
   * Escaneia módulos em um diretório específico
   */
  private async scanModulesInDirectory(baseDir: string): Promise<ModuleMetadata[]> {
    const results: ModuleMetadata[] = [];

    try {
      const entries = await fs.readdir(baseDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const modulePath = path.join(baseDir, entry.name);
          const moduleConfigPath = path.join(modulePath, 'module.json');
          
          try {
            await fs.access(moduleConfigPath);
            
            // Determinar module ID baseado no tipo
            const moduleId = this.generateModuleId(entry.name, baseDir);
            const metadata = await this.getModuleMetadata(moduleId, modulePath);
            
            if (metadata) {
              results.push(metadata);
            }
          } catch {
            // Diretório não tem module.json, ignorar
            await conditionalDebugLog(`${entry.name} não é um módulo válido (sem module.json)`);
          }
        }
      }
    } catch (error) {
      console.error(`❌ [ModuleMetadata] Erro ao escanear ${baseDir}:`, error);
    }

    return results;
  }

  /**
   * Gera ID do módulo baseado no nome e localização
   */
  private generateModuleId(folderName: string, baseDir: string): string {
    if (baseDir.includes('banban')) {
      return `banban-${folderName}`;
    }
    return folderName;
  }

  /**
   * Detecta tipo do módulo baseado no caminho
   */
  private detectModuleType(moduleId: string, modulePath: string): 'custom' | 'standard' {
    if (modulePath.includes('banban') || moduleId.startsWith('banban-')) {
      return 'custom';
    }
    return 'standard';
  }

  /**
   * Descobre caminho de um módulo pelo ID
   */
  private async discoverModulePath(moduleId: string): Promise<string | null> {
    const possiblePaths = [
      // Módulos banban
      `src/core/modules/banban/${moduleId.replace('banban-', '')}`,
      // Módulos padrão
      `src/core/modules/standard/${moduleId}`
    ];

    for (const possiblePath of possiblePaths) {
      try {
        const configPath = path.join(possiblePath, 'module.json');
        await fs.access(configPath);
        return possiblePath;
      } catch {
        // Continuar tentando outros caminhos
      }
    }

    return null;
  }

  /**
   * Formata nome de módulo como fallback
   */
  private formatModuleName(moduleId: string): string {
    return moduleId
      .replace(/^banban-/, 'BanBan ')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }

  /**
   * Verifica se cache é válido
   */
  private isValidCache(moduleId: string): boolean {
    const expiry = this.cacheExpiry.get(moduleId);
    return expiry ? Date.now() < expiry : false;
  }

  /**
   * Limpa cache
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
    console.debug('🧹 [ModuleMetadata] Cache limpo');
  }

  /**
   * Obtém estatísticas do cache
   */
  getCacheStats(): { cached: number; total: number } {
    return {
      cached: this.cache.size,
      total: this.cache.size
    };
  }
}

// Singleton para o serviço
export const moduleMetadataService = new ModuleMetadataService();

/**
 * FUNÇÃO PRINCIPAL: Substitui getModuleName hardcoded
 * Usa metadados dinâmicos dos arquivos module.json
 */
export async function getModuleFriendlyName(moduleId: string): Promise<string> {
  return await moduleMetadataService.getModuleFriendlyName(moduleId);
}

/**
 * Obtém metadados completos de um módulo
 */
export async function getModuleMetadata(moduleId: string): Promise<ModuleMetadata | null> {
  return await moduleMetadataService.getModuleMetadata(moduleId);
} 