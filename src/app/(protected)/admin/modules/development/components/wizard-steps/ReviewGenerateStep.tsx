'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Code2,
  FileCode,
  Package,
  Database,
  Globe,
  Monitor,
  Rocket,
  Loader2,
  Copy,
  ExternalLink
} from 'lucide-react';
import { useModuleWizard } from '../../hooks/useModuleWizard';
import { CodeGenerationResult } from '../../types';

/**
 * Step 5: Revisão final e geração do código.
 */
export function ReviewGenerateStep() {
  const { state, generateCode, isGenerating } = useModuleWizard();
  const [generationResult, setGenerationResult] = useState<CodeGenerationResult | null>(null);
  const [activeTab, setActiveTab] = useState('review');

  const handleGenerate = async () => {
    try {
      const result = await generateCode();
      setGenerationResult(result);
      setActiveTab('result');
    } catch (error) {
      console.error('Erro ao gerar código:', error);
    }
  };

  const config = state.config;

  // Estatísticas do módulo
  const moduleStats = {
    complexity: getModuleComplexity(),
    estimatedFiles: getEstimatedFiles(),
    estimatedTime: getEstimatedTime(),
    dependencies: getTotalDependencies()
  };

  function getModuleComplexity(): 'simple' | 'medium' | 'complex' {
    let score = 0;
    
    if (config.type === 'custom') score += 2;
    if (config.advanced?.database?.requiresNewTables) score += 2;
    if (config.advanced?.api?.hasEndpoints) score += 2;
    if (config.advanced?.frontend?.hasUI && config.advanced.frontend.pageType === 'multi') score += 2;
    if ((config.advanced?.dependencies?.external?.length || 0) > 3) score += 1;
    
    if (score <= 2) return 'simple';
    if (score <= 5) return 'medium';
    return 'complex';
  }

  function getEstimatedFiles(): number {
    let files = 3; // Base files (index, config, types)
    
    if (config.advanced?.database?.requiresNewTables) files += (config.advanced.database.tables?.length || 1) + 1; // migrations
    if (config.advanced?.api?.hasEndpoints) files += (config.advanced.api.endpoints?.length || 1) + 1; // routes
    if (config.advanced?.frontend?.hasUI) {
      files += config.advanced.frontend.pageType === 'multi' ? 5 : 3; // components
    }
    if (config.type === 'custom') files += 2; // client-specific files
    
    return files;
  }

  function getEstimatedTime(): number {
    const complexity = getModuleComplexity();
    const files = getEstimatedFiles();
    
    let baseTime = complexity === 'simple' ? 5 : complexity === 'medium' ? 10 : 20;
    let fileTime = files * 0.5;
    
    return Math.round(baseTime + fileTime);
  }

  function getTotalDependencies(): number {
    return (config.advanced?.dependencies?.external?.length || 0) + 
           (config.advanced?.dependencies?.internal?.length || 0);
  }

  const configSections = [
    {
      id: 'basic',
      title: 'Configuração Básica',
      icon: Package,
      items: [
        { label: 'Nome', value: config.basic?.name },
        { label: 'Nome de Exibição', value: config.basic?.displayName },
        { label: 'Versão', value: config.basic?.version },
        { label: 'Categoria', value: config.basic?.category },
        { label: 'Tags', value: config.basic?.tags?.join(', ') }
      ]
    },
    {
      id: 'client',
      title: 'Configuração do Cliente',
      icon: Monitor,
      show: config.type === 'custom',
      items: [
        { label: 'Cliente', value: config.client?.clientType },
        { label: 'Cor Primária', value: config.client?.customizations?.branding?.primaryColor },
        { label: 'Features', value: config.client?.customizations?.features?.join(', ') },
        { label: 'Integrações', value: config.client?.customizations?.integrations?.join(', ') }
      ]
    },
    {
      id: 'database',
      title: 'Banco de Dados',
      icon: Database,
      show: config.advanced?.database?.requiresNewTables,
      items: [
        { label: 'Novas Tabelas', value: config.advanced?.database?.tables?.join(', ') },
        { label: 'Migrações', value: config.advanced?.database?.migrations ? 'Sim' : 'Não' }
      ]
    },
    {
      id: 'api',
      title: 'API',
      icon: Globe,
      show: config.advanced?.api?.hasEndpoints,
      items: [
        { label: 'Endpoints', value: config.advanced?.api?.endpoints?.join(', ') },
        { label: 'Autenticação', value: config.advanced?.api?.requiresAuth ? 'Sim' : 'Não' }
      ]
    },
    {
      id: 'frontend',
      title: 'Frontend',
      icon: Monitor,
      show: config.advanced?.frontend?.hasUI,
      items: [
        { label: 'Tipo de Página', value: config.advanced?.frontend?.pageType },
        { label: 'Permissões', value: config.advanced?.frontend?.permissions?.join(', ') }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Revisão e Geração</h3>
        <p className="text-muted-foreground">
          Revise as configurações e gere o código do seu módulo
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="review" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Revisão
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <FileCode className="h-4 w-4" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="result" disabled={!generationResult} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Resultado
          </TabsTrigger>
        </TabsList>

        {/* Tab: Review */}
        <TabsContent value="review" className="space-y-6">
          {/* Module Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5" />
                Estatísticas do Módulo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{moduleStats.estimatedFiles}</div>
                  <div className="text-sm text-muted-foreground">Arquivos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{moduleStats.dependencies}</div>
                  <div className="text-sm text-muted-foreground">Dependências</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{moduleStats.estimatedTime}min</div>
                  <div className="text-sm text-muted-foreground">Tempo Estimado</div>
                </div>
                <div className="text-center">
                  <Badge 
                    variant={
                      moduleStats.complexity === 'simple' ? 'default' : 
                      moduleStats.complexity === 'medium' ? 'secondary' : 
                      'destructive'
                    }
                  >
                    {moduleStats.complexity === 'simple' ? 'Simples' :
                     moduleStats.complexity === 'medium' ? 'Médio' : 'Complexo'}
                  </Badge>
                  <div className="text-sm text-muted-foreground mt-1">Complexidade</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuration Review */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {configSections.filter(section => section.show !== false).map((section) => {
              const Icon = section.icon;
              
              return (
                <Card key={section.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Icon className="h-5 w-5" />
                      {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="space-y-2">
                      {section.items.filter(item => item.value).map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <dt className="text-muted-foreground">{item.label}:</dt>
                          <dd className="font-medium text-right max-w-[60%] truncate" title={item.value}>
                            {item.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Generate Button */}
          <Card className="border-2 border-dashed border-primary/50 bg-primary/5">
            <CardContent className="pt-6 text-center">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-lg">Pronto para Gerar?</h4>
                  <p className="text-muted-foreground">
                    Todas as configurações foram revisadas. Clique abaixo para gerar o código do módulo.
                  </p>
                </div>
                
                <Button 
                  size="lg" 
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full max-w-md"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Code2 className="h-5 w-5 mr-2" />
                      Gerar Código do Módulo
                    </>
                  )}
                </Button>
                
                {isGenerating && (
                  <p className="text-sm text-muted-foreground">
                    Isso pode levar alguns segundos...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Preview */}
        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preview da Estrutura de Arquivos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-1">
                <div>📁 src/core/modules/{config.basic?.name || 'module-name'}/</div>
                <div className="ml-4">📄 index.ts</div>
                <div className="ml-4">📄 config.ts</div>
                <div className="ml-4">📄 types.ts</div>
                
                {config.advanced?.frontend?.hasUI && (
                  <>
                    <div className="ml-4">📁 components/</div>
                    <div className="ml-8">📄 ModulePage.tsx</div>
                    {config.advanced.frontend.pageType === 'multi' && (
                      <>
                        <div className="ml-8">📄 ModuleList.tsx</div>
                        <div className="ml-8">📄 ModuleDetail.tsx</div>
                      </>
                    )}
                  </>
                )}
                
                {config.advanced?.api?.hasEndpoints && (
                  <>
                    <div className="ml-4">📁 api/</div>
                    {config.advanced.api.endpoints?.map(endpoint => (
                      <div key={endpoint} className="ml-8">📄 {endpoint.replace('/', '')}.ts</div>
                    ))}
                  </>
                )}
                
                {config.advanced?.database?.requiresNewTables && (
                  <>
                    <div className="ml-4">📁 database/</div>
                    <div className="ml-8">📄 schema.sql</div>
                    {config.advanced.database.migrations && (
                      <div className="ml-8">📄 migration.sql</div>
                    )}
                  </>
                )}
                
                {config.type === 'custom' && (
                  <>
                    <div className="ml-4">📁 client-config/</div>
                    <div className="ml-8">📄 {config.client?.clientType}.ts</div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Result */}
        <TabsContent value="result" className="space-y-6">
          {generationResult && (
            <>
              {/* Success/Error Status */}
              <Card className={generationResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${generationResult.success ? 'text-green-800' : 'text-red-800'}`}>
                    {generationResult.success ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                    {generationResult.success ? 'Módulo Gerado com Sucesso!' : 'Erro na Geração'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">{generationResult.summary.totalFiles}</div>
                      <div className="text-sm">Arquivos</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{generationResult.summary.totalDirectories}</div>
                      <div className="text-sm">Diretórios</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{generationResult.summary.estimatedTime}min</div>
                      <div className="text-sm">Tempo</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{generationResult.generatedFiles.filter(f => f.status === 'created').length}</div>
                      <div className="text-sm">Criados</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Generated Files */}
              <Card>
                <CardHeader>
                  <CardTitle>Arquivos Gerados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {generationResult.generatedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge 
                            variant={
                              file.status === 'created' ? 'default' :
                              file.status === 'updated' ? 'secondary' :
                              file.status === 'error' ? 'destructive' : 'outline'
                            }
                          >
                            {file.status}
                          </Badge>
                          <code className="text-sm">{file.path}</code>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{Math.round(file.size / 1024)}KB</span>
                          <Button variant="ghost" size="sm">
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Next Steps */}
              <Card>
                <CardHeader>
                  <CardTitle>Próximos Passos</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-2">
                    {generationResult.summary.nextSteps.map((step, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center">
                          {index + 1}
                        </div>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-4 justify-center">
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Baixar ZIP
                </Button>
                <Button>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ir para Validação Estrutural
                </Button>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}