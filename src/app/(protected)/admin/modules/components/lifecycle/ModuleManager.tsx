/**
 * ModuleManager - Interface administrativa completa para gestão de módulos
 * Fase 5: Admin Interface Enhancement
 * 
 * Sistema completo para:
 * - Gerenciar módulos (criar, editar, desativar)
 * - Configurar implementações por cliente
 * - Definir navegação e permissões
 * - Monitorar status e health
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { Badge } from '@/shared/ui/badge';
import { 
  Plus, 
  Settings, 
  Eye, 
  EyeOff, 
  Power, 
  PowerOff,
  Edit,
  Trash2,
  RefreshCw,
  Save,
  X,
  CheckCircle,
  AlertTriangle,
  Info,
  Users,
  Activity,
  BarChart3,
  Shield,
  Package,
  Zap,
  Clock,
  Database,
  Globe,
  Code,
  Layers,
  Search,
  Filter
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/ui/tabs';
import { Label } from '@/shared/ui/label';
import { Switch } from '@/shared/ui/switch';
import { useToast } from '@/shared/ui/toast';
import { dynamicModuleRegistry } from '@/core/modules/registry/DynamicModuleRegistry';
import { ModuleConfiguration, ClientType } from '@/core/modules/types';

interface ModuleManagerProps {
  className?: string;
}

interface CoreModule {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  version: string;
  maturity_status: 'ALPHA' | 'BETA' | 'GA' | 'DEPRECATED';
  pricing_tier: 'FREE' | 'PREMIUM' | 'ENTERPRISE';
  created_at: string;
  updated_at: string;
  implementations: ModuleImplementation[];
  tenant_count: number;
  health_score: number;
}

interface ModuleImplementation {
  id: string;
  client_type: ClientType;
  component_path: string;
  name?: string;
  icon_name?: string;
  permissions: string[];
  config: Record<string, any>;
  is_available: boolean;
  tenant_count: number;
  last_accessed?: string;
}

interface ModuleFormData {
  slug: string;
  name: string;
  description: string;
  category: string;
  maturity_status: 'ALPHA' | 'BETA' | 'GA' | 'DEPRECATED';
  pricing_tier: 'FREE' | 'PREMIUM' | 'ENTERPRISE';
}

interface ImplementationFormData {
  client_type: ClientType;
  component_path: string;
  name: string;
  icon_name: string;
  permissions: string[];
  config: Record<string, any>;
  is_available: boolean;
}

/**
 * Interface administrativa completa para gestão de módulos
 */
