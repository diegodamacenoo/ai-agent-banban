import {
  ModuleStructureCheck,
  StructuralCategory,
  ValidationRule,
  ModuleValidationConfig
} from '../types';
import {
  Folder,
  FileCode,
  Settings,
  Package,
  Database,
  AlertTriangle,
  CheckCircle2,
  Code2,
  Zap
} from 'lucide-react';

/**
 * Regras de validação padrão reutilizáveis.
 */
export const VALIDATION_RULES: Record<string, ValidationRule> = {
  // Regras para arquivos
  FILE_EXISTS: {
    type: 'exists',
    condition: 'file_exists',
    errorMessage: 'Arquivo obrigatório não encontrado',
    suggestion: 'Crie o arquivo baseado no template correspondente',
    autoFix: true
  },
  FILE_NOT_EMPTY: {
    type: 'content',
    condition: 'file_size > 0',
    errorMessage: 'Arquivo está vazio',
    suggestion: 'Adicione conteúdo baseado no template correspondente'
  },
  VALID_TYPESCRIPT: {
    type: 'format',
    condition: 'valid_typescript',
    errorMessage: 'Arquivo contém erros de TypeScript',
    suggestion: 'Verifique sintaxe e tipos do TypeScript'
  },
  VALID_JSON: {
    type: 'format',
    condition: 'valid_json',
    errorMessage: 'JSON inválido',
    suggestion: 'Verifique sintaxe do JSON'
  },

  // Regras para pastas
  FOLDER_EXISTS: {
    type: 'exists',
    condition: 'folder_exists',
    errorMessage: 'Pasta obrigatória não encontrada',
    suggestion: 'Crie a estrutura de pastas necessária',
    autoFix: true
  },

  // Regras para configurações
  HAS_REQUIRED_FIELDS: {
    type: 'schema',
    condition: 'has_required_fields',
    errorMessage: 'Campos obrigatórios ausentes na configuração',
    suggestion: 'Adicione os campos obrigatórios'
  },

  // Regras para dependências
  PACKAGE_INSTALLED: {
    type: 'dependency',
    condition: 'package_installed',
    errorMessage: 'Dependência não instalada',
    suggestion: 'Execute npm install para instalar as dependências'
  }
};

/**
 * Verificações estruturais para módulos Frontend.
 */
const FRONTEND_STRUCTURE_CHECKS: ModuleStructureCheck[] = [
  {
    id: 'frontend-page-tsx',
    name: 'Página Principal (page.tsx)',
    description: 'Arquivo principal da página do módulo',
    required: true,
    category: 'files',
    path: 'src/app/(protected)/[slug]/(modules)/{module}/page.tsx',
    status: 'pending',
    validationRules: [VALIDATION_RULES.FILE_EXISTS, VALIDATION_RULES.FILE_NOT_EMPTY, VALIDATION_RULES.VALID_TYPESCRIPT],
    autoFix: true,
    priority: 'critical',
    estimatedTime: '2 min'
  },
  {
    id: 'frontend-hooks-folder',
    name: 'Pasta de Hooks',
    description: 'Pasta para hooks personalizados do módulo',
    required: false,
    category: 'folders',
    path: 'src/app/(protected)/[slug]/(modules)/{module}/hooks/',
    status: 'pending',
    validationRules: [VALIDATION_RULES.FOLDER_EXISTS],
    autoFix: true,
    priority: 'medium',
    estimatedTime: '1 min'
  },
  {
    id: 'frontend-implementations-folder',
    name: 'Pasta de Implementações',
    description: 'Pasta para implementações específicas por cliente',
    required: true,
    category: 'folders',
    path: 'src/app/(protected)/[slug]/(modules)/{module}/implementations/',
    status: 'pending',
    validationRules: [VALIDATION_RULES.FOLDER_EXISTS],
    autoFix: true,
    priority: 'high',
    estimatedTime: '1 min'
  },
  {
    id: 'frontend-banban-implementation',
    name: 'Implementação Banban',
    description: 'Implementação específica para cliente Banban',
    required: false,
    category: 'files',
    path: 'src/app/(protected)/[slug]/(modules)/{module}/implementations/BanbanImplementation.tsx',
    status: 'pending',
    validationRules: [VALIDATION_RULES.FILE_EXISTS, VALIDATION_RULES.VALID_TYPESCRIPT],
    autoFix: true,
    priority: 'medium',
    estimatedTime: '5 min'
  }
];

