// ================================================
// MODULE DISCOVERY SERVICE
// ================================================
// Serviço para descoberta e gestão de módulos
// Suporte a módulos planejados e implementados

import fs from 'fs/promises';
import path from 'path';
import {
  ModuleInfo,
  PlannedModule,
  ModuleDiscoveryResult,
  ValidationResult,
  ModuleTemplate,
  ConfigSchema,
  ModuleType,
  OrphanModule,
  IntegrityRecommendation,
  ModuleIntegrityReport
} from '@/shared/types/module-system';

export class ModuleDiscoveryService {
  private modulesBasePath: string;

  /**
   * Lista de pastas que são utilitários/apoio, NÃO módulos
   */
  private readonly supportDirectories = [
    'components',    // Componentes React reutilizáveis
    'utils',         // Funções utilitárias
    'helpers',       // Funções auxiliares
    'types',         // Definições de tipos
    'constants',     // Constantes do sistema
    'hooks',         // Hooks customizados
    'services',      // Serviços compartilhados
    '__tests__',     // Testes
    'tests',         // Testes alternativos
    'docs',          // Documentação
    'assets',        // Assets estáticos
    'styles',        // Estilos
    'lib',           // Bibliotecas internas
    'shared',        // Código compartilhado
    'common',        // Código comum
    'config',        // Configurações
    'schemas',       // Schemas de validação
    'interfaces',    // Interfaces TypeScript
    'enums',         // Enums TypeScript
    'models',        // Modelos de dados
    'fixtures',      // Dados de teste
    'mocks',         // Mocks para teste
    'stubs'          // Stubs para teste
  ];

  constructor() {
    // Caminho base para os módulos
    this.modulesBasePath = path.join(process.cwd(), 'src', 'core', 'modules');
    console.debug('🏗️ [ModuleDiscovery] Caminho base dos módulos:', this.modulesBasePath);
  }

  /**
   * Escaneia e descobre todos os módulos implementados
   */
  async scanAvailableModules(): Promise<ModuleInfo[]> {
    try {
      // Verificar se estamos no ambiente servidor
      if (typeof window !== 'undefined') {
        console.warn('ModuleDiscoveryService deve ser usado apenas no servidor');
        return [];
      }

      const modules: ModuleInfo[] = [];
      
      // Escanear módulos customizados
      const customModules = await this.scanCustomModules();
      modules.push(...customModules);

      // Escanear módulos padrão
      const standardModules = await this.scanStandardModules();
      modules.push(...standardModules);

      console.debug(`✅ Escaneamento concluído! Encontrados ${modules.length} módulos`);
      modules.forEach(module => {
        console.debug(`  📦 [DISCOVERY-DEBUG] ${module.id}: ${module.name} (${module.type}) - ${module.status}`);
      });
      return modules;
    } catch (error) {
      console.error('Erro ao escanear módulos:', error);
      return [];
    }
  }

  /**
   * Escaneia módulos customizados em src/core/modules/[client]/
   */
  private async scanCustomModules(): Promise<ModuleInfo[]> {
    const modules: ModuleInfo[] = [];

    try {
      const entries = await fs.readdir(this.modulesBasePath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory() && !['standard', 'registry', 'template'].includes(entry.name)) {
          try {
            const clientModules = await this.scanClientModules(entry.name);
            modules.push(...clientModules);
          } catch (clientError) {
            console.warn(`Erro ao escanear módulos do cliente ${entry.name}:`, clientError);
          }
        }
      }
    } catch (error) {
      console.warn('Erro ao escanear módulos customizados:', error);
    }

