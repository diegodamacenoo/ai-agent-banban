'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Skeleton } from '@/shared/ui/skeleton';
import {
  Users,
  Settings,
  Building2,
  Code,
  Edit,
  Plus,
  Database,
  Package,
  Search,
  MoreHorizontal,
  Trash2,
  CircleDashed,
  ChevronsDownUp,
  ChevronsUpDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { NewAssignmentDialog, DeleteAssignmentDialog } from '.';
import { EditConfigurationDialog } from '../configurations';

// ... (interfaces permanecem as mesmas)

interface BaseModule {
  id: string;
  slug: string;
  name: string;
  category: string;
}

interface ModuleImplementation {
  id: string;
  base_module_id: string;
  implementation_key: string;
  name: string;
  audience: string;
  is_active: boolean;
}

interface TenantModuleAssignment {
  tenant_id: string;
  base_module_id: string;
  implementation_id: string;
  organization_name: string;
  organization_slug: string;
  module_slug: string;
  module_name: string;
  module_category: string;
  implementation_key: string;
  implementation_name: string;
  component_path: string;
  assignment_active: boolean;
  custom_config: Record<string, any>;
  assigned_at: string;
}

interface TenantGroup {
  tenantId: string;
  organizationName: string;
  organizationSlug: string;
  assignments: TenantModuleAssignment[];
}

interface TenantAssignmentsManagerProps {
  tenantGroups: TenantGroup[];
  assignments: TenantModuleAssignment[];
  baseModules: BaseModule[];
  implementations: ModuleImplementation[];
  organizations: any[]; // AIDEV-NOTE: Temporarily using any[] for quick fix. Should be replaced with a proper type.
  loading: boolean;
  updateModuleConfig: (tenantId: string, baseModuleId: string, config: Record<string, any>) => Promise<void>;
  getAssignmentsForTenant: (tenantId: string) => TenantModuleAssignment[];
  onAssignmentCreated?: () => void;
  onOptimisticCreate?: (newAssignment: TenantModuleAssignment) => string;
  onOptimisticUpdate?: (updatedAssignment: TenantModuleAssignment) => string;
  onOptimisticDelete?: (tenantId: string, baseModuleId: string, assignmentInfo?: { organizationName: string, moduleName: string }) => string;
  onServerSuccess?: (operationId: string, serverData?: TenantModuleAssignment) => void;
  onServerError?: (operationId: string, errorMessage: string) => void;
  hasOptimisticOperations?: boolean;
}


export function TenantAssignmentsManager({
  tenantGroups,
  assignments,
  baseModules,
  implementations,
  organizations,
  loading,
  updateModuleConfig,
  getAssignmentsForTenant,
  onAssignmentCreated,
  onOptimisticCreate,
  onOptimisticUpdate,
  onOptimisticDelete,
  onServerSuccess,
  onServerError,
  hasOptimisticOperations,
}: TenantAssignmentsManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<string>('all');
  // Estados de edição de configuração removidos (agora via dialog)
  const [expandedTenants, setExpandedTenants] = useState<Record<string, boolean>>({});
  const [isAllExpanded, setIsAllExpanded] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  const filteredTenants = useMemo(() => {
    const filtered = tenantGroups.filter(tenant => {
      const matchesSearch = searchTerm === '' ||
        tenant.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.organizationSlug.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTenant = selectedTenant === 'all' || tenant.tenantId === selectedTenant;

      return matchesSearch && matchesTenant;
    }).sort((a, b) => a.organizationName.localeCompare(b.organizationName));
    
    return filtered;
  }, [tenantGroups, searchTerm, selectedTenant]);

  const uniqueTenants = useMemo(() => {
    return tenantGroups.sort((a, b) => a.organizationName.localeCompare(b.organizationName));
  }, [tenantGroups]);

  // Expandir automaticamente a primeira organização no primeiro acesso
  useEffect(() => {
    if (!hasInitialized && filteredTenants.length > 0) {
      const firstTenant = filteredTenants[0];
      if (firstTenant) {
        setExpandedTenants(prev => ({
          ...prev,
          [firstTenant.tenantId]: true
        }));
        setHasInitialized(true);
      }
    }
  }, [filteredTenants, hasInitialized]);

  // Funções de edição de configuração removidas (agora via dialog)

  const handleDeleteSuccess = () => {
    if (onAssignmentCreated) {
      onAssignmentCreated();
    }
  };

  const toggleTenantExpansion = (tenantId: string) => {
    setExpandedTenants(prev => ({
      ...prev,
      [tenantId]: !prev[tenantId]
    }));
  };

  const toggleAllTenants = () => {
    const newExpandedState = !isAllExpanded;
    setIsAllExpanded(newExpandedState);

    const newExpanded: Record<string, boolean> = {};
    filteredTenants.forEach(tenant => {
      newExpanded[tenant.tenantId] = newExpandedState;
    });
    setExpandedTenants(newExpanded);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Database className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar organizações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="pl-10"
          />
        </div>

        <Select value={selectedTenant} onValueChange={setSelectedTenant}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Selecionar organização" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as organizações</SelectItem>
            {uniqueTenants.map(tenant => (
              <SelectItem key={tenant.tenantId} value={tenant.tenantId}>
                {tenant.organizationName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="secondary"
          onClick={toggleAllTenants}
          leftIcon={isAllExpanded ? <ChevronsDownUp className="w-4 h-4" /> : <ChevronsUpDown className="w-4 h-4" />}
        >
        </Button>

      </div>

      {/* Lista de Tenants e seus Assignments */}
      {filteredTenants.length === 0 ? (
        <Card size="sm" variant="accent" className="p-6">
          <CardContent className="min-h-[100px] p-6 flex flex-col justify-center items-center text-center text-[hsl(var(--muted-foreground))]">
            <CircleDashed className="w-8 h-8 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">
              {searchTerm || selectedTenant !== 'all'
                ? 'Nenhuma organização encontrada com os filtros aplicados.'
                : 'Nenhuma atribuição encontrada.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-1">
          {filteredTenants.map((tenant) => {
            const isExpanded = expandedTenants[tenant.tenantId] ?? false;

            return (
              <Card key={tenant.tenantId} variant="highlight" className="p-1 bg-[hsl(var(--highlight))]">
                {/* Tenant Header */}
                <div className="flex flex-row gap-3 px-4 py-2 items-center justify-between">
                  <div className="w-fit flex items-center gap-3">
                    <Building2 strokeWidth={2.5} className="w-4 h-4 text-[hsl(var(--highlight-foreground))]" />
                    <div className="text-left">
                      <p className="font-medium text-sm">{tenant.organizationName}</p>
                    </div>
                  </div>
                  <div className="w-fit flex items-center gap-2">
                    <span className="text-xs">
                      {tenant.assignments.length} atribuições
                    </span>
                    <NewAssignmentDialog
                      initialTenantId={tenant.tenantId}
                      tenants={tenantGroups}
                      organizations={organizations}
                      baseModules={baseModules}
                      implementations={implementations}
                      onAssignmentCreated={onAssignmentCreated}
                      onOptimisticCreate={onOptimisticCreate}
                      onServerSuccess={onServerSuccess}
                      onServerError={onServerError}
                      trigger={
                        <Button 
                          variant="highlight" 
                          size="icon" 
                          leftIcon={<Plus className="w-4 h-4" />}
                        ></Button>
                      }
                    />
                    <Button
                      variant="highlight"
                      size="icon"
                      onClick={() => toggleTenantExpansion(tenant.tenantId)}
                      leftIcon={isExpanded ? <ChevronsDownUp className="w-4 h-4" /> : <ChevronsUpDown className="w-4 h-4" />}
                    >
                    </Button>
                  </div>
                </div>

                {/* Assignments List */}
                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                  <Card size="xs" className="space-y-2">
                    {tenant.assignments.length === 0 ? (
                      <div className="text-center text-muted-foreground">
                        <Package className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm">Nenhuma atribuição encontrada</p>
                        <NewAssignmentDialog
                          initialTenantId={tenant.tenantId}
                          tenants={tenantGroups}
                          organizations={organizations}
                          baseModules={baseModules}
                          implementations={implementations}
                          onAssignmentCreated={onAssignmentCreated}
                          onOptimisticCreate={onOptimisticCreate}
                          onServerSuccess={onServerSuccess}
                          onServerError={onServerError}
                          trigger={
                            <Button variant="outline" size="sm" className="mt-2">
                              <Plus className="w-4 h-4 mr-2" />
                              Criar Primeira Atribuição
                            </Button>
                          }
                        />
                      </div>
                    ) : (
                      <>
                        {/* Assignments Body */}
                        <div className="space-y-1">
                          {tenant.assignments
                            .sort((a, b) => {
                              // Primeiro ordenar por status (ativos primeiro)
                              if (a.assignment_active !== b.assignment_active) {
                                return a.assignment_active ? -1 : 1;
                              }
                              // Depois ordenar alfabeticamente por nome do módulo
                              return a.module_name.localeCompare(b.module_name);
                            })
                            .map((assignment, idx) => {
                            const assignmentKey = `${assignment.tenant_id}-${assignment.base_module_id}`;
                            const hasCustomConfig = Object.keys(assignment.custom_config || {}).length > 0;

                            return (
                              <div key={assignmentKey}>
                                <div className="md:grid md:grid-cols-[3fr_3fr_2fr_1fr_0.5fr] gap-4 px-3 py-2 rounded-lg transition-all hover:bg-[hsl(var(--secondary))]">
                                  {/* Module Name */}
                                  <div className="flex gap-3">
                                    <div>
                                      <div className="flex gap-2">
                                        <span className="font-medium text-sm">{assignment.module_name}</span>
                                      </div>
                                      <p className="text-sm text-muted-foreground font-mono">
                                        {assignment.module_category}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Implementation */}
                                  <div className="flex items-center">
                                    <div>
                                      <span className="text-sm font-medium">{assignment.implementation_name}</span>
                                      <p className="text-sm text-muted-foreground">{assignment.implementation_key}</p>
                                    </div>
                                  </div>

                                  {/* Config */}
                                  <div className="flex items-center">
                                    <div className="flex items-center gap-2">
                                      {hasCustomConfig ? (
                                        <>
                                          <Code className="w-4 h-4 text-[hsl(var(--color-green-300))]" />
                                          <Badge variant="secondary">
                                            {Object.keys(assignment.custom_config).length} configs
                                          </Badge>
                                        </>
                                      ) : (
                                        <span className="text-sm text-muted-foreground">Configuração padrão</span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Status */}
                                  <div className="flex items-center">
                                    <Badge variant={assignment.assignment_active ? "default" : "secondary"}>
                                      {assignment.assignment_active ? 'Ativo' : 'Inativo'}
                                    </Badge>
                                  </div>

                                  {/* Actions */}
                                  <div className="flex items-center justify-end">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                          <MoreHorizontal className="w-4 h-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <EditConfigurationDialog
                                          tenantId={assignment.tenant_id}
                                          baseModuleId={assignment.base_module_id}
                                          moduleName={assignment.module_name}
                                          organizationName={tenant.organizationName}
                                          currentConfig={assignment.custom_config || {}}
                                          onSuccess={handleDeleteSuccess}
                                          updateModuleConfig={updateModuleConfig}
                                          onOptimisticUpdate={onOptimisticUpdate}
                                          onServerSuccess={onServerSuccess}
                                          onServerError={onServerError}
                                          trigger={
                                            <DropdownMenuItem
                                              onSelect={(e) => e.preventDefault()}
                                              icon={Edit}
                                            >
                                              Editar Configuração
                                            </DropdownMenuItem>
                                          }
                                        />
                                        <DeleteAssignmentDialog
                                          tenantId={assignment.tenant_id}
                                          baseModuleId={assignment.base_module_id}
                                          moduleName={assignment.module_name}
                                          organizationName={tenant.organizationName}
                                          onSuccess={handleDeleteSuccess}
                                          onOptimisticDelete={onOptimisticDelete}
                                          onServerSuccess={onServerSuccess}
                                          onServerError={onServerError}
                                          trigger={
                                            <DropdownMenuItem
                                              onSelect={(e) => e.preventDefault()}
                                              className="text-red-500 focus:text-red-500"
                                              icon={Trash2}
                                            >
                                              Desatribuir
                                            </DropdownMenuItem>
                                          }
                                        />
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                                {idx < tenant.assignments.length - 1 && (
                                  <div className="my-1">
                                    <hr className="border-muted" />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </Card>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Resumo */}
      <Card className="p-0">
        <CardContent className="px-2">
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>
              {filteredTenants.length} organizações com atribuições
            </span>
            <span>
              Total: {assignments.filter(a => a.assignment_active).length} atribuições ativas
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
