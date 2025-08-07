'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { Label } from '@/shared/ui/label';
import { Badge } from '@/shared/ui/badge';
import { Switch } from '@/shared/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui/tooltip';
import { 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  Plus, 
  X,
  Package,
  BarChart3,
  Activity,
  Settings,
  Bell,
  Users,
  Shield,
  Zap,
  Database,
  Globe,
  ChevronRight,
  FolderOpen,
  FileText,
  Folder
} from 'lucide-react';
import { useModuleWizardContext } from '../../../contexts/ModuleWizardContext';

/**
 * Step 2: Configuração básica do módulo.
 */
export function BasicConfigStep() {
  const { state, updateConfig, validateStep } = useModuleWizardContext();
  const [nameFieldTouched, setNameFieldTouched] = useState(false);
  const [formTouched, setFormTouched] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [organizations, setOrganizations] = useState<{id: string, name: string, slug?: string}[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const basicConfig = state.config.basic || {
    name: '',
    slug: '',
    description: '',
    version: '1.0.0',
    category: '',
    icon: 'Package',
    route_pattern: '',
    supports_multi_tenant: true,
    exclusive_tenant_id: null,
    auto_create_standard: false, // Sempre false para permitir personalização
    tags: []
  };

  const updateBasicConfig = (field: keyof typeof basicConfig, value: any) => {
    updateConfig('basic', { [field]: value });
  };

  // Cache de organizações para evitar múltiplas chamadas API
  useEffect(() => {
    let isMounted = true;
    
    const fetchOrganizations = async () => {
      // Verificar se já temos dados em cache
      const cached = sessionStorage.getItem('wizard-organizations');
      if (cached) {
        try {
          const cachedData = JSON.parse(cached);
          if (isMounted) {
            setOrganizations(cachedData);
          }
          return;
        } catch (e) {
          // Limpar cache corrompido
          sessionStorage.removeItem('wizard-organizations');
        }
      }
      
      try {
        const { getAllOrganizations } = await import('@/app/actions/admin/organizations');
        const result = await getAllOrganizations();
        
        if (result.data && isMounted) {
          const orgData = result.data.map((org: any) => ({
            id: org.id,
            name: org.company_trading_name || org.company_legal_name || 'Organização sem nome',
            slug: org.slug // Incluir slug para prévia automática
          }));
          
          setOrganizations(orgData);
          // Cachear por 5 minutos
          sessionStorage.setItem('wizard-organizations', JSON.stringify(orgData));
          setTimeout(() => {
            sessionStorage.removeItem('wizard-organizations');
          }, 5 * 60 * 1000);
        }
      } catch (error) {
        console.error('Erro ao buscar organizações:', error);
      }
    };

    fetchOrganizations();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Lidar com mudança no toggle multi-tenant
  const handleMultiTenantToggle = (checked: boolean) => {
    updateBasicConfig('supports_multi_tenant', checked);
    if (checked) {
      // Se multi-tenant = true, limpar exclusive_tenant_id
      updateBasicConfig('exclusive_tenant_id', null);
    }
  };

  // Gerar slug e identificadores automaticamente baseado no nome
  const generateIdentifiers = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    const identifiers = {
      slug,
      implementation_key: `${slug}-impl`,
      component_path: `${slug}Implementation`
    };
    
    // Atualizar configuração com identificadores auto-gerados
    updateBasicConfig('slug', slug);
    updateConfig('auto_generated', identifiers);
    
    return identifiers;
  };

  // Calcular prévia automática do route pattern baseado na organização selecionada
  const getAutomaticRoutePattern = () => {
    // Para módulos standard, sempre será "standard"
    if (state.config.type === 'standard') {
      return 'standard';
    }
    
    // Para módulos custom, usar o slug da organização selecionada
    const selectedOrg = (state.config as any).selected_organization;
    if (selectedOrg?.slug) {
      // Extrair o primeiro segmento do slug da organização
      // Ex: banban-empresa -> banban, pco-sistemas -> pco
      const segments = selectedOrg.slug.toLowerCase().split('-');
      return segments.length > 0 ? segments[0] : null;
    }
    
    return null; // Será determinado no passo de atribuição
  };

  // Contar configurações avançadas preenchidas
  const getAdvancedConfigCount = () => {
    let count = 0;
    if (basicConfig.route_pattern && basicConfig.route_pattern.trim()) count++;
    if (!basicConfig.supports_multi_tenant) count++; // Single-tenant é configuração avançada
    if (basicConfig.exclusive_tenant_id) count++;
    if (basicConfig.tags && basicConfig.tags.length > 0) count++;
    // auto_create_standard não conta pois é padrão
    return count;
  };

  // Validações específicas
  const getNameValidation = () => {
    if (!basicConfig.name) return { type: 'error', message: 'Nome é obrigatório' };
    if (basicConfig.name.length < 2) return { type: 'error', message: 'Nome deve ter pelo menos 2 caracteres' };
    if (basicConfig.name.length > 100) return { type: 'error', message: 'Nome muito longo (máximo 100 caracteres)' };
    // Nome pode conter letras, números, espaços e caracteres especiais comuns
    if (!/^[a-zA-ZÀ-ÿ0-9\s\-_&().,!]+$/.test(basicConfig.name)) {
      return { 
        type: 'error', 
        message: 'Nome contém caracteres não permitidos' 
      };
    }
    return { type: 'neutral', message: '' };
  };

  const nameValidation = getNameValidation();
  const shouldShowNameValidation = nameFieldTouched || basicConfig.name !== '';
  const isValid = validateStep('basic-config') === 'valid';
  
  // Lista de campos obrigatórios
  const requiredFields = ['name', 'description', 'category'];
  
  // Determinar quando mostrar a mensagem de configuração incompleta
  // Só mostrar se TODOS os campos obrigatórios foram tocados E ainda há campos faltando
  const allRequiredFieldsTouched = requiredFields.every(field => touchedFields.has(field));
  const shouldShowIncompleteMessage = allRequiredFieldsTouched && !isValid;

  // Configurações de categorias e ícones
  const categoryOptions = [
    'analytics',
    'intelligence', 
    'monitoring',
    'operations',
    'reporting',
    'automation',
    'integration',
    'security'
  ];

  // Mapeamento de ícones disponíveis
  const iconOptions = [
    { name: 'Package', component: Package },
    { name: 'BarChart3', component: BarChart3 },
    { name: 'Activity', component: Activity },
    { name: 'Settings', component: Settings },
    { name: 'Bell', component: Bell },
    { name: 'Users', component: Users },
    { name: 'Shield', component: Shield },
    { name: 'Zap', component: Zap },
    { name: 'Database', component: Database },
    { name: 'Globe', component: Globe }
  ];

  // Componente para renderizar ícone
  const IconRenderer = ({ name, className }: { name: string; className?: string }) => {
    const iconConfig = iconOptions.find(icon => icon.name === name);
    const IconComponent = iconConfig?.component || Package;
    return <IconComponent className={className} />;
  };

  // Componente de preview da estrutura
  const StructurePreview = () => {
    const routePattern = basicConfig.route_pattern || getAutomaticRoutePattern() || 'auto-detect';
    const componentPath = (state.config as any).auto_generated?.component_path || `${basicConfig.slug}Implementation`;
    
    if (!basicConfig.name || !basicConfig.slug) {
      return (
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-6 text-center">
            <div className="text-gray-400 mb-2">
              <Package className="h-8 w-8 mx-auto mb-2" />
            </div>
            <p className="text-sm text-gray-500">
              Preencha o nome do módulo para ver o preview da estrutura
            </p>
          </CardContent>
        </Card>
      );
    }
    
    return (
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="pb-3">
          <h4 className="font-medium flex items-center gap-2 text-blue-800">
            <FolderOpen className="h-4 w-4 text-blue-600" />
            Estrutura que será criada
          </h4>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* File structure tree */}
          <div className="font-mono text-xs space-y-1 bg-white p-3 rounded border">
            <div className="flex items-center gap-1">
              <Folder className="h-3 w-3 text-yellow-600" />
              <span>src/core/modules/{routePattern}/</span>
            </div>
            <div className="ml-4 flex items-center gap-1">
              <FileText className="h-3 w-3 text-blue-600" />
              <span>{componentPath}.tsx</span>
            </div>
            <div className="ml-4 flex items-center gap-1">
              <FileText className="h-3 w-3 text-green-600" />
              <span>index.ts</span>
            </div>
          </div>
          
          {/* URL preview */}
          <div className="space-y-2">
            <h5 className="font-medium text-sm text-blue-800">URL do módulo:</h5>
            <div className="bg-white p-2 rounded border font-mono text-xs text-blue-900">
              /{'{tenant}'}/{routePattern}
            </div>
            <p className="text-xs text-blue-600">
              Exemplo: /banban-fashion/{routePattern}
            </p>
          </div>

          {/* Auto-generated identifiers */}
          {(state.config as any).auto_generated && (
            <div className="space-y-2">
              <h5 className="font-medium text-sm text-blue-800">Identificadores gerados:</h5>
              <div className="bg-white p-2 rounded border space-y-1">
                <div className="text-xs">
                  <span className="text-gray-600">Chave:</span>{' '}
                  <code className="text-blue-700">{(state.config as any).auto_generated?.implementation_key}</code>
                </div>
                <div className="text-xs">
                  <span className="text-gray-600">Componente:</span>{' '}
                  <code className="text-blue-700">{(state.config as any).auto_generated?.component_path}</code>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Configuração Básica</h3>
        <p className="text-muted-foreground">
          Configure as informações fundamentais do seu módulo
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna Esquerda - Informações Básicas */}
        <div className="space-y-6">
          {/* Informações Básicas */}
          <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Nome do Módulo */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Módulo *</Label>
              <div className="relative">
                <Input
                  id="name"
                  value={basicConfig.name}
                  onChange={(e) => {
                    const newName = e.target.value;
                    updateBasicConfig('name', newName);
                    // Auto-gerar identificadores baseado no nome
                    if (newName.trim()) {
                      generateIdentifiers(newName);
                    }
                  }}
                  onBlur={() => {
                    setNameFieldTouched(true);
                    setTouchedFields(prev => new Set(prev).add('name'));
                  }}
                  placeholder="ex: Performance Analytics"
                  className={`pr-10 ${shouldShowNameValidation && nameValidation.type === 'error' ? 'border-red-500' : 
                    shouldShowNameValidation && nameValidation.type === 'neutral' && basicConfig.name ? 'border-green-500' : ''}`}
                />
                {/* Ícone de validação inline */}
                {shouldShowNameValidation && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    {nameValidation.type === 'error' ? (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    ) : nameValidation.type === 'neutral' && basicConfig.name ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : null}
                  </div>
                )}
              </div>
              {shouldShowNameValidation && nameValidation.type === 'error' && nameValidation.message && (
                <div className="flex items-center gap-1 text-sm">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-red-500">
                    {nameValidation.message}
                  </span>
                </div>
              )}
            </div>

            {/* Slug (Identificador Técnico) */}
            <div className="space-y-2">
              <Label htmlFor="slug" className="flex align-left gap-2 pt-1">
                Identificador (Slug) *
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground hover:text-blue-600 transition-colors cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <p className="max-w-xs">
                        <strong>Identificador técnico único</strong> usado internamente pelo sistema.
                        <br /><br />
                        <strong>Função:</strong>
                        <br />
                        • Identifica o módulo no código e banco de dados
                        <br />
                        • Usado para buscar implementações específicas
                        <br />
                        • Base para auto-resolução de componentes
                        <br /><br />
                        <strong>Regras:</strong>
                        <br />
                        • Apenas letras minúsculas, números e hífen
                        <br />
                        • Não pode ser alterado após criação
                        <br />
                        • Deve ser único no sistema
                        <br /><br />
                        <strong>Exemplo:</strong> "alerts", "performance-analytics"
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span className="ml-2 text-xs text-muted-foreground flex-1 text-right">
                  Não poderá ser alterado
                </span>
              </Label>
              <Input
                id="slug"
                value={basicConfig.slug}
                onChange={(e) => updateBasicConfig('slug', e.target.value)}
                placeholder="ex: performance-analytics"
                className="mt-3 bg-gray-50"
                readOnly
              />
              
              {/* Preview dos identificadores auto-gerados + URL final */}
              {basicConfig.slug && (state.config as any).auto_generated && (
                <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded mt-2 border-l-4 border-blue-200">
                  <div className="font-medium text-blue-800 mb-2">📋 Identificadores Auto-gerados:</div>
                  <div className="space-y-1 mb-3">
                    <div>• <strong>Chave implementação:</strong> <code className="bg-blue-100 px-1 rounded">{(state.config as any).auto_generated?.implementation_key}</code></div>
                    <div>• <strong>Componente:</strong> <code className="bg-blue-100 px-1 rounded">{(state.config as any).auto_generated?.component_path}</code></div>
                  </div>
                  
                  {/* URL Preview em tempo real */}
                  <div className="border-t border-blue-200 pt-2">
                    <div className="font-medium text-blue-800 mb-1 flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      URL Final (preview):
                    </div>
                    <div className="bg-white border border-blue-200 rounded px-2 py-1">
                      <code className="text-blue-700">
                        /{'{'}tenant{'}'}/{basicConfig.route_pattern || basicConfig.slug}
                      </code>
                    </div>
                    <p className="text-blue-600 text-xs mt-1">
                      Exemplo: <code>/banban-fashion/{basicConfig.route_pattern || basicConfig.slug}</code>
                    </p>
                  </div>
                </div>
              )}
            </div>


            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <div className="relative">
                <Textarea
                  id="description"
                  value={basicConfig.description}
                  onChange={(e) => updateBasicConfig('description', e.target.value)}
                  onBlur={() => setTouchedFields(prev => new Set(prev).add('description'))}
                  placeholder="Descreva o que este módulo faz..."
                  rows={3}
                  className={`pr-10 ${touchedFields.has('description') ? 
                    (basicConfig.description && basicConfig.description.length >= 10 ? 'border-green-500' : 'border-red-500') : ''}`}
                />
                {/* Ícone de validação inline */}
                {touchedFields.has('description') && (
                  <div className="absolute top-3 right-3">
                    {basicConfig.description && basicConfig.description.length >= 10 ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {touchedFields.has('description') && (!basicConfig.description || basicConfig.description.length < 10) && (
                <div className="flex items-center gap-1 text-sm">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-red-500">
                    Descrição deve ter pelo menos 10 caracteres
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        </div>

        {/* Coluna Direita - Metadados e Configurações */}
        <div className="space-y-6">
          {/* Metadados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Metadados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Categoria */}
              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <div className="relative">
                  <Select
                    value={basicConfig.category}
                    onValueChange={(value) => {
                      updateBasicConfig('category', value);
                      setTouchedFields(prev => new Set(prev).add('category'));
                    }}
                  >
                    <SelectTrigger className={`pr-10 ${touchedFields.has('category') ? 
                      (basicConfig.category ? 'border-green-500' : 'border-red-500') : ''}`}>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Analytics">Analytics</SelectItem>
                      <SelectItem value="Dashboard">Dashboard</SelectItem>
                      <SelectItem value="Reports">Reports</SelectItem>
                      <SelectItem value="Management">Management</SelectItem>
                      <SelectItem value="Integration">Integration</SelectItem>
                      <SelectItem value="Security">Security</SelectItem>
                      <SelectItem value="Communication">Communication</SelectItem>
                    </SelectContent>
                  </Select>
                  {/* Ícone de validação inline */}
                  {touchedFields.has('category') && (
                    <div className="absolute inset-y-0 right-8 flex items-center pr-1">
                      {basicConfig.category ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                {touchedFields.has('category') && !basicConfig.category && (
                  <div className="flex items-center gap-1 text-sm">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-red-500">
                      Categoria é obrigatória
                    </span>
                  </div>
                )}
              </div>

              {/* Versão */}
              <div className="space-y-2">
                <Label htmlFor="version">Versão</Label>
                <Input
                  id="version"
                  value={basicConfig.version}
                  onChange={(e) => updateBasicConfig('version', e.target.value)}
                  placeholder="1.0.0"
                />
              </div>

              {/* Ícone */}
              <div className="space-y-2">
                <Label htmlFor="icon">Ícone</Label>
                <Select
                  value={basicConfig.icon}
                  onValueChange={(value) => updateBasicConfig('icon', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map((option) => {
                      const IconComponent = option.component;
                      return (
                        <SelectItem key={option.name} value={option.name}>
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            {option.name}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

            {/* Padrão de Rota */}
            <div className="space-y-2">
              <Label htmlFor="route_pattern" className="flex align-left gap-2 pt-1">
                Padrão de Rota (Opcional)
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground hover:text-blue-600 transition-colors cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p className="max-w-xs">
                        <strong>Define como o módulo aparece na URL</strong> e a estrutura de arquivos.
                        <br /><br />
                        <strong>Função:</strong>
                        <br />
                        • Determina a URL: /&#123;tenant&#125;/<strong>&#123;route-pattern&#125;</strong>
                        <br />
                        • Define a pasta: <code>src/core/modules/&#123;route-pattern&#125;/</code> (substitui o slug do módulo)
                        <br />
                        • Usado para buscar componentes e implementações
                        <br /><br />
                        <strong>Comportamento Automático:</strong>
                        <br />
                        • <strong>Se vazio:</strong> será definido automaticamente baseado no cliente atribuído
                        <br />
                        • <strong>Módulos Custom:</strong> usa o nome do cliente (ex: "pco", "banban", "riachuelo")
                        <br />
                        • <strong>Módulos Standard:</strong> usa "standard"
                        <br /><br />
                        <strong>Exemplos de URLs:</strong>
                        <br />
                        • "alerts" → /banban-fashion/alerts
                        <br />
                        • "vendas/relatorios" → /banban-fashion/vendas/relatorios
                        <br />
                        • Vazio + cliente PCO → /pco-sistemas/pco (pasta: src/core/modules/pco/)
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                id="route_pattern"
                value={basicConfig.route_pattern}
                onChange={(e) => updateBasicConfig('route_pattern', e.target.value)}
                onBlur={() => setTouchedFields(prev => new Set(prev).add('route_pattern'))}
                placeholder={
                  getAutomaticRoutePattern() 
                    ? `ex: performance (ou deixe vazio para auto-detectar: "${getAutomaticRoutePattern()}")` 
                    : "ex: performance (ou deixe vazio para auto-detectar baseado no cliente)"
                }
                className="mt-3"
              />
              
              {/* Helper text com prévia automática */}
              <div className="text-xs text-muted-foreground mt-2">
                {basicConfig.route_pattern && basicConfig.route_pattern.trim() ? (
                  <>
                    <span className="text-green-600 font-medium">Personalizado:</span>
                    {" "}Estrutura será criada diretamente em <code className="bg-gray-100 px-1 rounded">src/core/modules/{basicConfig.route_pattern.trim()}/</code>
                  </>
                ) : (
                  <>
                    <span className="text-blue-600 font-medium">Automático:</span>
                    {getAutomaticRoutePattern() ? (
                      <>
                        {" "}Se deixar vazio, será usado <code className="bg-blue-50 px-1 rounded text-blue-800">"{getAutomaticRoutePattern()}"</code>
                        {" "}baseado na organização selecionada
                      </>
                    ) : (
                      <>
                        {" "}Será determinado automaticamente baseado no cliente que você atribuir no próximo passo
                        {state.config.type === 'custom' && (
                          <span className="text-sm ml-1">(ex: banban, pco, riachuelo)</span>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Versão */}
            <div className="space-y-2">
              <Label htmlFor="version">Versão</Label>
              <Input
                id="version"
                value={basicConfig.version}
                onChange={(e) => updateBasicConfig('version', e.target.value)}
                placeholder="1.0.0"
              />
            </div>
          </CardContent>
        </Card>

          {/* Configurações Avançadas com Acordeão */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      <span className="font-medium">Configurações Avançadas</span>
                      <Badge variant="outline" className="ml-2">
                        {getAdvancedConfigCount()} configurações
                      </Badge>
                    </div>
                    <ChevronRight className="h-4 w-4 transition-transform data-[state=open]:rotate-90" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Multi-tenant, route pattern personalizado, configurações avançadas
                  </p>
                </CardContent>
              </Card>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <Card>
                <CardContent className="space-y-2">
                  <div className="flex flex-col gap-4">
                    {/* Multi-tenant Support */}
                    <div className="p-4 border rounded-lg space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-base font-medium">Multi-tenant</Label>
                          <p className="text-sm text-muted-foreground">
                            Suporta múltiplos tenants
                          </p>
                        </div>
                        <Switch
                          checked={basicConfig.supports_multi_tenant}
                          onCheckedChange={handleMultiTenantToggle}
                        />
                      </div>

                      {/* Tenant Exclusivo (apenas quando single-tenant) */}
                      {!basicConfig.supports_multi_tenant && (
                        <div className="pt-3 border-t -mx-4 -mb-4 px-4 pb-4 rounded-b-lg">
                          <div className="space-y-3">
                            <div>
                              <Label className="text-base font-medium">Tenant Exclusivo *</Label>
                              <p className="text-sm text-muted-foreground">
                                Selecione qual organização terá acesso exclusivo a este módulo
                              </p>
                            </div>
                            <Select 
                              value={basicConfig.exclusive_tenant_id || ''} 
                              onValueChange={(value) => updateBasicConfig('exclusive_tenant_id', value || null)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Selecione uma organização" />
                              </SelectTrigger>
                              <SelectContent>
                                {organizations.map((org) => (
                                  <SelectItem key={org.id} value={org.id}>
                                    {org.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>


      {/* Status da Validação */}
      {shouldShowIncompleteMessage && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="h-5 w-5" />
              <div>
                <p className="font-medium">Configuração Incompleta</p>
                <p className="text-sm">
                  Preencha todos os campos obrigatórios (*) para continuar.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}