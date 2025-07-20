'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Label } from '@/shared/ui/label';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { Switch } from '@/shared/ui/switch';
import { Badge } from '@/shared/ui/badge';
import { useToast } from '@/shared/ui/toast';
import { 
  Settings, 
  Save, 
  Package, 
  Building,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { CoreModule } from '@/shared/types/module-catalog';
import { 
  MODULE_TYPE_LABELS,
  ModuleInfo
} from '@/shared/types/module-system';
import { MODULE_STATUS_LABELS, MODULE_STATUS_COLORS } from '@/shared/constants/module-labels';
// TODO: Remover imports obsoletos - esta página precisa ser refatorada para o novo sistema de módulos
// import { configureOrganizationModule, registerDiscoveredModule, getRegisteredModule } from '@/app/actions/admin/modules';
// import { getAvailableModules } from '@/app/actions/admin/modules';
import { getAllOrganizations } from '@/app/actions/admin/organizations';

// Definir o tipo da configuração do módulo
interface ModuleConfiguration {
  enabled: boolean;
  autoStart: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  maxConnections: number;
  timeout: number;
  retryAttempts: number;
  organizationId: string;
  customSettings: Record<string, any>;
  notifications: {
    email: boolean;
    webhook: boolean;
    dashboard: boolean;
  };
  performance: {
    cacheEnabled: boolean;
    batchSize: number;
    throttleLimit: number;
  };
}

// Estender o tipo CoreModule para incluir dados de registro
interface ExtendedCoreModule extends CoreModule {
  configuration?: ModuleConfiguration;
  implementation_notes?: string;
  organization?: {
    id: string;
    company_trading_name: string;
    company_legal_name: string;
  };
  organizationStatus?: string;
  priority?: string;
  status?: string; // Adicionado para compatibilidade
}

// Definir o tipo dos dados do formulário
interface ModuleConfigFormData {
  enabled: boolean;
  autoStart: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  maxConnections: string;
  timeout: string;
  retryAttempts: string;
  organizationId: string;
  cacheEnabled: boolean;
  batchSize: string;
  throttleLimit: string;
  emailNotifications: boolean;
  webhookNotifications: boolean;
  dashboardNotifications: boolean;
  notes: string;
}

// Dados iniciais do formulário
const initialConfigData: ModuleConfigFormData = {
  enabled: true,
  autoStart: false,
  logLevel: 'info',
  maxConnections: '100',
  timeout: '30000',
  retryAttempts: '3',
  organizationId: '',
  cacheEnabled: true,
  batchSize: '50',
  throttleLimit: '1000',
  emailNotifications: true,
  webhookNotifications: false,
  dashboardNotifications: true,
  notes: '',
};

interface Organization {
  id: string;
  company_trading_name: string;
  company_legal_name: string;
}

export default function ModuleConfigPage() {
  const { toast } = useToast();

  const router = useRouter();
  const params = useParams();
  const moduleId = params.id as string;

  const [module, setModule] = useState<ExtendedCoreModule | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [formData, setFormData] = useState<ModuleConfigFormData>(initialConfigData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingOrgs, setLoadingOrgs] = useState(true);

  useEffect(() => {
    loadModuleData();
    loadOrganizations();
  }, [moduleId]);

  const loadModuleData = async () => {
    try {
      setLoading(true);
      
      // TODO: Implementar carregamento de dados com o novo sistema de módulos
      // Por enquanto, usar dados mockados
      const mockModule: ExtendedCoreModule = {
        id: moduleId,
        name: 'Módulo de Exemplo',
        description: 'Esta página precisa ser refatorada para o novo sistema de módulos',
        pricing_tier: 'standard',
        maturity: 'beta',
        category: 'analytics',
        status: 'planned',
        configuration: undefined,
        implementation_notes: undefined,
        organization: undefined,
        organizationStatus: undefined,
        priority: undefined
      };
      
      setModule(mockModule);
      
      toast.error("Esta página precisa ser refatorada para o novo sistema de módulos", {
        title: "Aviso",
      });
      
      // Redirecionar para a página principal de módulos
      setTimeout(() => {
        router.push('/admin/modules');
      }, 2000);
      
    } catch (error) {
      console.error('Erro ao carregar módulo:', error);
      toast.error("Erro ao carregar dados do módulo", {
        title: "Erro",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadOrganizations = async () => {
    try {
      setLoadingOrgs(true);
      const result = await getAllOrganizations();
      
      if (result.data) {
        setOrganizations(result.data);
      }
    } catch (error) {
      console.error('Erro ao carregar organizações:', error);
      toast.error("Erro ao carregar organizações", {
        title: "Erro",
      });
    } finally {
      setLoadingOrgs(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.organizationId) {
      toast.error("Selecione uma organização", {
        title: "Erro",
      });
      return;
    }

    try {
      setSaving(true);
      
      // Primeiro registrar o módulo para a organização
      // TODO: Implementar salvamento com o novo sistema de módulos
      toast.error("Esta funcionalidade precisa ser refatorada para o novo sistema de módulos", {
        title: "Aviso",
      });
      
      // Por enquanto, apenas redirecionar
      setTimeout(() => {
        router.push('/admin/modules');
      }, 2000);
    } catch (error: any) {
      console.error('Erro ao salvar configuração:', error);
      toast.error(error.message || "Erro ao salvar configuração", {
        title: "Erro",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof ModuleConfigFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Carregando configuração do módulo...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium">Módulo não encontrado</h3>
          <Button 
            onClick={() => router.push('/admin/modules')}
            className="mt-4"
          >
            Voltar para Módulos
          </Button>
        </div>
      </div>
    );
  }

  const isPlanned = !module.organizationStatus;
  const status = module.organizationStatus || 'planned';

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/admin/modules')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Configurar Módulo
          </h1>
          <p className="text-muted-foreground">
            Configure as opções e atribua uma organização ao módulo
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações do Módulo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Informações do Módulo
            </CardTitle>
            <CardDescription>
              Detalhes sobre o módulo a ser configurado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">{module.name}</h3>
              <Badge 
                variant="outline"
                className={MODULE_STATUS_COLORS[status as keyof typeof MODULE_STATUS_COLORS]}
              >
                {MODULE_STATUS_LABELS[status as keyof typeof MODULE_STATUS_LABELS]}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline">
                {module.pricing_tier}
              </Badge>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                {module.maturity}
              </Badge>
            </div>
            {module.description && (
              <p className="text-sm text-muted-foreground">
                {module.description}
              </p>
            )}
            {module.organization && (
              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 mb-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Organização Atribuída</span>
                </div>
                <p className="text-sm">
                  {module.organization.company_trading_name || module.organization.company_legal_name}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Atribuição de Organização */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Atribuição de Organização
            </CardTitle>
            <CardDescription>
              Selecione a organização que utilizará este módulo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="organizationId">Organização *</Label>
              <Select
                value={formData.organizationId}
                onValueChange={(value) => handleInputChange('organizationId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingOrgs ? "Carregando organizações..." : "Selecione uma organização"} />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.company_trading_name || org.company_legal_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Organização que terá acesso a este módulo
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Configurações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações Básicas</CardTitle>
            <CardDescription>
              Configurações fundamentais do módulo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Módulo Habilitado</Label>
                  <p className="text-sm text-muted-foreground">
                    Ativa ou desativa o módulo
                  </p>
                </div>
                <Switch
                  checked={formData.enabled}
                  onCheckedChange={(checked) => handleInputChange('enabled', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Iniciar Automaticamente</Label>
                  <p className="text-sm text-muted-foreground">
                    Inicia o módulo automaticamente quando disponível
                  </p>
                </div>
                <Switch
                  checked={formData.autoStart}
                  onCheckedChange={(checked) => handleInputChange('autoStart', checked)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logLevel">Nível de Log</Label>
              <Select
                value={formData.logLevel}
                onValueChange={(value) => handleInputChange('logLevel', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="debug">Debug</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warn">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Nível de detalhamento dos logs do módulo
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxConnections">Máx. Conexões *</Label>
                <Input
                  id="maxConnections"
                  type="number"
                  value={formData.maxConnections}
                  onChange={(e) => handleInputChange('maxConnections', e.target.value)}
                  placeholder="100"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Número máximo de conexões simultâneas
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeout">Timeout (ms) *</Label>
                <Input
                  id="timeout"
                  type="number"
                  value={formData.timeout}
                  onChange={(e) => handleInputChange('timeout', e.target.value)}
                  placeholder="30000"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Tempo limite para operações
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="retryAttempts">Tentativas *</Label>
                <Input
                  id="retryAttempts"
                  type="number"
                  value={formData.retryAttempts}
                  onChange={(e) => handleInputChange('retryAttempts', e.target.value)}
                  placeholder="3"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Número de tentativas em caso de falha
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Performance</CardTitle>
            <CardDescription>
              Configurações para otimização de performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Cache Habilitado</Label>
                <p className="text-sm text-muted-foreground">
                  Ativa o cache para melhorar a performance
                </p>
              </div>
              <Switch
                checked={formData.cacheEnabled}
                onCheckedChange={(checked) => handleInputChange('cacheEnabled', checked)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="batchSize">Tamanho do Lote *</Label>
                <Input
                  id="batchSize"
                  type="number"
                  value={formData.batchSize}
                  onChange={(e) => handleInputChange('batchSize', e.target.value)}
                  placeholder="50"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Número de itens processados por lote
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="throttleLimit">Limite de Throttle *</Label>
                <Input
                  id="throttleLimit"
                  type="number"
                  value={formData.throttleLimit}
                  onChange={(e) => handleInputChange('throttleLimit', e.target.value)}
                  placeholder="1000"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Limite de requisições por minuto
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notificações */}
        <Card>
          <CardHeader>
            <CardTitle>Notificações</CardTitle>
            <CardDescription>
              Configure como receber notificações do módulo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificações por Email</Label>
                <p className="text-sm text-muted-foreground">
                  Receber notificações por email
                </p>
              </div>
              <Switch
                checked={formData.emailNotifications}
                onCheckedChange={(checked) => handleInputChange('emailNotifications', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificações por Webhook</Label>
                <p className="text-sm text-muted-foreground">
                  Receber notificações via webhook
                </p>
              </div>
              <Switch
                checked={formData.webhookNotifications}
                onCheckedChange={(checked) => handleInputChange('webhookNotifications', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificações no Dashboard</Label>
                <p className="text-sm text-muted-foreground">
                  Exibir notificações no dashboard
                </p>
              </div>
              <Switch
                checked={formData.dashboardNotifications}
                onCheckedChange={(checked) => handleInputChange('dashboardNotifications', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notas de Implementação */}
        <Card>
          <CardHeader>
            <CardTitle>Notas de Implementação</CardTitle>
            <CardDescription>
              Adicione observações sobre a configuração do módulo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Adicione notas sobre a implementação..."
                rows={4}
              />
              <p className="text-sm text-muted-foreground">
                Observações importantes sobre este módulo
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/modules')}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Configuração
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}