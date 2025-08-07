'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';
import { 
  Search, 
  Package, 
  Settings, 
  Play, 
  Pause, 
  MoreHorizontal,
  CheckCircle,
  AlertTriangle,
  FileX,
  Archive,
  Activity,
  Building2,
  SlidersHorizontal,
  HelpCircle,
  ChevronDown
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem
} from '@/shared/ui/dropdown-menu';
import { useToast } from '@/shared/ui/toast';
import { getAllModulesWithOrganizationAssignments, ModuleWithOrganizations } from '@/app/actions/admin/modules/module-organization-data';
import { ModuleHealthStatus } from '@/shared/types/module-lifecycle';
import { MODULE_STATUS_LABELS } from '@/shared/constants/module-labels';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface EnhancedModule extends ModuleWithOrganizations {
  // Campos adicionais para exibição na tabela, se necessário
  // status: ModuleHealthStatus; // Será derivado das organizações
  // organization?: Organization; // Será derivado das organizações
  // file_path?: string; // Não disponível na nova estrutura
  // file_last_seen?: string; // Não disponível na nova estrutura
  // missing_since?: string; // Não disponível na nova estrutura
  // activated_at?: string; // Disponível em organizations[].activated_at
  // implemented_at?: string; // Não disponível na nova estrutura
}