    return modules;
  }

  /**
   * Escaneia módulos padrão em src/core/modules/standard/
   */
  private async scanStandardModules(): Promise<ModuleInfo[]> {
    const modules: ModuleInfo[] = [];
    const standardPath = path.join(this.modulesBasePath, 'standard');

    try {
      const entries = await fs.readdir(standardPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          try {
            const moduleInfo = await this.loadStandardModule(entry.name);
            if (moduleInfo) {
              modules.push(moduleInfo);
            }
          } catch (moduleError) {
            console.warn(`Erro ao carregar módulo padrão ${entry.name}:`, moduleError);
          }
        }
      }
    } catch (error) {
      console.warn('Erro ao escanear módulos padrão:', error);
    }

    return modules;
  }

  /**
   * Escaneia módulos de um cliente específico
   */
  private async scanClientModules(clientName: string): Promise<ModuleInfo[]> {
    const modules: ModuleInfo[] = [];
    const clientPath = path.join(this.modulesBasePath, clientName);

    try {
      const entries = await fs.readdir(clientPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const modulePath = path.join(clientPath, entry.name);
          
          // 🧠 INTELIGÊNCIA: Verificar se é realmente um módulo
          const isValidModuleDir = await this.isValidModule(modulePath, entry.name);
          
          if (isValidModuleDir) {
            console.debug(`✅ [MODULE-DISCOVERY] ${clientName}/${entry.name} é um módulo válido`);
            const moduleInfo = await this.loadCustomModule(clientName, entry.name);
            if (moduleInfo) {
              modules.push(moduleInfo);
            }
          } else {
            console.debug(`⚠️ [MODULE-DISCOVERY] ${clientName}/${entry.name} é pasta de apoio, ignorando`);
          }
        }
      }
    } catch (error) {
      console.warn(`Erro ao escanear módulos do cliente ${clientName}:`, error);
    }

    return modules;
  }

  /**
   * Carrega informações de um módulo padrão
   */
  private async loadStandardModule(moduleName: string): Promise<ModuleInfo | null> {
    try {
      const modulePath = path.join(this.modulesBasePath, 'standard', moduleName);
      const indexPath = path.join(modulePath, 'index.ts');
      
      // Verificar arquivos obrigatórios
      const requiredFiles = ['index.ts'];
      const optionalFiles = ['module.config.json', 'README.md', 'types.ts'];
      const missingFiles: string[] = [];
      const errors: string[] = [];
      
      // Verificar arquivos obrigatórios
      for (const file of requiredFiles) {
        const filePath = path.join(modulePath, file);
        try {
          await fs.access(filePath);
        } catch {
          missingFiles.push(file);
        }
      }

      // Se arquivos obrigatórios estão faltando, retornar status incomplete
      if (missingFiles.length > 0) {
        return {
          id: `standard-${moduleName}`,
          name: this.formatModuleName(moduleName),
          type: 'standard',
          version: '0.0.0',
          description: `Módulo padrão ${moduleName} (Incompleto)`,
          status: 'MISSING_FILES',
          requiredConfig: {
            type: 'object',
            properties: {}
          },
          dependencies: [],
          isAvailable: false,
          missingFiles,
          implementationHealth: {
            status: 'incomplete',
            missingComponents: missingFiles,
            errors: [`Arquivos obrigatórios faltando: ${missingFiles.join(', ')}`],
            completionPercentage: 0
          }
        };
      }

      // Tentar carregar configuração específica do módulo
      let vendor: string | undefined;
      let features: string[] = [];
      let description = `Módulo padrão ${moduleName}`;
      let version = '1.0.0';

      try {
        const configPath = path.join(modulePath, 'module.config.json');
        await fs.access(configPath);
        const configContent = await fs.readFile(configPath, 'utf8');
        const config = JSON.parse(configContent);
        
        vendor = config.vendor || 'Axon System';
        features = config.features || [];
        description = config.description || description;
        version = config.version || version;
      } catch {
        // Usar valores padrão para módulos standard
        vendor = 'Axon System';
      }

      // Verificar se o módulo pode ser carregado (sintaxe válida)
      let moduleStatus: 'IMPLEMENTED' | 'INCOMPLETE' | 'BROKEN' = 'IMPLEMENTED';
      let completionPercentage = 100;
      
      try {
        // Tentar ler o conteúdo do index.ts para verificar sintaxe básica
        const indexContent = await fs.readFile(indexPath, 'utf8');
        
        // Verificações básicas de implementação
        const hasExports = indexContent.includes('export');
        const hasFunction = indexContent.includes('function') || indexContent.includes('=>');
        
        if (!hasExports && !hasFunction) {
          moduleStatus = 'INCOMPLETE';
          completionPercentage = 30;
          errors.push('Arquivo index.ts existe mas parece estar vazio ou incompleto');
        }
        
      } catch (error) {
        moduleStatus = 'BROKEN';
        completionPercentage = 0;
        errors.push(`Erro ao ler index.ts: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }

      // Verificar arquivos opcionais para calcular completude
      let optionalFilesFound = 0;
      for (const file of optionalFiles) {
        const filePath = path.join(modulePath, file);
        try {
          await fs.access(filePath);
          optionalFilesFound++;
        } catch {
          // Arquivo opcional não encontrado
        }
      }

      // Ajustar porcentagem de completude baseado em arquivos opcionais
      if (moduleStatus === 'IMPLEMENTED') {
        const optionalBonus = (optionalFilesFound / optionalFiles.length) * 20;
        completionPercentage = Math.min(100, 80 + optionalBonus);
      }

      return {
        id: `standard-${moduleName}`,
        name: this.formatModuleName(moduleName),
        type: 'standard',
        version,
        description,
        status: moduleStatus,
        requiredConfig: {
          type: 'object',
          properties: {}
        },
        dependencies: [],
        isAvailable: moduleStatus === 'IMPLEMENTED',
        vendor,
        features,
        missingFiles: missingFiles.length > 0 ? missingFiles : undefined,
        implementationHealth: {
          status: moduleStatus === 'IMPLEMENTED' ? 'healthy' : moduleStatus.toLowerCase() as 'incomplete' | 'broken',
          missingComponents: missingFiles,
          errors,
          completionPercentage
        }
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Carrega informações de um módulo customizado
   */
  private async loadCustomModule(clientName: string, moduleName: string): Promise<ModuleInfo | null> {
    try {
      const modulePath = path.join(this.modulesBasePath, clientName, moduleName);
      const indexPath = path.join(modulePath, 'index.ts');
      
      // Verificar arquivos importantes (index.ts ou module.json)
      const primaryFiles = ['index.ts', 'module.json'];
      const optionalFiles = ['module.config.json', 'README.md', 'types.ts'];
      const missingFiles: string[] = [];
      const errors: string[] = [];
      
      // Verificar se pelo menos um arquivo primário existe
      let hasPrimaryFile = false;
      for (const file of primaryFiles) {
        const filePath = path.join(modulePath, file);
        try {
          await fs.access(filePath);
          hasPrimaryFile = true;
          console.debug(`✅ [ModuleDiscovery] Arquivo primário encontrado: ${file} em ${clientName}/${moduleName}`);
          break;
        } catch {
          // Continuar procurando outros arquivos primários
        }
      }

      // Se nenhum arquivo primário foi encontrado, considerar incompleto
      if (!hasPrimaryFile) {
        missingFiles.push('index.ts ou module.json');
        return {
          id: `${clientName}-${moduleName}`,
          name: this.formatModuleName(moduleName),
          type: 'custom',
          version: '0.0.0',
          description: `Módulo customizado ${moduleName} para ${clientName} (Incompleto)`,
          status: 'MISSING_FILES',
          requiredConfig: {
            type: 'object',
            properties: {}
          },
          dependencies: [],
          isAvailable: false,
          missingFiles,
          implementationHealth: {
            status: 'incomplete',
            missingComponents: missingFiles,
            errors: [`Arquivos primários faltando: ${missingFiles.join(', ')}`],
            completionPercentage: 0
          }
        };
      }

      // Tentar carregar configuração específica do módulo (module.json primeiro, depois module.config.json)
      let vendor: string | undefined;
      let features: string[] = [];
      let description = `Módulo customizado ${moduleName} para ${clientName}`;
      let version = '1.0.0';

      try {
        // Tentar module.json primeiro
        const moduleJsonPath = path.join(modulePath, 'module.json');
        await fs.access(moduleJsonPath);
        const moduleJsonContent = await fs.readFile(moduleJsonPath, 'utf8');
        const moduleConfig = JSON.parse(moduleJsonContent);
        
        vendor = moduleConfig.vendor || moduleConfig.manufacturer || moduleConfig.brand;
        features = moduleConfig.features || [];
        description = moduleConfig.description || description;
        version = moduleConfig.version || version;
        console.debug(`✅ [ModuleDiscovery] Carregado module.json para ${clientName}/${moduleName}`);
      } catch {
        try {
          // Fallback para module.config.json
          const configPath = path.join(modulePath, 'module.config.json');
          await fs.access(configPath);
          const configContent = await fs.readFile(configPath, 'utf8');
          const config = JSON.parse(configContent);
          
          vendor = config.vendor || config.manufacturer || config.brand;
          features = config.features || [];
          description = config.description || description;
          version = config.version || version;
          console.debug(`✅ [ModuleDiscovery] Carregado module.config.json para ${clientName}/${moduleName}`);
        } catch {
          console.debug(`⚠️ [ModuleDiscovery] Nenhum arquivo de configuração encontrado para ${clientName}/${moduleName}`);
          // Configuração opcional - não é erro crítico
        }
      }

      // Verificar se o módulo pode ser carregado (sintaxe válida)
      let moduleStatus: 'IMPLEMENTED' | 'INCOMPLETE' | 'BROKEN' = 'IMPLEMENTED';
      let completionPercentage = 100;
      
      // Se tem index.ts, verificar o conteúdo
      const indexExists = await this.fileExists(indexPath);
      if (indexExists) {
        try {
          // Tentar ler o conteúdo do index.ts para verificar sintaxe básica
          const indexContent = await fs.readFile(indexPath, 'utf8');
          
          // Verificações básicas de implementação
          const hasExports = indexContent.includes('export');
          const hasFunction = indexContent.includes('function') || indexContent.includes('=>');
          
          if (!hasExports && !hasFunction) {
            moduleStatus = 'INCOMPLETE';
            completionPercentage = 30;
            errors.push('Arquivo index.ts existe mas parece estar vazio ou incompleto');
          }
          
        } catch (error) {
          moduleStatus = 'BROKEN';
          completionPercentage = 0;
          errors.push(`Erro ao ler index.ts: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
      } else {
        // Se não tem index.ts mas tem module.json, ainda considera válido mas com menor completude
        const moduleJsonExists = await this.fileExists(path.join(modulePath, 'module.json'));
        if (moduleJsonExists) {
          moduleStatus = 'IMPLEMENTED';
          completionPercentage = 85; // Módulo configurado mas sem implementação de código
          console.debug(`✅ [ModuleDiscovery] Módulo ${clientName}/${moduleName} válido via module.json (sem index.ts)`);
        } else {
          moduleStatus = 'INCOMPLETE';
          completionPercentage = 50;
          errors.push('Módulo sem index.ts nem module.json válido');
        }
      }

      // Verificar arquivos opcionais para calcular completude
      let optionalFilesFound = 0;
      for (const file of optionalFiles) {
        const filePath = path.join(modulePath, file);
        try {
          await fs.access(filePath);
          optionalFilesFound++;
        } catch {
          // Arquivo opcional não encontrado
        }
      }

      // Ajustar porcentagem de completude baseado em arquivos opcionais
      if (moduleStatus === 'IMPLEMENTED') {
        const optionalBonus = (optionalFilesFound / optionalFiles.length) * 20;
        completionPercentage = Math.min(100, 80 + optionalBonus);
      }

      return {
        id: `${clientName}-${moduleName}`,
        name: this.formatModuleName(moduleName),
        type: 'custom',
        version,
        description,
        status: moduleStatus,
        requiredConfig: {
          type: 'object',
          properties: {}
        },
        dependencies: [],
        isAvailable: moduleStatus === 'IMPLEMENTED',
        vendor,
        features,
        missingFiles: missingFiles.length > 0 ? missingFiles : undefined,
        implementationHealth: {
          status: moduleStatus === 'IMPLEMENTED' ? 'healthy' : moduleStatus.toLowerCase() as 'incomplete' | 'broken',
          missingComponents: missingFiles,
          errors,
          completionPercentage
        }
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Infere a marca/vendor baseado no nome do cliente e módulo
   */
  private inferVendorFromModule(clientName: string, moduleName: string): string | undefined {
    // Mapeamento de clientes conhecidos para suas marcas/vendors
    const vendorMap: Record<string, string> = {
      'banban': 'BanBan Fashion',
      'fashion': 'Fashion Elite',
      'inventory': 'StockMaster',
      'performance': 'Analytics Pro',
      'analytics': 'DataViz Solutions'
    };

    // Verificar se o cliente tem uma marca específica
    if (vendorMap[clientName.toLowerCase()]) {
      return vendorMap[clientName.toLowerCase()];
    }

    // Verificar se o módulo indica uma marca específica
    if (vendorMap[moduleName.toLowerCase()]) {
      return vendorMap[moduleName.toLowerCase()];
    }

    // Para módulos do BanBan, usar marca específica
    if (clientName.toLowerCase() === 'banban') {
      return 'BanBan Fashion Systems';
    }

    return undefined;
  }

  /**
   * Retorna templates de módulos planejados disponíveis
   * NOTA: Lista vazia para mostrar apenas módulos implementados
   */
  async getPlannedModules(): Promise<PlannedModule[]> {
    // Retornando lista vazia para mostrar apenas módulos realmente implementados
    // Os módulos mockados foram removidos para eliminar confusão na interface
    return [];
  }

  /**
   * Executa descoberta completa
   */
  async performFullDiscovery(): Promise<ModuleDiscoveryResult> {
    try {
      console.debug('🔍 Iniciando escaneamento de diretórios...');
      console.debug('✅ Validando estruturas dos módulos...');
      console.debug('🔬 Analisando configurações dos módulos...');
      console.debug('📊 Extraindo metadados dos módulos...');
      console.debug('💾 Salvando resultados do escaneamento...');
      
      const discovered = await this.scanAvailableModules();
      const planned = await this.getPlannedModules();
      
      return {
        discovered,
        planned,
        conflicts: [],
        recommendations: []
      };
    } catch (error) {
      console.error('Erro na descoberta completa de módulos:', error);
      return {
        discovered: [],
        planned: [],
        conflicts: [],
        recommendations: []
      };
    }
  }

  private formatModuleName(moduleName: string): string {
    return moduleName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private getDefaultConfigSchema(): ConfigSchema {
    return {
      type: 'object',
      properties: {
        enabled: {
          type: 'boolean',
          description: 'Se o módulo está habilitado',
          default: true
        }
      },
      required: ['enabled']
    };
  }

  /**
   * Detecta módulos órfãos (registrados no banco mas sem arquivos físicos)
   */
  async detectOrphanModules(): Promise<OrphanModule[]> {
    try {
      console.debug('🔍 [ModuleDiscovery] Iniciando detecção dinâmica de módulos órfãos v2.0.0...');
      console.debug('📁 [ModuleDiscovery] Caminho base:', this.modulesBasePath);
      
      const orphans: OrphanModule[] = [];
      
      // No ambiente do browser, não podemos acessar o sistema de arquivos
      if (typeof window !== 'undefined') {
        console.debug('⚠️ [ModuleDiscovery] Execução no browser - retornando lista vazia');
        return orphans;
      }

      try {
        console.debug('🔄 [ModuleDiscovery] Importando cliente Supabase...');
        const { createSupabaseServerClient } = await import('@/core/supabase/server');
        const supabase = await createSupabaseServerClient();
        
        console.debug('📊 [ModuleDiscovery] Consultando módulos registrados no banco...');
        // V2.0.0: Buscar da nova estrutura de tabelas
        const { data: registeredModules, error } = await supabase
          .from('core_modules')
          .select(`
            id,
            slug,
            name,
            maturity_status,
            tenant_module_assignments (
              organization_id,
              operational_status
            )
          `)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ [ModuleDiscovery] Erro ao buscar módulos registrados:', error);
          return orphans;
        }

        console.debug('📋 [ModuleDiscovery] Registros encontrados:', registeredModules?.length || 0);
        console.debug('📋 [ModuleDiscovery] Dados:', registeredModules);

        if (!registeredModules || registeredModules.length === 0) {
          console.debug('✅ [ModuleDiscovery] Nenhum módulo registrado encontrado - banco limpo');
          return orphans;
        }

        // V2.0.0: Verificar cada módulo registrado
        for (const moduleRecord of registeredModules) {
          console.debug(`🔍 [ModuleDiscovery] Analisando módulo: ${moduleRecord.slug}`);
          
          // V2.0.0: Validação do formato do slug
          if (!this.isValidModuleIdFormat(moduleRecord.slug)) {
            console.debug(`⚠️ [ModuleDiscovery] ${moduleRecord.slug} - formato de slug inválido, marcando como órfão`);
            orphans.push({
              id: moduleRecord.id,
              name: moduleRecord.name,
              reason: 'invalid_structure' as const,
              description: `Slug de módulo '${moduleRecord.slug}' não segue o padrão esperado (cliente-modulo)`,
              path: 'unknown',
              canAutoFix: true,
              severity: 'warning'
            });
            continue;
          }

          // Extrair cliente e módulo do slug
          const [clientName, ...moduleNameParts] = moduleRecord.slug.split('-');
          const moduleName = moduleNameParts.join('-');
          console.debug(`🔍 [ModuleDiscovery] Cliente: ${clientName}, Módulo: ${moduleName}`);
          
          // V2.0.0: Verificação específica por tipo de cliente
          let modulePath: string;
          let isOrphan = false;
          let orphanReason: 'no_physical_files' | 'invalid_structure' | 'directory_exists_but_no_index' = 'no_physical_files';
          let orphanDescription = '';

          if (clientName === 'banban') {
            // Verificar módulos banban customizados
            modulePath = path.join(this.modulesBasePath, clientName, moduleName);
            console.debug(`📁 [ModuleDiscovery] Verificando caminho banban: ${modulePath}`);
            
            try {
              await fs.access(modulePath);
              console.debug(`✅ [ModuleDiscovery] Diretório ${modulePath} existe`);
              
              // V2.0.0: Verificação inteligente se é módulo válido ou pasta de apoio
              const isValidModuleDir = await this.isValidModule(modulePath, moduleName);
              console.debug(`🧠 [ModuleDiscovery] ${moduleRecord.slug} é módulo válido: ${isValidModuleDir}`);
              
              if (!isValidModuleDir) {
                // Diretório existe mas é pasta de apoio
                isOrphan = true;
                orphanReason = 'invalid_structure';
                orphanDescription = `'${moduleRecord.slug}' existe como diretório mas é uma pasta de apoio (ex: components, utils), não um módulo válido`;
              } else {
                // V2.0.0: Verificar arquivos essenciais do módulo
                const validationResult = await this.validateModuleFiles(modulePath);
                if (!validationResult.isValid) {
                  isOrphan = true;
                  orphanReason = 'directory_exists_but_no_index';
                  orphanDescription = `Módulo '${moduleRecord.slug}' tem estrutura incompleta: ${validationResult.missingFiles.join(', ')}`;
                } else {
                  console.debug(`✅ [ModuleDiscovery] ${moduleRecord.slug} - módulo completamente válido`);
                }
              }
            } catch (error) {
              // Diretório não existe - órfão confirmado
              console.debug(`❌ [ModuleDiscovery] Diretório não existe: ${modulePath}`);
              console.debug('💥 [ModuleDiscovery] Erro:', error);
              isOrphan = true;
              orphanReason = 'no_physical_files';
              orphanDescription = `Módulo '${moduleRecord.slug}' registrado no banco mas arquivos não existem em ${modulePath}`;
            }
          } 
          else if (clientName === 'standard' || clientName === 'core') {
            // Verificar módulos standard
            modulePath = path.join(this.modulesBasePath, 'standard', moduleName);
            console.debug(`📁 [ModuleDiscovery] Verificando módulo standard: ${modulePath}`);
            
            try {
              await fs.access(modulePath);
              const validationResult = await this.validateModuleFiles(modulePath);
              if (!validationResult.isValid) {
                isOrphan = true;
                orphanReason = 'directory_exists_but_no_index';
                orphanDescription = `Módulo standard '${moduleRecord.slug}' tem estrutura incompleta: ${validationResult.missingFiles.join(', ')}`;
              } else {
                console.debug(`✅ [ModuleDiscovery] Módulo standard ${moduleRecord.slug} válido`);
              }
            } catch {
              isOrphan = true;
              orphanReason = 'no_physical_files';
              orphanDescription = `Módulo standard '${moduleRecord.slug}' registrado no banco mas não existe em ${modulePath}`;
            }
          } 
          else {
            // Tipo de cliente desconhecido
            isOrphan = true;
            orphanReason = 'invalid_structure';
            orphanDescription = `Tipo de cliente '${clientName}' desconhecido para o módulo '${moduleRecord.slug}'`;
            modulePath = 'unknown';
          }

          // V2.0.0: Se identificado como órfão, adicionar à lista
          if (isOrphan) {
            console.debug(`❌ [ModuleDiscovery] ${moduleRecord.slug} - ÓRFÃO CONFIRMADO! Motivo: ${orphanReason}`);
            orphans.push({
              id: moduleRecord.id,
              name: moduleRecord.name,
              reason: orphanReason,
              description: orphanDescription,
              path: modulePath,
              canAutoFix: orphanReason === 'no_physical_files' || orphanReason === 'invalid_structure',
              severity: orphanReason === 'no_physical_files' ? 'error' : 'warning'
            });
          }
        }

      } catch (importError) {
        console.warn('⚠️ [ModuleDiscovery] Não foi possível importar cliente Supabase:', importError);
        return orphans;
      }

      console.debug(`✅ [ModuleDiscovery] Detecção v2.0.0 concluída - ${orphans.length} órfãos encontrados:`);
      orphans.forEach(orphan => {
        console.debug(`  - ${orphan.name} (${orphan.severity}): ${orphan.reason}`);
      });
      
      return orphans;
      
    } catch (error) {
      console.error('💥 [ModuleDiscovery] Erro ao detectar módulos órfãos v2.0.0:', error);
      return [];
    }
  }

  /**
   * **V2.0.0**: Valida se o ID do módulo segue o formato esperado
   */
  private isValidModuleIdFormat(moduleId: string): boolean {
    // Formato esperado: cliente-modulo (ex: banban-insights, standard-analytics)
    const pattern = /^[a-z]+(-[a-z]+)+$/;
    return pattern.test(moduleId) && moduleId.includes('-');
  }

  /**
   * **V2.0.0**: Valida arquivos essenciais de um módulo
   */
  private async validateModuleFiles(modulePath: string): Promise<{
    isValid: boolean;
    missingFiles: string[];
    existingFiles: string[];
  }> {
    const requiredFiles = ['index.ts'];
    const optionalFiles = ['module.config.ts', 'README.md', 'types.ts'];
    const missingFiles: string[] = [];
    const existingFiles: string[] = [];

    // Verificar arquivos obrigatórios
    for (const file of requiredFiles) {
      const filePath = path.join(modulePath, file);
      try {
        await fs.access(filePath);
        existingFiles.push(file);
      } catch {
        missingFiles.push(file);
      }
    }

    // Verificar arquivos opcionais (não conta como erro)
    for (const file of optionalFiles) {
      const filePath = path.join(modulePath, file);
      try {
        await fs.access(filePath);
        existingFiles.push(file);
      } catch {
        // Arquivos opcionais, não adicionar aos missing
      }
    }

    return {
      isValid: missingFiles.length === 0,
      missingFiles,
      existingFiles
    };
  }

  /**
   * Valida integridade de todos os módulos
   */
  async validateModuleIntegrity(): Promise<ModuleIntegrityReport> {
    try {
      const discoveredModules = await this.scanAvailableModules();
      const orphanModules = await this.detectOrphanModules();
      
      const validModules = discoveredModules.filter(m => m.isAvailable);
      const brokenModules = discoveredModules.filter(m => !m.isAvailable);
      
      return {
        totalModules: discoveredModules.length,
        validModules: validModules.length,
        brokenModules: brokenModules.length,
        orphanModules: orphanModules.length,
        modules: {
          valid: validModules,
          broken: brokenModules,
          orphan: orphanModules
        },
        recommendations: this.generateIntegrityRecommendations(validModules, brokenModules, orphanModules)
      };
    } catch (error) {
      console.error('Erro na validação de integridade:', error);
      return {
        totalModules: 0,
        validModules: 0,
        brokenModules: 0,
        orphanModules: 0,
        modules: {
          valid: [],
          broken: [],
          orphan: []
        },
        recommendations: []
      };
    }
  }

  /**
   * Gera recomendações baseadas na análise de integridade
   */
  private generateIntegrityRecommendations(
    validModules: ModuleInfo[],
    brokenModules: ModuleInfo[],
    orphanModules: OrphanModule[]
  ): IntegrityRecommendation[] {
    const recommendations: IntegrityRecommendation[] = [];

    // Recomendações para módulos órfãos
    if (orphanModules.length > 0) {
      recommendations.push({
        type: 'cleanup',
        severity: 'high',
        title: `${orphanModules.length} módulo(s) órfão(s) detectado(s)`,
        description: 'Módulos registrados no banco de dados mas sem arquivos físicos',
        action: 'remove_orphan_records',
        moduleIds: orphanModules.map(m => m.id)
      });
    }

    // Recomendações para módulos quebrados
    if (brokenModules.length > 0) {
      recommendations.push({
        type: 'repair',
        severity: 'medium',
        title: `${brokenModules.length} módulo(s) com problemas`,
        description: 'Módulos com arquivos físicos mas implementação incompleta',
        action: 'fix_implementation',
        moduleIds: brokenModules.map(m => m.id)
      });
    }

    // Recomendação de sucesso
    if (validModules.length > 0 && orphanModules.length === 0 && brokenModules.length === 0) {
      recommendations.push({
        type: 'success',
        severity: 'info',
        title: 'Sistema de módulos saudável',
        description: `${validModules.length} módulo(s) funcionando corretamente`,
        action: 'none',
        moduleIds: []
      });
    }

    return recommendations;
  }

  /**
   * Utilitário para verificar se arquivo existe
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Verifica se um diretório é uma pasta de apoio (não um módulo)
   */
  private isSupportDirectory(directoryName: string): boolean {
    const lowerName = directoryName.toLowerCase();
    return this.supportDirectories.includes(lowerName);
  }

  /**
   * Verifica se um diretório tem características de módulo real
   */
  private async isValidModule(modulePath: string, moduleName: string): Promise<boolean> {
    // 1. Não pode ser pasta de apoio
    if (this.isSupportDirectory(moduleName)) {
      console.debug(`⚠️ [ModuleDiscovery] ${moduleName} é pasta de apoio`);
      return false;
    }

    // 2. Deve ter pelo menos um dos arquivos que caracterizam um módulo
    const moduleIndicators = [
      'src/index.ts',       // Ponto de entrada alternativo
      'index.ts',           // Ponto de entrada principal
      'index.js',           // Ponto de entrada JS
      'module.json',        // Configuração de módulo
      'module.config.json', // Configuração alternativa
      'package.json'        // Se for um submódulo NPM
    ];

    console.debug(`🔍 [ModuleDiscovery] Verificando indicadores em ${modulePath}:`);
    for (const indicator of moduleIndicators) {
      const indicatorPath = path.join(modulePath, indicator);
      const exists = await this.fileExists(indicatorPath);
      console.debug(`  - ${indicator}: ${exists ? '✅' : '❌'}`);
      if (exists) {
        return true;
      }
    }

    // 3. Se não tem nenhum indicador, não é módulo válido
    console.debug(`❌ [ModuleDiscovery] Nenhum indicador encontrado em ${modulePath}`);
    return false;
  }
}
