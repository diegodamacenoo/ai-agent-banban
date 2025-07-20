/**
 * PermissionManager - Sistema granular de permissões por usuário/papel
 * Fase 5: Admin Interface Enhancement
 * 
 * Sistema completo para:
 * - Gerenciar permissões por módulo
 * - Definir papéis e hierarquias
 * - Configurar acesso por organização
 * - Auditar alterações de permissões
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';
import { 
  Shield, 
  Users, 
  UserCheck, 
  UserX,
  Settings,
  Eye,
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  Save,
  Search,
  Filter,
  Lock,
  Unlock,
  Crown,
  User,
  Building,
  Key,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Globe,
  Database,
  Code
} from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';
import { Label } from '@/shared/ui/label';
import { Switch } from '@/shared/ui/switch';
import { Checkbox } from '@/shared/ui/checkbox';
import { useToast } from '@/shared/ui/toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui/tooltip';

interface PermissionManagerProps {
  className?: string;
}

interface Permission {
  id: string;
  module_slug: string;
  permission_key: string;
  permission_name: string;
  description: string;
  category: 'read' | 'write' | 'admin' | 'special';
  is_sensitive: boolean;
  created_at: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  level: number; // 1=basic, 2=advanced, 3=admin, 4=super_admin
  is_system_role: boolean;
  permissions: string[];
  user_count: number;
  organization_count: number;
  created_at: string;
}

interface UserPermission {
  user_id: string;
  user_name: string;
  user_email: string;
  organization_id: string;
  organization_name: string;
  role_id: string;
  role_name: string;
  additional_permissions: string[];
  restricted_permissions: string[];
  last_access: string;
  status: 'active' | 'suspended' | 'pending';
}

interface PermissionAuditLog {
  id: string;
  action: 'granted' | 'revoked' | 'modified';
  target_type: 'user' | 'role' | 'organization';
  target_id: string;
  target_name: string;
  permission_key: string;
  changed_by: string;
  reason?: string;
  timestamp: string;
}

/**
 * Sistema granular de permissões
 */
