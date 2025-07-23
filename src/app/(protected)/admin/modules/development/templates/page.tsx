'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Badge } from '@/shared/ui/badge';
import { ArrowLeft, FileCode, Download, Copy, Sparkles, Package } from 'lucide-react';
import { Layout } from '@/shared/components/Layout';
import Link from 'next/link';

/**
 * Página de Templates e Scaffolding
 * 
 * Responsabilidades:
 * - Geração automática de código para novos módulos
 * - Templates pré-configurados para diferentes tipos
 * - Scaffolding de estruturas completas
 * - Customização de templates baseado em padrões
 * 
 * Funcionalidades:
 * - Templates para módulos base
 * - Geração de implementações
 * - Estruturas de componentes
 * - Configurações automáticas
 * 
 * Focado em:
 * - Acelerar desenvolvimento
 * - Padronização de código
 * - Redução de erros
 * - Consistência arquitetural
 */

interface TemplateOption {
  id: string;
  name: string;
  description: string;
  category: string;
  complexity: 'simple' | 'medium' | 'complex';
  files: string[];
  variables: string[];
}

export default function TemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateOption | null>(null);
  const [templateVars, setTemplateVars] = useState<Record<string, string>>({});
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const templates: TemplateOption[] = [
    {
      id: 'base-module',
      name: 'Módulo Base Completo',
      description: 'Template completo para um novo módulo base com todas as estruturas necessárias',
      category: 'Módulo',
      complexity: 'complex',
      files: ['module.ts', 'types.ts', 'constants.ts', 'utils.ts', 'index.ts'],
      variables: ['moduleName', 'moduleSlug', 'description', 'category', 'permissions']
    },
    {
      id: 'implementation',
      name: 'Implementação de Módulo',
      description: 'Template para criar uma nova implementação baseada em módulo existente',
      category: 'Implementação',
      complexity: 'medium',
      files: ['component.tsx', 'hooks.ts', 'types.ts', 'index.ts'],
      variables: ['implementationName', 'baseModuleId', 'targetAudience', 'componentPath']
    },
    {
      id: 'component',
      name: 'Componente React',
      description: 'Template básico para componente React com TypeScript',
      category: 'Componente',
      complexity: 'simple',
      files: ['Component.tsx', 'Component.module.css', 'index.ts'],
      variables: ['componentName', 'propsInterface', 'hasStyles']
    },
    {
      id: 'hook',
      name: 'Hook Customizado',
      description: 'Template para hook React com TypeScript e testes',
      category: 'Hook',
      complexity: 'simple',
      files: ['useHook.ts', 'useHook.test.ts', 'index.ts'],
      variables: ['hookName', 'returnType', 'parameters']
    },
    {
      id: 'api-integration',
      name: 'Integração com API',
      description: 'Template para integração com APIs externas',
      category: 'Integração',
      complexity: 'medium',
      files: ['api.ts', 'types.ts', 'hooks.ts', 'utils.ts'],
      variables: ['apiName', 'baseUrl', 'endpoints', 'authType']
    }
  ];

  const handleTemplateSelect = (template: TemplateOption) => {
    setSelectedTemplate(template);
    setGeneratedCode('');
    
    // Inicializar variáveis do template
    const initialVars: Record<string, string> = {};
    template.variables.forEach(variable => {
      initialVars[variable] = '';
    });
    setTemplateVars(initialVars);
  };

  const handleVariableChange = (variable: string, value: string) => {
    setTemplateVars(prev => ({
      ...prev,
      [variable]: value
    }));
  };

  const generateCode = async () => {
    if (!selectedTemplate) return;
    
    setIsGenerating(true);
    
    // Simular geração de código
    setTimeout(() => {
      const mockCode = `// Generated ${selectedTemplate.name}
// Variables: ${JSON.stringify(templateVars, null, 2)}

export interface ${templateVars.componentName || 'Generated'}Props {
  // Props interface here
}

export const ${templateVars.componentName || 'Generated'} = () => {
  return (
    <div>
      <h1>${templateVars.componentName || 'Generated'} Component</h1>
      {/* Component implementation */}
    </div>
  );
};

export default ${templateVars.componentName || 'Generated'};`;
      
      setGeneratedCode(mockCode);
      setIsGenerating(false);
    }, 2000);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode);
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'complex': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Layout>
      <Layout.Header>
        <Layout.Breadcrumbs items={[
          { title: 'Admin' },
          { title: 'Módulos', href: '/admin/modules' },
          { title: 'Desenvolvimento', href: '/admin/modules/desenvolvimento' },
          { title: 'Templates' }
        ]} />
        <Layout.Actions>
          <Button variant="outline" asChild>
            <Link href="/admin/modules/desenvolvimento">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Desenvolvimento
            </Link>
          </Button>
        </Layout.Actions>
      </Layout.Header>

      <Layout.Body>
        <Layout.Content>
          {/* Header da Página */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <FileCode className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Templates e Scaffolding</h1>
                <p className="text-muted-foreground">
                  Geração automática de código e estruturas padronizadas
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lista de Templates */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Templates Disponíveis</CardTitle>
                  <CardDescription>
                    Selecione um template para gerar código automaticamente
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {templates.map((template) => (
                    <Card 
                      key={template.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedTemplate?.id === template.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium">{template.name}</h4>
                            <p className="text-sm text-muted-foreground">{template.description}</p>
                          </div>
                          <Badge className={getComplexityColor(template.complexity)}>
                            {template.complexity}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-3">
                          <Badge variant="outline">{template.category}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {template.files.length} arquivos
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Configuração e Geração */}
            <div className="space-y-4">
              {selectedTemplate ? (
                <>
                  {/* Configuração de Variáveis */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        Configurar Template
                      </CardTitle>
                      <CardDescription>
                        {selectedTemplate.name} - Preencha as variáveis necessárias
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {selectedTemplate.variables.map((variable) => (
                        <div key={variable} className="space-y-2">
                          <Label htmlFor={variable}>
                            {variable.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </Label>
                          {variable.includes('description') ? (
                            <Textarea
                              id={variable}
                              placeholder={`Digite ${variable}...`}
                              value={templateVars[variable] || ''}
                              onChange={(e) => handleVariableChange(variable, e.target.value)}
                            />
                          ) : (
                            <Input
                              id={variable}
                              placeholder={`Digite ${variable}...`}
                              value={templateVars[variable] || ''}
                              onChange={(e) => handleVariableChange(variable, e.target.value)}
                            />
                          )}
                        </div>
                      ))}
                      
                      <Button 
                        onClick={generateCode} 
                        disabled={isGenerating}
                        className="w-full"
                      >
                        {isGenerating ? 'Gerando...' : 'Gerar Código'}
                        <FileCode className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Arquivos que serão gerados */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Arquivos Gerados
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedTemplate.files.map((file) => (
                          <div key={file} className="flex items-center gap-2 p-2 bg-muted rounded">
                            <FileCode className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-mono">{file}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <FileCode className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-medium mb-2">Selecione um Template</h3>
                    <p className="text-sm text-muted-foreground">
                      Escolha um template da lista para começar a gerar código
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Código Gerado */}
          {generatedCode && (
            <Card className="mt-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Código Gerado</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={copyToClipboard}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copiar
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{generatedCode}</code>
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Informações Adicionais */}
          <Card className="mt-6 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-800">Sobre os Templates</CardTitle>
              <CardDescription className="text-blue-700">
                Os templates seguem os padrões de arquitetura estabelecidos no projeto.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-blue-700">
                <p><strong>Padrões aplicados:</strong> TypeScript strict, ESLint, imports organizados</p>
                <p><strong>Estrutura:</strong> Domain-driven organization conforme CLAUDE.md</p>
                <p><strong>Convenções:</strong> Nomenclatura padronizada e documentação inline</p>
                <p><strong>Qualidade:</strong> Validação automática e melhores práticas</p>
              </div>
            </CardContent>
          </Card>
        </Layout.Content>
      </Layout.Body>
    </Layout>
  );
}