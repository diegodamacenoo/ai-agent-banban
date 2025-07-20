export interface FileStatus {
  path: string;
  status: 'present' | 'missing' | 'incomplete';
  description: string;
  issues?: string[];
}

export interface SyntaxValidation {
  isValid: boolean;
  errors: {
    line: number;
    column: number;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }[];
  imports: {
    path: string;
    isValid: boolean;
    issues?: string[];
  }[];
}

export interface DependencyAnalysis {
  dependencies: {
    name: string;
    version: string;
    isCompatible: boolean;
    issues?: string[];
  }[];
  unusedImports: string[];
  circularDependencies: string[][];
}

export interface ModuleAnalysis {
  moduleId: string;
  fileStructure: FileStatus[];
  syntaxValidation: SyntaxValidation;
  dependencies: DependencyAnalysis;
  qualityMetrics: {
    cyclomaticComplexity: number;
    linesOfCode: number;
    duplicatedLines: number;
    commentCoverage: number;
  };
  lastAnalyzed: Date;
}

class ModuleAnalyzerService {
  async analyzeModule(moduleId: string): Promise<ModuleAnalysis> {
    // Simulação da análise real - em produção seria integrado com ferramentas reais
    const mockAnalysis: ModuleAnalysis = {
      moduleId,
      fileStructure: await this.analyzeFileStructure(moduleId),
      syntaxValidation: await this.validateSyntax(moduleId),
      dependencies: await this.analyzeDependencies(moduleId),
      qualityMetrics: await this.calculateQualityMetrics(moduleId),
      lastAnalyzed: new Date()
    };

    return mockAnalysis;
  }

  private async analyzeFileStructure(moduleId: string): Promise<FileStatus[]> {
    // Simula análise da estrutura de arquivos baseada no moduleId
    const standardFiles = [
      'index.ts',
      'types.ts', 
      'module.config.json',
      'README.md',
      'tests/unit.test.ts',
      'tests/integration.test.ts'
    ];

    return standardFiles.map(file => {
      // Simula verificação de arquivos com base no módulo
      const exists = Math.random() > 0.3; // 70% chance de existir
      const isComplete = exists ? Math.random() > 0.2 : false; // 80% chance de estar completo se existe

      if (!exists) {
        return {
          path: file,
          status: 'missing' as const,
          description: 'Arquivo obrigatório não encontrado',
          issues: ['Arquivo necessário para funcionamento do módulo']
        };
      }

      if (!isComplete) {
        return {
          path: file,
          status: 'incomplete' as const,
          description: 'Arquivo presente mas incompleto',
          issues: ['Faltam exports obrigatórios', 'Documentação insuficiente']
        };
      }

      return {
        path: file,
        status: 'present' as const,
        description: 'Arquivo válido e completo'
      };
    });
  }

  private async validateSyntax(moduleId: string): Promise<SyntaxValidation> {
    // Simula validação de sintaxe
    const hasErrors = Math.random() > 0.7; // 30% chance de ter erros
    
    if (!hasErrors) {
      return {
        isValid: true,
        errors: [],
        imports: [
          { path: '@/lib/utils', isValid: true },
          { path: '@/types/module', isValid: true },
          { path: '@supabase/supabase-js', isValid: true }
        ]
      };
    }

    return {
      isValid: false,
      errors: [
        {
          line: 23,
          column: 15,
          message: 'Property "config" does not exist on type "Module"',
          severity: 'error' as const
        },
        {
          line: 45,
          column: 8,
          message: 'Unused variable "tempData"',
          severity: 'warning' as const
        },
        {
          line: 67,
          column: 1,
          message: 'Missing JSDoc comment for exported function',
          severity: 'info' as const
        }
      ],
      imports: [
        { path: '@/lib/utils', isValid: true },
        { 
          path: '@/types/invalid-module', 
          isValid: false, 
          issues: ['Module not found in project'] 
        },
        { 
          path: 'lodash-extra', 
          isValid: false, 
          issues: ['Package not installed'] 
        }
      ]
    };
  }

  private async analyzeDependencies(moduleId: string): Promise<DependencyAnalysis> {
    return {
      dependencies: [
        {
          name: '@supabase/supabase-js',
          version: '^2.39.0',
          isCompatible: true
        },
        {
          name: 'lodash',
          version: '^4.17.21',
          isCompatible: false,
          issues: ['Versão desatualizada, recomendado atualizar para ^4.18.0']
        },
        {
          name: 'axios',
          version: '^1.6.0',
          isCompatible: true
        }
      ],
      unusedImports: [
        '@/lib/deprecated-utils',
        'moment',
        '@/components/old-component'
      ],
      circularDependencies: [
        ['@/modules/inventory', '@/modules/analytics', '@/modules/inventory'],
        ['@/utils/helper-a', '@/utils/helper-b', '@/utils/helper-a']
      ]
    };
  }

  private async calculateQualityMetrics(moduleId: string) {
    // Simula cálculo de métricas de qualidade
    return {
      cyclomaticComplexity: Math.floor(Math.random() * 20) + 5, // 5-25
      linesOfCode: Math.floor(Math.random() * 1000) + 200, // 200-1200
      duplicatedLines: Math.floor(Math.random() * 50), // 0-50
      commentCoverage: Math.floor(Math.random() * 40) + 60 // 60-100%
    };
  }

  async getModuleHealth(moduleId: string): Promise<{
    score: number;
    issues: string[];
    recommendations: string[];
  }> {
    const analysis = await this.analyzeModule(moduleId);
    
    // Calcula score baseado na análise
    let score = 100;
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Penaliza por arquivos faltantes
    const missingFiles = analysis.fileStructure.filter(f => f.status === 'missing').length;
    score -= missingFiles * 10;
    if (missingFiles > 0) {
      issues.push(`${missingFiles} arquivos obrigatórios faltando`);
      recommendations.push('Implemente os arquivos faltantes da estrutura padrão');
    }

    // Penaliza por erros de sintaxe
    const syntaxErrors = analysis.syntaxValidation.errors.filter(e => e.severity === 'error').length;
    score -= syntaxErrors * 15;
    if (syntaxErrors > 0) {
      issues.push(`${syntaxErrors} erros de sintaxe encontrados`);
      recommendations.push('Corrija os erros de sintaxe antes de continuar');
    }

    // Penaliza por dependências incompatíveis
    const incompatibleDeps = analysis.dependencies.dependencies.filter(d => !d.isCompatible).length;
    score -= incompatibleDeps * 8;
    if (incompatibleDeps > 0) {
      issues.push(`${incompatibleDeps} dependências incompatíveis`);
      recommendations.push('Atualize as dependências para versões compatíveis');
    }

    // Penaliza por complexidade alta
    if (analysis.qualityMetrics.cyclomaticComplexity > 15) {
      score -= 10;
      issues.push('Complexidade ciclomática muito alta');
      recommendations.push('Refatore funções complexas em funções menores');
    }

    return {
      score: Math.max(0, score),
      issues,
      recommendations
    };
  }
}

export const moduleAnalyzerService = new ModuleAnalyzerService(); 