export const ModuleManager: React.FC<ModuleManagerProps> = ({ className }) => {
  const [modules, setModules] = useState<CoreModule[]>([]);
  const [selectedModule, setSelectedModule] = useState<CoreModule | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [implementationDialogOpen, setImplementationDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();

  // Estados para formulários
  const [moduleForm, setModuleForm] = useState<ModuleFormData>({
    slug: '',
    name: '',
    description: '',
    category: 'analytics',
    maturity_status: 'BETA',
    pricing_tier: 'FREE'
  });

  const [implementationForm, setImplementationForm] = useState<ImplementationFormData>({
    client_type: 'banban',
    component_path: '',
    name: '',
    icon_name: 'Package',
    permissions: [],
    config: {},
    is_available: true
  });

  // Carregar lista de módulos
  const loadModules = async () => {
    setLoading(true);
    try {
      // Simulação de dados - em produção viria da API
      const mockModules: CoreModule[] = [
        {
          id: '1',
          slug: 'alerts',
          name: 'Sistema de Alertas',
          description: 'Monitoramento inteligente e alertas em tempo real',
          category: 'monitoring',
          version: '2.1.0',
          maturity_status: 'GA',
          pricing_tier: 'FREE',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-06-20T15:30:00Z',
          implementations: [
            {
              id: 'impl-1',
              client_type: 'banban',
              component_path: '@/clients/banban/modules/alerts',
              name: 'Alertas Banban',
              icon_name: 'AlertTriangle',
              permissions: ['alerts.view', 'alerts.manage'],
              config: { threshold_defaults: { low: 10, high: 50 } },
              is_available: true,
              tenant_count: 45,
              last_accessed: '2024-07-01T14:22:00Z'
            },
            {
              id: 'impl-2',
              client_type: 'riachuelo',
              component_path: '@/clients/riachuelo/modules/alerts',
              name: 'Alertas Riachuelo',
              icon_name: 'Bell',
              permissions: ['alerts.view'],
              config: { custom_styling: true },
              is_available: true,
              tenant_count: 12,
              last_accessed: '2024-06-28T09:15:00Z'
            }
          ],
          tenant_count: 57,
          health_score: 95
        },
        {
          id: '2',
          slug: 'performance',
          name: 'Analytics de Performance',
          description: 'Análises detalhadas de performance e otimização',
          category: 'analytics',
          version: '1.8.2',
          maturity_status: 'GA',
          pricing_tier: 'PREMIUM',
          created_at: '2024-02-01T08:00:00Z',
          updated_at: '2024-06-25T11:45:00Z',
          implementations: [
            {
              id: 'impl-3',
              client_type: 'banban',
              component_path: '@/clients/banban/modules/performance',
              name: 'Performance Analytics',
              icon_name: 'BarChart3',
              permissions: ['performance.view', 'performance.export'],
              config: { charts_enabled: true, real_time: true },
              is_available: true,
              tenant_count: 23,
              last_accessed: '2024-07-02T16:10:00Z'
            }
          ],
          tenant_count: 23,
          health_score: 88
        },
        {
          id: '3',
          slug: 'inventory-beta',
          name: 'Gestão de Inventário (Beta)',
          description: 'Sistema avançado de gestão de inventário',
          category: 'operations',
          version: '0.9.1',
          maturity_status: 'BETA',
          pricing_tier: 'ENTERPRISE',
          created_at: '2024-05-10T12:00:00Z',
          updated_at: '2024-07-01T09:30:00Z',
          implementations: [
            {
              id: 'impl-4',
              client_type: 'banban',
              component_path: '@/clients/banban/modules/inventory',
              name: 'Inventário Banban',
              icon_name: 'Package',
              permissions: ['inventory.view', 'inventory.manage', 'inventory.admin'],
              config: { auto_sync: true, batch_operations: true },
              is_available: false, // Em desenvolvimento
              tenant_count: 3,
              last_accessed: '2024-06-30T14:00:00Z'
            }
          ],
          tenant_count: 3,
          health_score: 72
        }
      ];

      setModules(mockModules);
      console.debug(`✅ ${mockModules.length} módulos carregados`);

    } catch (error) {
      console.error('❌ Erro ao carregar módulos:', error);
      toast.error("Não foi possível carregar a lista de módulos.", {
        title: "Erro ao carregar módulos",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar módulos
  const filteredModules = modules.filter(module => {
    const matchesSearch = module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         module.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         module.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || module.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || module.maturity_status.toLowerCase() === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Criar novo módulo
  const createModule = async () => {
    setSaving(true);
    try {
      // Validação
      if (!moduleForm.slug || !moduleForm.name) {
        throw new Error('Slug e nome são obrigatórios');
      }

      // Verificar se slug já existe
      if (modules.some(m => m.slug === moduleForm.slug)) {
        throw new Error('Já existe um módulo com este slug');
      }

      // Simular criação
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newModule: CoreModule = {
        id: Date.now().toString(),
        ...moduleForm,
        version: '1.0.0',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        implementations: [],
        tenant_count: 0,
        health_score: 100
      };

      setModules(prev => [...prev, newModule]);
      setCreateDialogOpen(false);
      
      // Reset form
      setModuleForm({
        slug: '',
        name: '',
        description: '',
        category: 'analytics',
        maturity_status: 'BETA',
        pricing_tier: 'FREE'
      });

      toast.success(`O módulo ${newModule.name} foi criado com sucesso.`, {
        title: "Módulo criado",
      });

    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro desconhecido", {
        title: "Erro ao criar módulo",
      });
    } finally {
      setSaving(false);
    }
  };

  // Adicionar implementação
  const addImplementation = async () => {
    if (!selectedModule) return;

    setSaving(true);
    try {
      // Validação
      if (!implementationForm.component_path) {
        throw new Error('Caminho do componente é obrigatório');
      }

      // Verificar se já existe implementação para o cliente
      if (selectedModule.implementations.some(impl => impl.client_type === implementationForm.client_type)) {
        throw new Error(`Já existe implementação para o cliente ${implementationForm.client_type}`);
      }

      // Simular criação
      await new Promise(resolve => setTimeout(resolve, 800));

      const newImplementation: ModuleImplementation = {
        id: Date.now().toString(),
        ...implementationForm,
        tenant_count: 0,
        last_accessed: new Date().toISOString()
      };

      // Atualizar módulo
      setModules(prev => prev.map(module => 
        module.id === selectedModule.id 
          ? { ...module, implementations: [...module.implementations, newImplementation] }
          : module
      ));

      setImplementationDialogOpen(false);
      
      // Reset form
      setImplementationForm({
        client_type: 'banban',
        component_path: '',
        name: '',
        icon_name: 'Package',
        permissions: [],
        config: {},
        is_available: true
      });

      toast.success(`Implementação para ${implementationForm.client_type} foi criada.`, {
        title: "Implementação adicionada",
      });

    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro desconhecido", {
        title: "Erro ao criar implementação",
      });
    } finally {
      setSaving(false);
    }
  };

  // Toggle status de implementação
  const toggleImplementationStatus = async (moduleId: string, implementationId: string) => {
    try {
      setModules(prev => prev.map(module => 
        module.id === moduleId 
          ? {
              ...module,
              implementations: module.implementations.map(impl => 
                impl.id === implementationId 
                  ? { ...impl, is_available: !impl.is_available }
                  : impl
              )
            }
          : module
      ));

      toast.success("Status da implementação foi alterado.", {
        title: "Status atualizado",
      });

    } catch (error) {
      toast.error("Não foi possível alterar o status.", {
        title: "Erro ao atualizar status",
      });
    }
  };

  // Carregar dados na inicialização
  useEffect(() => {
    loadModules();
  }, []);

  // Render helpers
  const getStatusBadge = (status: string) => {
    const variants = {
      ALPHA: 'destructive',
      BETA: 'secondary', 
      GA: 'default',
      DEPRECATED: 'outline'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status}
      </Badge>
    );
  };

  const getHealthBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-100 text-green-800">Excelente</Badge>;
    if (score >= 70) return <Badge className="bg-yellow-100 text-yellow-800">Bom</Badge>;
    return <Badge className="bg-red-100 text-red-800">Atenção</Badge>;
  };

  const getPricingBadge = (tier: string) => {
    const colors = {
      FREE: 'bg-green-100 text-green-800',
      PREMIUM: 'bg-blue-100 text-blue-800',
      ENTERPRISE: 'bg-purple-100 text-purple-800'
    } as const;
    
    return (
      <Badge className={colors[tier as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {tier}
      </Badge>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header Card com estatísticas rápidas */}
      <Card size="sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Gestão Avançada de Módulos
              </CardTitle>
              <CardDescription>
                Interface administrativa completa para gerenciar módulos, implementações e configurações.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={loadModules}
                disabled={loading}
                leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
              >
                Atualizar
              </Button>
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button leftIcon={<Plus className="w-4 h-4" />}>
                    Novo Módulo
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Criar Novo Módulo</DialogTitle>
                    <DialogDescription>
                      Adicione um novo módulo ao catálogo global.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Slug (identificador único)</Label>
                      <Input
                        value={moduleForm.slug}
                        onChange={(e) => setModuleForm(prev => ({ ...prev, slug: e.target.value }))}
                        placeholder="ex: advanced-analytics"
                      />
                    </div>
                    <div>
                      <Label>Nome</Label>
                      <Input
                        value={moduleForm.name}
                        onChange={(e) => setModuleForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="ex: Analytics Avançado"
                      />
                    </div>
                    <div>
                      <Label>Descrição</Label>
                      <Textarea
                        value={moduleForm.description}
                        onChange={(e) => setModuleForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Descrição do módulo..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Categoria</Label>
                        <Select
                          value={moduleForm.category}
                          onValueChange={(value) => setModuleForm(prev => ({ ...prev, category: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="analytics">Analytics</SelectItem>
                            <SelectItem value="operations">Operações</SelectItem>
                            <SelectItem value="monitoring">Monitoramento</SelectItem>
                            <SelectItem value="insights">Insights</SelectItem>
                            <SelectItem value="reports">Relatórios</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Status</Label>
                        <Select
                          value={moduleForm.maturity_status}
                          onValueChange={(value) => setModuleForm(prev => ({ ...prev, maturity_status: value as any }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ALPHA">Alpha</SelectItem>
                            <SelectItem value="BETA">Beta</SelectItem>
                            <SelectItem value="GA">GA (Produção)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Tier de Preço</Label>
                      <Select
                        value={moduleForm.pricing_tier}
                        onValueChange={(value) => setModuleForm(prev => ({ ...prev, pricing_tier: value as any }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FREE">Gratuito</SelectItem>
                          <SelectItem value="PREMIUM">Premium</SelectItem>
                          <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={createModule} disabled={saving}>
                      {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Criar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filtros */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Buscar módulos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                <SelectItem value="analytics">Analytics</SelectItem>
                <SelectItem value="operations">Operações</SelectItem>
                <SelectItem value="monitoring">Monitoramento</SelectItem>
                <SelectItem value="insights">Insights</SelectItem>
                <SelectItem value="reports">Relatórios</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="alpha">Alpha</SelectItem>
                <SelectItem value="beta">Beta</SelectItem>
                <SelectItem value="ga">GA</SelectItem>
                <SelectItem value="deprecated">Deprecated</SelectItem>
              </SelectContent>
            </Select>
          </div>

        </CardContent>
      </Card>

      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-4 gap-4">
        <Card size="sm">
          <CardContent>
            <div className="flex items-center">
              <Package className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Total Módulos</p>
                <p className="text-2xl font-bold">{modules.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent>
            <div className="flex items-center">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Tenants Ativos</p>
                <p className="text-2xl font-bold">
                  {modules.reduce((sum, module) => sum + module.tenant_count, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">GA (Produção)</p>
                <p className="text-2xl font-bold">
                  {modules.filter(m => m.maturity_status === 'GA').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent>
            <div className="flex items-center">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Health Médio</p>
                <p className="text-2xl font-bold">
                  {Math.round(modules.reduce((sum, module) => sum + module.health_score, 0) / modules.length || 0)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela principal de módulos */}
      <Card size="sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Módulos Registrados</CardTitle>
              <CardDescription>
                Gerencie módulos, implementações e configure permissões por cliente.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Buscar módulos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48" icon={Filter}>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                <SelectItem value="analytics">Analytics</SelectItem>
                <SelectItem value="operations">Operações</SelectItem>
                <SelectItem value="monitoring">Monitoramento</SelectItem>
                <SelectItem value="insights">Insights</SelectItem>
                <SelectItem value="reports">Relatórios</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32" icon={Filter}>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="alpha">Alpha</SelectItem>
                <SelectItem value="beta">Beta</SelectItem>
                <SelectItem value="ga">GA</SelectItem>
                <SelectItem value="deprecated">Deprecated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lista de módulos */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              <span>Carregando módulos...</span>
            </div>
          ) : filteredModules.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Módulo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pricing</TableHead>
                  <TableHead>Implementações</TableHead>
                  <TableHead>Tenants</TableHead>
                  <TableHead>Health</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredModules.map((module) => (
                  <TableRow key={module.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{module.name}</div>
                        <div className="text-sm text-muted-foreground">{module.slug} v{module.version}</div>
                        <div className="text-xs text-muted-foreground mt-1">{module.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{module.category}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(module.maturity_status)}</TableCell>
                    <TableCell>{getPricingBadge(module.pricing_tier)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {module.implementations.map((impl) => (
                          <div key={impl.id} className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {impl.client_type}
                            </Badge>
                            {impl.is_available ? (
                              <CheckCircle className="w-3 h-3 text-green-600" />
                            ) : (
                              <AlertTriangle className="w-3 h-3 text-yellow-600" />
                            )}
                            <span className="text-xs">{impl.tenant_count} tenants</span>
                          </div>
                        ))}
                        {module.implementations.length === 0 && (
                          <span className="text-xs text-muted-foreground">Nenhuma implementação</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className="text-lg font-semibold">{module.tenant_count}</div>
                        <div className="text-xs text-muted-foreground">ativos</div>
                      </div>
                    </TableCell>
                    <TableCell>{getHealthBadge(module.health_score)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedModule(module);
                            setImplementationDialogOpen(true);
                          }}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Settings className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum módulo encontrado.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para nova implementação */}
      <Dialog open={implementationDialogOpen} onOpenChange={setImplementationDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Implementação</DialogTitle>
            <DialogDescription>
              Adicionar implementação para {selectedModule?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo de Cliente</Label>
              <Select
                value={implementationForm.client_type}
                onValueChange={(value) => setImplementationForm(prev => ({ ...prev, client_type: value as ClientType }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="banban">Banban</SelectItem>
                  <SelectItem value="riachuelo">Riachuelo</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                  <SelectItem value="default">Padrão</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Caminho do Componente</Label>
              <Input
                value={implementationForm.component_path}
                onChange={(e) => setImplementationForm(prev => ({ ...prev, component_path: e.target.value }))}
                placeholder="@/clients/banban/modules/module-name"
              />
            </div>
            <div>
              <Label>Nome de Exibição</Label>
              <Input
                value={implementationForm.name}
                onChange={(e) => setImplementationForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome personalizado para o cliente"
              />
            </div>
            <div>
              <Label>Ícone (Lucide)</Label>
              <Input
                value={implementationForm.icon_name}
                onChange={(e) => setImplementationForm(prev => ({ ...prev, icon_name: e.target.value }))}
                placeholder="ex: BarChart3, AlertTriangle"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={implementationForm.is_available}
                onCheckedChange={(checked) => setImplementationForm(prev => ({ ...prev, is_available: checked }))}
              />
              <Label>Disponível para uso</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImplementationDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={addImplementation} disabled={saving}>
              {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ModuleManager;