/**
 * Verificações estruturais para módulos Backend.
 */
const BACKEND_STRUCTURE_CHECKS: ModuleStructureCheck[] = [
  {
    id: 'backend-index-ts',
    name: 'Arquivo Index Principal',
    description: 'Ponto de entrada principal do módulo backend',
    required: true,
    category: 'files',
    path: 'src/core/modules/{client}/{module}/index.ts',
    status: 'pending',
    validationRules: [VALIDATION_RULES.FILE_EXISTS, VALIDATION_RULES.FILE_NOT_EMPTY, VALIDATION_RULES.VALID_TYPESCRIPT],
    autoFix: true,
    priority: 'critical',
    estimatedTime: '3 min'
  },
  {
    id: 'backend-config-ts',
    name: 'Configuração do Módulo',
    description: 'Arquivo de configuração do módulo',
    required: true,
    category: 'files',
    path: 'src/core/modules/{client}/{module}/config.ts',
    status: 'pending',
    validationRules: [VALIDATION_RULES.FILE_EXISTS, VALIDATION_RULES.VALID_TYPESCRIPT],
    autoFix: true,
    priority: 'high',
    estimatedTime: '2 min'
  },
  {
    id: 'backend-module-json',
    name: 'Metadata do Módulo (module.json)',
    description: 'Metadados e configurações do módulo',
    required: true,
    category: 'files',
    path: 'src/core/modules/{client}/{module}/module.json',
    status: 'pending',
    validationRules: [VALIDATION_RULES.FILE_EXISTS, VALIDATION_RULES.VALID_JSON, VALIDATION_RULES.HAS_REQUIRED_FIELDS],
    autoFix: false,
    priority: 'critical',
    estimatedTime: '3 min'
  },
  {
    id: 'backend-services-folder',
    name: 'Pasta de Serviços',
    description: 'Pasta para lógica de negócio e serviços',
    required: false,
    category: 'folders',
    path: 'src/core/modules/{client}/{module}/services/',
    status: 'pending',
    validationRules: [VALIDATION_RULES.FOLDER_EXISTS],
    autoFix: true,
    priority: 'medium',
    estimatedTime: '1 min'
  },
  {
    id: 'backend-types-folder',
    name: 'Pasta de Tipos',
    description: 'Pasta para definições de tipos TypeScript',
    required: false,
    category: 'folders',
    path: 'src/core/modules/{client}/{module}/types/',
    status: 'pending',
    validationRules: [VALIDATION_RULES.FOLDER_EXISTS],
    autoFix: true,
    priority: 'medium',
    estimatedTime: '1 min'
  }
];

/**
 * Verificações de configuração e metadados.
 */
const CONFIG_STRUCTURE_CHECKS: ModuleStructureCheck[] = [
  {
    id: 'config-base-module-db',
    name: 'Base Module no Banco',
    description: 'Registro do módulo base na tabela base_modules',
    required: true,
    category: 'database',
    path: 'database:base_modules',
    status: 'pending',
    validationRules: [
      {
        type: 'exists',
        condition: 'record_exists_in_db',
        errorMessage: 'Módulo base não registrado no banco de dados',
        suggestion: 'Execute a migration para criar o registro do módulo base'
      }
    ],
    autoFix: false,
    priority: 'critical',
    estimatedTime: '5 min'
  },
  {
    id: 'config-implementation-db',
    name: 'Implementation no Banco',
    description: 'Registro da implementação na tabela module_implementations',
    required: true,
    category: 'database',
    path: 'database:module_implementations',
    status: 'pending',
    validationRules: [
      {
        type: 'exists',
        condition: 'implementation_exists_in_db',
        errorMessage: 'Implementação não registrada no banco de dados',
        suggestion: 'Execute a migration para criar o registro da implementação'
      }
    ],
    autoFix: false,
    priority: 'high',
    estimatedTime: '3 min'
  }
];

/**
 * Verificações de dependências e integrações.
 */
