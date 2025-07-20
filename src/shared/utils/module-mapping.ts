// ================================================
// MODULE MAPPING UTILITIES
// ================================================
// Utilitários para mapear e normalizar IDs de módulos
// Resolve discrepâncias entre banco de dados e sistema de discovery

/**
 * Mapeamento de IDs de módulos antigos/incorretos para os corretos
 */
export const MODULE_ID_MAPPING: Record<string, string> = {
  // Módulos BanBan - corrigir IDs sem prefixo
  'insights': 'banban-insights',
  'performance': 'banban-performance',
  'alerts': 'banban-alerts',
  'inventory': 'banban-inventory',
  'data-processing': 'banban-data-processing',
  
  // Módulos avançados
  'insights-advanced': 'banban-insights-advanced',
  'performance-advanced': 'banban-performance-advanced',
  'alerts-advanced': 'banban-alerts-advanced',
  'inventory-advanced': 'banban-inventory-advanced',
  'data-processing-advanced': 'banban-data-processing-advanced',
  
  // Mapeamentos reversos (caso necessário)
  'banban-insights': 'banban-insights',
  'banban-performance': 'banban-performance',
  'banban-alerts': 'banban-alerts',
  'banban-inventory': 'banban-inventory',
  'banban-data-processing': 'banban-data-processing',
};

/**
 * Mapeamento de nomes de exibição para módulos
 */
export const MODULE_NAMES: Record<string, string> = {
  'banban-insights': 'Insights Avançados',
  'banban-performance': 'Performance',
  'banban-alerts': 'Alertas',
  'banban-inventory': 'Gestão de Estoque', 
  'banban-data-processing': 'Processamento de Dados',
  'analytics': 'Analytics',
  'insights': 'Insights Avançados', // Legacy
  'performance': 'Performance', // Legacy
  'alerts': 'Alertas', // Legacy
  'inventory': 'Gestão de Estoque', // Legacy
  'data-processing': 'Processamento de Dados', // Legacy
};

/**
 * Normaliza um ID de módulo para o formato correto
 */
export function normalizeModuleId(moduleId: string, clientType?: string): string {
  // Se já está mapeado, usar o mapeamento
  if (MODULE_ID_MAPPING[moduleId]) {
    return MODULE_ID_MAPPING[moduleId];
  }
  
  // Se é um módulo BanBan sem prefixo, adicionar prefixo
  if (clientType === 'custom' && !moduleId.startsWith('banban-')) {
    const banbanModules = ['insights', 'performance', 'alerts', 'inventory', 'data-processing'];
    if (banbanModules.includes(moduleId)) {
      return `banban-${moduleId}`;
    }
  }
  
  return moduleId;
}

/**
 * Normaliza uma lista de IDs de módulos
 */
export function normalizeModuleIds(moduleIds: string[], clientType?: string): string[] {
  return moduleIds.map(id => normalizeModuleId(id, clientType));
}

/**
 * Obtém o nome de exibição de um módulo DINAMICAMENTE
 * ✅ CORRIGIDO: Usa metadados dos arquivos module.json
 */
export async function getModuleDisplayName(moduleId: string): Promise<string> {
  try {
    // Usar o serviço dinâmico
    const { getModuleFriendlyName } = await import('@/core/services/module-metadata');
    return await getModuleFriendlyName(moduleId);
  } catch (error) {
    console.warn(`⚠️ [getModuleDisplayName] Erro para ${moduleId}, usando fallback:`, error);
    
    // Fallback para o mapeamento antigo temporariamente
    return MODULE_NAMES[moduleId] || moduleId;
  }
}

/**
 * Verifica se um ID de módulo precisa ser normalizado
 */
export function needsNormalization(moduleId: string, clientType?: string): boolean {
  const normalized = normalizeModuleId(moduleId, clientType);
  return normalized !== moduleId;
}

/**
 * Migra configuração de implementação com IDs incorretos
 */
export function migrateImplementationConfig(config: any, clientType?: string): any {
  if (!config) return config;
  
  const migratedConfig = { ...config };
  
  // Migrar subscribed_modules
  if (config.subscribed_modules) {
    migratedConfig.subscribed_modules = normalizeModuleIds(config.subscribed_modules, clientType);
  }
  
  // Migrar custom_modules
  if (config.custom_modules) {
    migratedConfig.custom_modules = normalizeModuleIds(config.custom_modules, clientType);
  }
  
  // Migrar features
  if (config.features) {
    migratedConfig.features = normalizeModuleIds(config.features, clientType);
  }
  
  return migratedConfig;
}

/**
 * Verifica se uma configuração de implementação precisa ser migrada
 */
export function needsConfigMigration(config: any, clientType?: string): boolean {
  if (!config) return false;
  
  const fields = ['subscribed_modules', 'custom_modules', 'features'];
  
  for (const field of fields) {
    if (config[field] && Array.isArray(config[field])) {
      const hasOldIds = config[field].some((id: string) => needsNormalization(id, clientType));
      if (hasOldIds) return true;
    }
  }
  
  return false;
}

/**
 * Detecta o tipo de cliente baseado nos módulos configurados
 */
export function detectClientType(moduleIds: string[]): 'standard' | 'custom' {
  const hasBanbanModules = moduleIds.some(id => 
    id.startsWith('banban-') || 
    ['insights', 'performance', 'alerts', 'inventory', 'data-processing'].includes(id)
  );
  
  return hasBanbanModules ? 'custom' : 'standard';
}

/**
 * Gera relatório de migração de módulos
 */
export function generateMigrationReport(oldConfig: any, newConfig: any): {
  hasMigration: boolean;
  changes: Array<{
    field: string;
    oldValue: string[];
    newValue: string[];
    modulesMigrated: Array<{ old: string; new: string }>;
  }>;
} {
  const changes: any[] = [];
  const fields = ['subscribed_modules', 'custom_modules', 'features'];
  
  for (const field of fields) {
    const oldValue = oldConfig?.[field] || [];
    const newValue = newConfig?.[field] || [];
    
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      const modulesMigrated = oldValue.map((oldId: string, index: number) => ({
        old: oldId,
        new: newValue[index] || oldId
      })).filter((item: any) => item.old !== item.new);
      
      if (modulesMigrated.length > 0) {
        changes.push({
          field,
          oldValue,
          newValue,
          modulesMigrated
        });
      }
    }
  }
  
  return {
    hasMigration: changes.length > 0,
    changes
  };
} 