export function EnhancedModulesListCard() {
  const { toast } = useToast();
  const router = useRouter();
  const [modules, setModules] = useState<EnhancedModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ModuleHealthStatus | 'all'>('all');
  const [healthFilter, setHealthFilter] = useState<ModuleHealthStatus[]>([]);

  // Status icons mapping
  const statusIcons = {
    discovered: Package,
    implemented: CheckCircle,
    active: Activity,
    missing: FileX,
    orphaned: AlertTriangle,
    archived: Archive
  };

  // Status colors mapping
  const statusVariants = {
    discovered: 'outline',
    implemented: 'success',
    active: 'success',
    missing: 'destructive',
    orphaned: 'warning',
    archived: 'outline'
  };

  // Carregar dados iniciais
  useEffect(() => {
    loadAllModules();
  }, []);

  const loadAllModules = async () => {
    try {
      setLoading(true);
      const response = await getAllModulesWithOrganizationAssignments();
      if (response.success && response.data) {
        setModules(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar todos os modulos:', error);
      toast.error("Nao foi possivel carregar a lista de modulos.", {
        title: "Erro ao carregar modulos",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleActivateModule = async (module: EnhancedModule, organizationId: string) => {
    try {
      const result = await updateTenantModuleStatus(organizationId, module.id, true);
      
      if (result.success) {
        toast.success(`O modulo "${module.name}" foi ativado com sucesso para a organização ${organizationId}.`, {
          title: "Modulo ativado",
        });
        loadAllModules();
      } else {
        toast.error(result.error || "Ocorreu um erro inesperado", {
          title: "Erro ao ativar modulo",
        });
      }
    } catch (error) {
      console.error('Erro ao ativar modulo:', error);
      toast.error("Ocorreu um erro ao ativar o modulo", {
        title: "Erro ao ativar modulo",
      });
    }
  };

  const handleDeactivateModule = async (module: EnhancedModule, organizationId: string) => {
    try {
      const result = await updateTenantModuleStatus(organizationId, module.id, false);
      
      if (result.success) {
        toast.success(`O modulo "${module.name}" foi desativado com sucesso para a organização ${organizationId}.`, {
          title: "Modulo desativado",
        });
        loadAllModules();
      } else {
        toast.error(result.error || "Ocorreu um erro inesperado", {
          title: "Erro ao desativar modulo",
        });
      }
    } catch (error) {
      console.error('Erro ao desativar modulo:', error);
      toast.error("Ocorreu um erro ao desativar o modulo", {
        title: "Erro ao desativar modulo",
      });
    }
  };

  const handleUnassignModule = async (module: EnhancedModule, organizationId: string) => {
    try {
      const confirmed = window.confirm(
        `Tem certeza que deseja desatribuir o modulo "${module.name}" da organização ${organizationId}?\n\nEsta acao ira:\n• Remover o modulo da lista ativa para esta organização\n• Manter historico para auditoria\n• Permitir reatribuicao posterior`
      );

      if (!confirmed) return;

      const result = await unassignModuleFromOrg(organizationId, module.id);
      
      if (result.success) {
        toast.success(`O modulo "${module.name}" foi desatribuido com sucesso da organização ${organizationId}.`, {
          title: "Modulo desatribuido",
        });
        loadAllModules();
      } else {
        toast.error(result.error || "Ocorreu um erro inesperado", {
          title: "Erro ao desatribuir modulo",
        });
      }
    } catch (error) {
      console.error('Erro ao desatribuir modulo:', error);
      toast.error("Ocorreu um erro ao desatribuir o modulo", {
        title: "Erro ao desatribuir modulo",
      });
    }
  };

  // Filtrar módulos baseado em critérios
  const filteredModules = useMemo(() => {
    let result = modules;

    // Filtro por termo de busca
    if (searchTerm) {
      result = result.filter(module =>
        module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        module.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        module.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        module.organizations.some(org => org.organization_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtro por status (precisa ser adaptado para a nova estrutura)
    if (statusFilter !== 'all') {
      result = result.filter(module =>
        module.organizations.some(org => {
          if (statusFilter === 'active') return org.status === 'ENABLED';
          if (statusFilter === 'implemented') return org.status === 'ENABLED' || org.status === 'PROVISIONING';
          if (statusFilter === 'archived') return org.status === 'ARCHIVED';
          // Para 'discovered', 'missing', 'orphaned', a lógica é mais complexa e pode não ser diretamente mapeável aqui
          return false;
        })
      );
    }

    // Filtro por health status (precisa ser adaptado para a nova estrutura)
    if (healthFilter.length > 0) {
      result = result.filter(module =>
        module.organizations.some(org => healthFilter.includes(org.status))
      );
    }

    return result;
  }, [modules, searchTerm, statusFilter, healthFilter]);

  // Contar módulos por status para o dropdown
  const statusCounts = useMemo(() => {
    const counts: Record<ModuleHealthStatus | 'all', number> = {
      all: modules.length,
      discovered: 0,
      implemented: 0,
      active: 0,
      missing: 0,
      orphaned: 0,
      archived: 0
    };

    modules.forEach(module => {
      if (module.organizations.length === 0) {
        counts.discovered++; // Considerar como "descoberto" se não tiver atribuições
      } else {
        module.organizations.forEach(org => {
          if (org.status === 'ENABLED') {
            counts.active++;
          }
          if (org.status === 'ENABLED' || org.status === 'PROVISIONING') {
            counts.implemented++;
          }
          if (org.status === 'ARCHIVED') {
            counts.archived++;
          }
        });
      }
    });

    return counts;
  }, [modules]);

  const renderModuleRow = (module: EnhancedModule) => {
    // Determinar o status mais relevante para exibição na tabela
    let displayStatus: ModuleHealthStatus = 'discovered';
    let displayOrganizationName: string | undefined;
    let displayOrganizationId: string | undefined;

    if (module.organizations && module.organizations.length > 0) {
      // Priorizar status 'active' > 'implemented' > 'archived'
      const activeOrg = module.organizations.find(org => org.status === 'ENABLED');
      const implementedOrg = module.organizations.find(org => org.status === 'PROVISIONING');
      const archivedOrg = module.organizations.find(org => org.status === 'ARCHIVED');

      if (activeOrg) {
        displayStatus = 'active';
        displayOrganizationName = activeOrg.organization_name;
        displayOrganizationId = activeOrg.organization_id;
      } else if (implementedOrg) {
        displayStatus = 'implemented';
        displayOrganizationName = implementedOrg.organization_name;
        displayOrganizationId = implementedOrg.organization_id;
      } else if (archivedOrg) {
        displayStatus = 'archived';
        displayOrganizationName = archivedOrg.organization_name;
        displayOrganizationId = archivedOrg.organization_id;
      }
    }

    const StatusIcon = statusIcons[displayStatus] || HelpCircle;
    const statusLabel = MODULE_STATUS_LABELS[displayStatus as keyof typeof MODULE_STATUS_LABELS] || displayStatus;
    
    return (
      <TableRow key={module.id}>
        <TableCell>
          <div className="flex items-center gap-3">
            <StatusIcon className="h-4 w-4 text-gray-600" />
            <div>
              <p className="font-medium">{module.name}</p>
              <p className="text-xs text-muted-foreground">{module.slug}</p>
            </div>
          </div>
        </TableCell>
        
        <TableCell>
          <div className="flex items-center gap-2">
            <Badge variant={statusVariants[displayStatus as keyof typeof statusVariants] as any}>
              {statusLabel}
            </Badge>
            <Badge variant="outline" size="sm">
              {module.type || 'standard'}
            </Badge>
          </div>
        </TableCell>

        <TableCell>
          {displayOrganizationName ? (
            <div className="flex items-center gap-1">
              <Building2 className="h-3 w-3 text-gray-500" />
              <span className="text-sm">{displayOrganizationName}</span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">Não atribuído</span>
          )}
        </TableCell>

        <TableCell className="max-w-xs">
          <p className="text-sm text-muted-foreground truncate">
            {module.description || 'Sem descrição'}
          </p>
        </TableCell>

        <TableCell>
          {/* file_last_seen não está disponível na nova estrutura */}
          <span className="text-xs text-muted-foreground">N/A</span>
        </TableCell>

        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild icon={Settings} onClick={() => router.push(`/admin/modules/${module.id}/configure`)}  >
                Configurar
              </DropdownMenuItem>
              
              {/* Ativar - disponível para módulos implementados e com organização */}
              {displayOrganizationId && (displayStatus === 'implemented' || displayStatus === 'archived') && (
                <DropdownMenuItem onClick={() => handleActivateModule(module, displayOrganizationId)} icon={Play}>
                  Ativar
                </DropdownMenuItem>
              )}
              
              {/* Desativar - disponível para módulos ativos e com organização */}
              {displayOrganizationId && displayStatus === 'active' && (
                <DropdownMenuItem onClick={() => handleDeactivateModule(module, displayOrganizationId)} icon={Pause}>
                  Desativar
                </DropdownMenuItem>
              )}
              
              {/* Desatribuir (Arquivar) - disponível para módulos com organização */}
              {displayOrganizationId && (
                <DropdownMenuItem onClick={() => handleUnassignModule(module, displayOrganizationId)} icon={Archive} variant="warning">
                  Desatribuir
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <Card variant="default" size="sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Lista de Módulos
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar módulos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
            
            {/* Filtro por Status */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Status
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Filtrar por Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                  <div className="flex items-center justify-between w-full">
                    <span>Todos</span>
                    <Badge variant="secondary" size="sm">
                      {statusCounts.all}
                    </Badge>
                  </div>
                </DropdownMenuItem>
                {Object.entries(statusCounts)
                  .filter(([status]) => status !== 'all')
                  .map(([status, count]) => (
                    <DropdownMenuItem 
                      key={status} 
                      onClick={() => setStatusFilter(status as ModuleHealthStatus)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>
                          {MODULE_STATUS_LABELS[status as keyof typeof MODULE_STATUS_LABELS] || status}
                        </span>
                        <Badge variant="secondary" size="sm">
                          {count}
                        </Badge>
                      </div>
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-400 animate-pulse" />
            <p>Carregando módulos...</p>
          </div>
        ) : filteredModules.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-lg font-medium">Nenhum módulo encontrado</h3>
            <p>Tente ajustar os filtros ou critérios de busca.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Módulo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Organização</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Última Verificação</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredModules.map(renderModuleRow)}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
} 