const DEPENDENCIES_STRUCTURE_CHECKS: ModuleStructureCheck[] = [
  {
    id: 'deps-package-json',
    name: 'Dependências no package.json',
    description: 'Verificar se dependências estão declaradas',
    required: true,
    category: 'dependencies',
    path: 'package.json',
    status: 'pending',
    validationRules: [VALIDATION_RULES.PACKAGE_INSTALLED],
    autoFix: false,
    priority: 'high',
    estimatedTime: '2 min'
  },
  {
    id: 'deps-node-modules',
    name: 'Dependências Instaladas',
    description: 'Verificar se dependências estão instaladas em node_modules',
    required: true,
    category: 'dependencies',
    path: 'node_modules',
    status: 'pending',
    validationRules: [VALIDATION_RULES.PACKAGE_INSTALLED],
    autoFix: true,
    priority: 'medium',
    estimatedTime: '30 sec'
  }
];

/**
 * Categorias de validação estrutural organizadas.
 */
export const STRUCTURAL_CATEGORIES: StructuralCategory[] = [
  {
    id: 'frontend',
    name: 'Estrutura Frontend',
    description: 'Verificações da estrutura de arquivos frontend do módulo',
    icon: Code2,
    checks: FRONTEND_STRUCTURE_CHECKS,
    overallStatus: 'pending',
    completedChecks: 0,
    totalChecks: FRONTEND_STRUCTURE_CHECKS.length,
    criticalIssues: 0
  },
  {
    id: 'backend',
    name: 'Estrutura Backend',
    description: 'Verificações da estrutura de arquivos backend do módulo',
    icon: Zap,
    checks: BACKEND_STRUCTURE_CHECKS,
    overallStatus: 'pending',
    completedChecks: 0,
    totalChecks: BACKEND_STRUCTURE_CHECKS.length,
    criticalIssues: 0
  },
  {
    id: 'config',
    name: 'Configuração e Banco',
    description: 'Verificações de configuração e registros no banco de dados',
    icon: Database,
    checks: CONFIG_STRUCTURE_CHECKS,
    overallStatus: 'pending',
    completedChecks: 0,
    totalChecks: CONFIG_STRUCTURE_CHECKS.length,
    criticalIssues: 0
  },
  {
    id: 'dependencies',
    name: 'Dependências',
    description: 'Verificações de dependências e integrações externas',
    icon: Package,
    checks: DEPENDENCIES_STRUCTURE_CHECKS,
    overallStatus: 'pending',
    completedChecks: 0,
    totalChecks: DEPENDENCIES_STRUCTURE_CHECKS.length,
    criticalIssues: 0
  }
];

/**
 * Configurações predefinidas para diferentes tipos de módulos.
 */
export const MODULE_VALIDATION_PRESETS: Record<string, ModuleValidationConfig> = {
  'standard-banban': {
    moduleType: 'standard',
    clientType: 'banban',
    enabledCategories: ['frontend', 'backend', 'config', 'dependencies'],
    skipOptional: false
  },
  'standard-riachuelo': {
    moduleType: 'standard',
    clientType: 'riachuelo',
    enabledCategories: ['frontend', 'backend', 'config', 'dependencies'],
    skipOptional: false
  },
  'custom-integration': {
    moduleType: 'integration',
    clientType: 'generic',
    enabledCategories: ['backend', 'config', 'dependencies'],
    skipOptional: true
  },
  'quick-validation': {
    moduleType: 'standard',
    enabledCategories: ['frontend', 'backend'],
    skipOptional: true
  }
};

/**
 * Configurações padrão para o sistema de tracking estrutural.
 */
export const STRUCTURAL_TRACKING_CONFIG = {
  AUTO_VALIDATION_INTERVAL: 30000, // 30 segundos
  BATCH_SIZE: 5, // Máximo de validações paralelas
  MAX_RETRY_ATTEMPTS: 3,
  VALIDATION_TIMEOUT: 10000, // 10 segundos por validação
  CACHE_DURATION: 300000, // 5 minutos
  CRITICAL_THRESHOLD: 2, // Máximo de issues críticos aceitáveis
  HEALTH_SCORE_WEIGHTS: {
    critical: 40,
    high: 30,
    medium: 20,
    low: 10
  }
};