export const PermissionManager: React.FC<PermissionManagerProps> = ({ className }) => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
  const [auditLogs, setAuditLogs] = useState<PermissionAuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('permissions');
  const { toast } = useToast();

  // Carregar dados
  const loadData = async () => {
    setLoading(true);
    try {
      // Simulação de dados - em produção viria da API
      const mockPermissions: Permission[] = [
        {
          id: '1',
          module_slug: 'alerts',
          permission_key: 'alerts.view',
          permission_name: 'Visualizar Alertas',
          description: 'Permite visualizar alertas e notificações',
          category: 'read',
          is_sensitive: false,
          created_at: '2024-01-15T10:00:00Z'
        },
        {
          id: '2',
          module_slug: 'alerts',
          permission_key: 'alerts.manage',
          permission_name: 'Gerenciar Alertas',
          description: 'Permite criar, editar e deletar alertas',
          category: 'write',
          is_sensitive: false,
          created_at: '2024-01-15T10:00:00Z'
        },
        {
          id: '3',
          module_slug: 'alerts',
          permission_key: 'alerts.admin',
          permission_name: 'Administrar Sistema de Alertas',
          description: 'Acesso completo ao sistema de alertas incluindo configurações avançadas',
          category: 'admin',
          is_sensitive: true,
          created_at: '2024-01-15T10:00:00Z'
        },
        {
          id: '4',
          module_slug: 'performance',
          permission_key: 'performance.view',
          permission_name: 'Visualizar Performance',
          description: 'Permite visualizar dados de performance e analytics',
          category: 'read',
          is_sensitive: false,
          created_at: '2024-02-01T08:00:00Z'
        },
        {
          id: '5',
          module_slug: 'performance',
          permission_key: 'performance.export',
          permission_name: 'Exportar Dados de Performance',
          description: 'Permite exportar relatórios de performance',
          category: 'special',
          is_sensitive: true,
          created_at: '2024-02-01T08:00:00Z'
        },
        {
          id: '6',
          module_slug: 'system',
          permission_key: 'system.admin',
          permission_name: 'Administração do Sistema',
          description: 'Acesso total ao sistema, incluindo configurações críticas',
          category: 'admin',
          is_sensitive: true,
          created_at: '2024-01-01T00:00:00Z'
        }
      ];

      const mockRoles: Role[] = [
        {
          id: '1',
          name: 'Visualizador',
          description: 'Acesso apenas para visualização de dados',
          level: 1,
          is_system_role: true,
          permissions: ['alerts.view', 'performance.view'],
          user_count: 45,
          organization_count: 12,
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          name: 'Operador',
          description: 'Pode visualizar e gerenciar operações básicas',
          level: 2,
          is_system_role: true,
          permissions: ['alerts.view', 'alerts.manage', 'performance.view'],
          user_count: 28,
          organization_count: 8,
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '3',
          name: 'Administrador',
          description: 'Acesso administrativo completo',
          level: 3,
          is_system_role: true,
          permissions: ['alerts.view', 'alerts.manage', 'alerts.admin', 'performance.view', 'performance.export'],
          user_count: 12,
          organization_count: 5,
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '4',
          name: 'Super Admin',
          description: 'Acesso completo ao sistema',
          level: 4,
          is_system_role: true,
          permissions: ['alerts.view', 'alerts.manage', 'alerts.admin', 'performance.view', 'performance.export', 'system.admin'],
          user_count: 3,
          organization_count: 1,
          created_at: '2024-01-01T00:00:00Z'
        }
      ];

      const mockUserPermissions: UserPermission[] = [
        {
          user_id: '1',
          user_name: 'João Silva',
          user_email: 'joao@banban.com.br',
          organization_id: '1',
          organization_name: 'Banban Corp',
          role_id: '3',
          role_name: 'Administrador',
          additional_permissions: ['performance.export'],
          restricted_permissions: [],
          last_access: '2024-07-02T14:30:00Z',
          status: 'active'
        },
        {
          user_id: '2',
          user_name: 'Maria Santos',
          user_email: 'maria@riachuelo.com.br',
          organization_id: '2',
          organization_name: 'Riachuelo',
          role_id: '2',
          role_name: 'Operador',
          additional_permissions: [],
          restricted_permissions: ['alerts.manage'],
          last_access: '2024-07-01T09:15:00Z',
          status: 'active'
        },
        {
          user_id: '3',
          user_name: 'Carlos Oliveira',
          user_email: 'carlos@empresa.com',
          organization_id: '3',
          organization_name: 'Empresa ABC',
          role_id: '1',
          role_name: 'Visualizador',
          additional_permissions: [],
          restricted_permissions: [],
          last_access: '2024-06-28T16:45:00Z',
          status: 'suspended'
        }
      ];

      const mockAuditLogs: PermissionAuditLog[] = [
        {
          id: '1',
          action: 'granted',
          target_type: 'user',
          target_id: '1',
          target_name: 'João Silva',
          permission_key: 'performance.export',
          changed_by: 'admin@system.com',
          reason: 'Aprovação para exportação de relatórios',
          timestamp: '2024-07-02T10:00:00Z'
        },
        {
          id: '2',
          action: 'revoked',
          target_type: 'user',
          target_id: '2',
          target_name: 'Maria Santos',
          permission_key: 'alerts.manage',
          changed_by: 'supervisor@riachuelo.com.br',
          reason: 'Violação de política de segurança',
          timestamp: '2024-07-01T15:30:00Z'
        },
        {
          id: '3',
          action: 'modified',
          target_type: 'role',
          target_id: '2',
          target_name: 'Operador',
          permission_key: 'performance.view',
          changed_by: 'admin@system.com',
          timestamp: '2024-06-30T11:20:00Z'
        }
      ];

      setPermissions(mockPermissions);
      setRoles(mockRoles);
      setUserPermissions(mockUserPermissions);
      setAuditLogs(mockAuditLogs);

      console.debug(`✅ Dados de permissões carregados: ${mockPermissions.length} permissões, ${mockRoles.length} papéis`);

    } catch (error) {
      console.error('❌ Erro ao carregar dados de permissões:', error);
      toast.error("Não foi possível carregar as informações de permissões.", {
        title: "Erro ao carregar dados",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar dados
  const filteredPermissions = permissions.filter(permission => {
    const matchesSearch = permission.permission_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         permission.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = selectedModule === 'all' || permission.module_slug === selectedModule;
    return matchesSearch && matchesModule;
  });

  const filteredUserPermissions = userPermissions.filter(user => {
    const matchesSearch = user.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.organization_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role_id === selectedRole;
    return matchesSearch && matchesRole;
  });

  // Helper functions
  const getCategoryBadge = (category: string) => {
    const variants = {
      read: 'secondary',
      write: 'default',
      admin: 'light_warning',
      special: 'light_destructive'
    } as const;
    
    const labels = {
      read: 'Leitura',
      write: 'Escrita',
      admin: 'Admin',
      special: 'Especial'
    } as const;
    
    return (
      <Badge variant={variants[category as keyof typeof variants] || 'outline'}>
        {labels[category as keyof typeof labels] || category}
      </Badge>
    );
  };

  const getRoleLevelBadge = (level: number) => {
    const configs = {
      1: { variant: 'secondary', label: 'Básico', icon: User },
      2: { variant: 'default', label: 'Avançado', icon: UserCheck },
      3: { variant: 'light_warning', label: 'Admin', icon: Shield },
      4: { variant: 'light_destructive', label: 'Super', icon: Crown }
    } as const;
    
    const config = configs[level as keyof typeof configs] || configs[1];
    const IconComponent = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'light_success',
      suspended: 'light_destructive',
      pending: 'light_warning'
    } as const;
    
    const labels = {
      active: 'Ativo',
      suspended: 'Suspenso',
      pending: 'Pendente'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getActionBadge = (action: string) => {
    const variants = {
      granted: 'light_success',
      revoked: 'light_destructive',
      modified: 'light_warning'
    } as const;
    
    const labels = {
      granted: 'Concedida',
      revoked: 'Revogada',
      modified: 'Modificada'
    } as const;
    
    return (
      <Badge variant={variants[action as keyof typeof variants] || 'outline'}>
        {labels[action as keyof typeof labels] || action}
      </Badge>
    );
  };

  // Carregar dados na inicialização
  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header com estatísticas */}
      <Card size="sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Sistema de Permissões
              </CardTitle>
              <CardDescription>
                Gerencie permissões, papéis e controle de acesso granular por módulo e usuário.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={loadData}
                disabled={loading}
                leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
              >
                Atualizar
              </Button>
              <Button leftIcon={<Plus className="w-4 h-4" />}>
                Nova Permissão
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-4 gap-4">
        <Card size="sm">
          <CardContent>
            <div className="flex items-center">
              <Key className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Permissões</p>
                <p className="text-2xl font-bold">{permissions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent>
            <div className="flex items-center">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Papéis</p>
                <p className="text-2xl font-bold">{roles.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent>
            <div className="flex items-center">
              <UserCheck className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Usuários Ativos</p>
                <p className="text-2xl font-bold">
                  {userPermissions.filter(u => u.status === 'active').length}
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
                <p className="text-sm font-medium leading-none">Ações Hoje</p>
                <p className="text-2xl font-bold">
                  {auditLogs.filter(log => 
                    new Date(log.timestamp).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="permissions">Permissões</TabsTrigger>
          <TabsTrigger value="roles">Papéis</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="audit">Auditoria</TabsTrigger>
        </TabsList>

        {/* Tab: Permissões */}
        <TabsContent value="permissions">
          <Card size="sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Permissões do Sistema</CardTitle>
                  <CardDescription>
                    Configure permissões disponíveis por módulo e categoria.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filtros */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1">
                  <Input
                    placeholder="Buscar permissões..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    leftIcon={<Search className="w-4 h-4" />}
                  />
                </div>
                <Select value={selectedModule} onValueChange={setSelectedModule}>
                  <SelectTrigger className="w-48" icon={Filter}>
                    <SelectValue placeholder="Módulo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os módulos</SelectItem>
                    <SelectItem value="alerts">Alertas</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="system">Sistema</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tabela de permissões */}
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                  <span>Carregando permissões...</span>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Permissão</TableHead>
                      <TableHead>Módulo</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Sensível</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPermissions.map((permission) => (
                      <TableRow key={permission.id}>
                        <TableCell>
                          <div className="font-medium">{permission.permission_name}</div>
                          <div className="text-sm text-muted-foreground font-mono">
                            {permission.permission_key}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{permission.module_slug}</Badge>
                        </TableCell>
                        <TableCell>{getCategoryBadge(permission.category)}</TableCell>
                        <TableCell>
                          {permission.is_sensitive ? (
                            <Badge variant="light_destructive" className="flex items-center gap-1 w-fit">
                              <Lock className="w-3 h-3" />
                              Sim
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                              <Unlock className="w-3 h-3" />
                              Não
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <p className="text-sm">{permission.description}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm">
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Papéis */}
        <TabsContent value="roles">
          <Card size="sm">
            <CardHeader>
              <CardTitle>Papéis do Sistema</CardTitle>
              <CardDescription>
                Gerencie papéis e suas permissões associadas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Papel</TableHead>
                    <TableHead>Nível</TableHead>
                    <TableHead>Usuários</TableHead>
                    <TableHead>Organizações</TableHead>
                    <TableHead>Permissões</TableHead>
                    <TableHead>Sistema</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{role.name}</div>
                          <div className="text-sm text-muted-foreground">{role.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleLevelBadge(role.level)}</TableCell>
                      <TableCell>
                        <div className="text-center">
                          <div className="text-lg font-semibold">{role.user_count}</div>
                          <div className="text-xs text-muted-foreground">usuários</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <div className="text-lg font-semibold">{role.organization_count}</div>
                          <div className="text-xs text-muted-foreground">orgs</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="cursor-help">
                                {role.permissions.length} permissões
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <div className="space-y-1">
                                {role.permissions.map(perm => (
                                  <div key={perm} className="text-xs">{perm}</div>
                                ))}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        {role.is_system_role ? (
                          <Badge variant="secondary">Sistema</Badge>
                        ) : (
                          <Badge variant="outline">Customizado</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm">
                            <Edit className="w-3 h-3" />
                          </Button>
                          {!role.is_system_role && (
                            <Button variant="ghost" size="sm">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Usuários */}
        <TabsContent value="users">
          <Card size="sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Permissões de Usuários</CardTitle>
                  <CardDescription>
                    Visualize e gerencie permissões específicas por usuário.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filtros */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1">
                  <Input
                    placeholder="Buscar usuários..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    leftIcon={<Search className="w-4 h-4" />}
                  />
                </div>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-48" icon={Filter}>
                    <SelectValue placeholder="Papel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os papéis</SelectItem>
                    {roles.map(role => (
                      <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Organização</TableHead>
                    <TableHead>Papel</TableHead>
                    <TableHead>Permissões Extra</TableHead>
                    <TableHead>Restrições</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Último Acesso</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUserPermissions.map((user) => (
                    <TableRow key={`${user.user_id}-${user.organization_id}`}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.user_name}</div>
                          <div className="text-sm text-muted-foreground">{user.user_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-muted-foreground" />
                          <span>{user.organization_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.role_name}</Badge>
                      </TableCell>
                      <TableCell>
                        {user.additional_permissions.length > 0 ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="light_success" className="cursor-help">
                                  +{user.additional_permissions.length}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <div className="space-y-1">
                                  {user.additional_permissions.map(perm => (
                                    <div key={perm} className="text-xs">{perm}</div>
                                  ))}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.restricted_permissions.length > 0 ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="light_destructive" className="cursor-help">
                                  -{user.restricted_permissions.length}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <div className="space-y-1">
                                  {user.restricted_permissions.map(perm => (
                                    <div key={perm} className="text-xs">{perm}</div>
                                  ))}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(user.last_access).toLocaleDateString('pt-BR')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Auditoria */}
        <TabsContent value="audit">
          <Card size="sm">
            <CardHeader>
              <CardTitle>Log de Auditoria</CardTitle>
              <CardDescription>
                Histórico de alterações de permissões e acessos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Alvo</TableHead>
                    <TableHead>Permissão</TableHead>
                    <TableHead>Alterado Por</TableHead>
                    <TableHead>Motivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(log.timestamp).toLocaleString('pt-BR')}
                        </div>
                      </TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.target_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {log.target_type === 'user' ? 'Usuário' : 
                             log.target_type === 'role' ? 'Papel' : 'Organização'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-1 rounded">
                          {log.permission_key}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{log.changed_by}</div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="text-sm">{log.reason || '-'}</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PermissionManager;