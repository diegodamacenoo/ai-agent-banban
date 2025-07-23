'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

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
  Search,
  Database,
  Settings,
  Users,
  MoreHorizontal,
  Activity,
  Package,
  Edit,
  Power,
  Trash2,
  Archive,
  RotateCcw,
  FileX,
  Eye,
  BarChart3,
  Bell,
  Shield,
  Zap,
  Globe,
  type LucideProps,
  Check,
  X,
  CircleCheck,
  CircleMinus,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/shared/ui/dropdown-menu';
import { useRouter } from 'next/navigation';

// Import dos dialogs
import { 
  EditBaseModuleDialog,
  DeleteBaseModuleDialog,
  ToggleActiveStatusDialog,
  ArchiveBaseModuleDialog,
  RestoreBaseModuleDialog,
  PurgeBaseModuleDialog
} from '../../lifecycle';

interface BaseModule {
  id: string;
  slug: string;
  name: string;
  description?: string;
  category: string;
  icon?: string;
  route_pattern?: string;
  permissions_required?: string[];
  supports_multi_tenant?: boolean;
  config_schema?: any;
  dependencies?: string[];
  version?: string;
  tags?: string[];
  is_active: boolean;
  archived_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ModuleImplementation {
  id: string;
  base_module_id: string;
  implementation_key: string;
  name: string;
  component_path: string;
  audience: string;
  component_type: string;
  is_default: boolean;
  is_active: boolean;
  archived_at: string | null;
  deleted_at: string | null;
}

interface TenantModuleAssignment {
  tenant_id: string;
  base_module_id: string;
  organization_name: string;
  assignment_active: boolean;
}

interface BaseModulesTableProps {
  baseModules: BaseModule[];
  implementations: ModuleImplementation[];
  assignments: TenantModuleAssignment[];
  loading: boolean;
  getImplementationsForModule: (baseModuleId: string) => ModuleImplementation[];
  getAssignmentsForModule: (baseModuleId: string) => TenantModuleAssignment[];
  onModuleChange?: () => void;
  showArchived?: boolean;
  showDeleted?: boolean;
  setShowArchived: (value: boolean) => void;
  setShowDeleted: (value: boolean) => void;
  // Callbacks otimísticos para base modules
  onOptimisticUpdate?: (updatedModule: any) => string;
  onOptimisticArchive?: (moduleId: string) => string;
  onOptimisticDelete?: (moduleId: string) => string;
  onOptimisticRestore?: (moduleId: string) => string;
  onOptimisticPurge?: (moduleId: string) => string;
  onServerSuccess?: (operationId: string, serverData?: any) => void;
  onServerError?: (operationId: string, errorMessage: string) => void;
}

// Mapeamento de nomes de ícones para componentes
const iconComponents: { [key: string]: React.ComponentType<LucideProps> } = {
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
};

// Componente para renderizar o ícone dinamicamente
const IconRenderer = ({ name, ...props }: { name: string } & LucideProps) => {
  const LucideIcon = iconComponents[name];
  if (!LucideIcon) {
    return <Package {...props} />; // Ícone padrão
  }
  return <LucideIcon {...props} />;
};

export function BaseModulesTable({
  baseModules,
  implementations,
  assignments,
  loading,
  getImplementationsForModule,
  getAssignmentsForModule,
  onModuleChange,
  showArchived = false,
  showDeleted = false,
  setShowArchived,
  setShowDeleted,
  onOptimisticUpdate,
  onOptimisticArchive,
  onOptimisticDelete,
  onOptimisticRestore,
  onOptimisticPurge,
  onServerSuccess,
  onServerError,
}: BaseModulesTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const router = useRouter();

  // Determinar status do módulo baseado nos novos campos
  const getModuleStatus = (module: BaseModule) => {
    if (module.deleted_at) return 'deleted';
    if (module.archived_at) return 'archived';
    if (!module.is_active) return 'inactive';
    return 'active';
  };

  const getStatusBadge = (module: BaseModule) => {
    const status = getModuleStatus(module);
    switch (status) {
      case 'deleted':
        return { variant: 'destructive' as const, text: 'Deletado', icon: { Trash2 } };
      case 'archived':
        return { variant: 'secondary' as const, text: 'Arquivado', icon: { Archive } };
      case 'inactive':
        return { variant: 'muted' as const, text: 'Inativo', icon: { CircleMinus } };
      default:
        return { variant: 'success' as const, text: 'Ativo', icon: { Check } };
    }
  };

  // Processar dados para a tabela
  const processedModules = useMemo(() => {
    return baseModules.map(module => {
      const moduleImplementations = getImplementationsForModule(module.id);
      const moduleAssignments = getAssignmentsForModule(module.id);
      const activeAssignments = moduleAssignments.filter(a => a.assignment_active);

      // Calcular saúde do módulo
      const hasImplementations = moduleImplementations.length > 0;
      const hasActiveImplementations = moduleImplementations.some(impl => impl.is_active);
      const hasAssignments = activeAssignments.length > 0;

      let healthScore = 0;
      if (hasImplementations) healthScore += 40;
      if (hasActiveImplementations) healthScore += 30;
      if (hasAssignments) healthScore += 30;

      return {
        ...module,
        implementationsCount: moduleImplementations.length,
        activeImplementationsCount: moduleImplementations.filter(impl => impl.is_active).length,
        assignmentsCount: activeAssignments.length,
        organizationsCount: new Set(activeAssignments.map(a => a.tenant_id)).size,
        healthScore,
        implementations: moduleImplementations,
        assignments: activeAssignments
      };
    });
  }, [baseModules, getImplementationsForModule, getAssignmentsForModule]);

  // Filtrar módulos
  const filteredModules = useMemo(() => {
    console.log('🔍 FILTROS: Aplicando filtros otimísticos', { 
      total: processedModules.length, 
      showArchived, 
      showDeleted, 
      searchTerm, 
      categoryFilter 
    });
    
    const result = processedModules.filter(module => {
      const matchesSearch = searchTerm === '' ||
        module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        module.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        module.slug.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = categoryFilter === 'all' || module.category === categoryFilter;

      if (!matchesSearch || !matchesCategory) {
        return false;
      }

      // Lógica de filtro de status exclusiva
      const isArchived = module.archived_at !== null;
      const isDeleted = module.deleted_at !== null;
      const isActive = !isArchived && !isDeleted;

      // Se nenhum filtro de status estiver ativo, mostrar apenas os ativos
      if (!showArchived && !showDeleted) {
        return isActive;
      }

      // Se algum filtro estiver ativo, mostrar apenas os que correspondem
      let shouldShow = false;
      if (showArchived && isArchived) {
        shouldShow = true;
      }
      if (showDeleted && isDeleted) {
        shouldShow = true;
      }

      return shouldShow;
    });
    
    console.log('🔍 FILTROS: Resultado da filtragem', { 
      filtered: result.length,
      details: result.map(m => ({ 
        name: m.name, 
        archived: !!m.archived_at, 
        deleted: !!m.deleted_at 
      }))
    });
    
    return result;
  }, [processedModules, searchTerm, categoryFilter, showArchived, showDeleted]);

  // Categorias únicas para filtro
  const categories = useMemo(() => {
    const cats = new Set(baseModules.map(module => module.category));
    return Array.from(cats).sort();
  }, [baseModules]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const getHealthBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'warning';
    return 'destructive';
  };

  const getHealthBadgeText = (score: number) => {
    if (score >= 80) return 'Saudável';
    if (score >= 60) return 'Atenção';
    return 'Crítico';
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar módulos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary">
              <Eye className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Opções de Visualização</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={!showArchived && !showDeleted}
              onCheckedChange={() => {
                setShowArchived(false);
                setShowDeleted(false);
              }}
            >
              Em Operação
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={showArchived}
              onCheckedChange={setShowArchived}
            >
              Arquivados
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={showDeleted}
              onCheckedChange={setShowDeleted}
            >
              Deletados
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tabela com Divs (CSS Grid) */}
      <div className="rounded-lg">
        {/* Cabeçalho */}
        <div className="md:grid md:grid-cols-[4fr_2fr_1fr_1.25fr_1.25fr_0.5fr] items-center px-4 py-3 text-sm text-muted-foreground">
          <div className="">Módulo Base</div>
          <div className="">Implementações</div>
          <div className="">Atribuições</div>
          <div className="">Saúde</div>
          <div className="">Status</div>
          <div className=""></div>
        </div>

        {/* Corpo */}
        <div>
          {filteredModules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || categoryFilter !== 'all' || showArchived || showDeleted
              ? (
                showDeleted
                ? 'Nenhum módulo deletado encontrado com os filtros aplicados.'
                : showArchived
                  ? 'Nenhum módulo arquivado encontrado com os filtros aplicados.'
                  : 'Nenhum módulo encontrado com os filtros aplicados.'
              )
              : 'Nenhum módulo base encontrado.'
              }
            </div>
          ) : (
            filteredModules.map((module) => (
              <div key={module.id} className="md:grid md:grid-cols-[4fr_2fr_1fr_1.25fr_1.25fr_0.5fr] items-center px-4 py-3 rounded-lg hover:bg-[hsl(var(--secondary))] transition-colors">

                {/* Coluna Módulo Base */}
                <div className="">
                  <div className="flex items-center gap-2 mb-1">
                    <IconRenderer name={module.icon || 'Package'} strokeWidth={2.3} className="w-5 h-5 text-[hsl(var(--highlight-foreground))]" />
                    <Link href={`/admin/modules/${module.slug}`} ><span className="font-medium text-sm">{module.name}</span></Link>
                    <Badge variant="outline" className="text-xs">
                      {module.category}
                    </Badge>
                  </div>
                  <p className="text-xs tracking-wide text-muted-foreground">
                    {module.description || `Slug: ${module.slug}`}
                  </p>
                </div>

                {/* Coluna Implementações */}
                <div className="">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {module.implementationsCount} {module.implementationsCount === 1 ? 'implementação' : 'implementações'}
                    </span>
                    {module.activeImplementationsCount < module.implementationsCount && (
                      <Badge className="text-xs">
                        {module.activeImplementationsCount} ativas
                      </Badge>
                    )}
                  </div>
                  {module.implementationsCount > 0 && (
                    <div className="text-xs text-muted-foreground mt-1 truncate">
                      {module.implementations
                        .slice(0, 3)
                        .map(impl => impl.implementation_key)
                        .join(', ')}
                      {module.implementationsCount > 3 && '...'}
                    </div>
                  )}
                </div>

                {/* Coluna Atribuições */}
                <div className="">
                  <div className="flex items-center gap-2">

                    {module.assignmentsCount === 0 ?
                      <span className="text-sm">
                        Nenhuma
                      </span>
                      :
                      <span className="text-sm">
                        {module.organizationsCount} orgs
                      </span>
                    }
                  </div>
                </div>

                {/* Coluna Saúde */}
                <div className="">
                  <div className="flex items-center gap-2">
                    <Badge variant={getHealthBadgeVariant(module.healthScore)}>
                      {getHealthBadgeText(module.healthScore)} ({module.healthScore}%)
                    </Badge>
                  </div>
                </div>

                {/* Coluna Status */}
                <div className="">
                  <Badge
                    variant={getStatusBadge(module).variant}
                    icon={
                      Object.values(getStatusBadge(module).icon)[0]
                    }
                  >
                    {getStatusBadge(module).text}
                  </Badge>
                </div>

                {/* Coluna Ações */}
                <div className="flex justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()} onClick={() => {
                        router.push(`/admin/modules/${module.slug}`);
                      }}>
                        Ver Detalhes
                      </DropdownMenuItem>

                      {!module.deleted_at && (
                        <>
                          <EditBaseModuleDialog
                            module={module}
                            onSuccess={onModuleChange}
                            trigger={
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} >
                                Editar Módulo
                              </DropdownMenuItem>
                            }
                          />
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            Gerenciar Implementações
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            Ver Assignments
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />

                          {!module.archived_at && (
                            <>
                              <ToggleActiveStatusDialog
                                module={module}
                                onSuccess={onModuleChange}
                                onOptimisticUpdate={onOptimisticUpdate}
                                onServerSuccess={onServerSuccess}
                                onServerError={onServerError}
                                trigger={
                                  <DropdownMenuItem
                                    onSelect={(e) => e.preventDefault()}
                                    variant={module.is_active ? "warning" : "success"}
                                  >
                                    {module.is_active ? 'Desativar' : 'Ativar'}
                                  </DropdownMenuItem>
                                }
                              />
                              
                              <ArchiveBaseModuleDialog
                                module={module}
                                onSuccess={onModuleChange}
                                onOptimisticArchive={onOptimisticArchive}
                                onServerSuccess={onServerSuccess}
                                onServerError={onServerError}
                                trigger={
                                  <DropdownMenuItem
                                    onSelect={(e) => e.preventDefault()}
                                    variant="warning"
                                  >
                                    Arquivar
                                  </DropdownMenuItem>
                                }
                              />
                            </>
                          )}

                          {module.archived_at && (
                            <RestoreBaseModuleDialog
                              module={module}
                              onSuccess={onModuleChange}
                              onOptimisticRestore={onOptimisticRestore}
                              onServerSuccess={onServerSuccess}
                              onServerError={onServerError}
                              trigger={
                                <DropdownMenuItem
                                  onSelect={(e) => e.preventDefault()}
                                  variant="success"
                                  icon={RotateCcw}
                                >
                                  Restaurar
                                </DropdownMenuItem>
                              }
                            />
                          )}

                          <DeleteBaseModuleDialog
                            module={module}
                            onSuccess={onModuleChange}
                            onOptimisticDelete={onOptimisticDelete}
                            onServerSuccess={onServerSuccess}
                            onServerError={onServerError}
                            trigger={
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                                variant="danger"
                              >
                                Excluir Módulo
                              </DropdownMenuItem>
                            }
                          />
                        </>
                      )}

                      {module.deleted_at && (
                        <>
                          <RestoreBaseModuleDialog
                            module={module}
                            onSuccess={onModuleChange}
                            onOptimisticRestore={onOptimisticRestore}
                            onServerSuccess={onServerSuccess}
                            onServerError={onServerError}
                            trigger={
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                                variant="success"
                                icon={RotateCcw}
                              >
                                Restaurar
                              </DropdownMenuItem>
                            }
                          />
                          <PurgeBaseModuleDialog
                            module={module}
                            onSuccess={onModuleChange}
                            onOptimisticPurge={onOptimisticPurge}
                            onServerSuccess={onServerSuccess}
                            onServerError={onServerError}
                            trigger={
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                                variant="destructive"
                              >
                                Excluir Permanentemente
                              </DropdownMenuItem>
                            }
                          />
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Resumo */}
      {filteredModules.length > 0 && (
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span>
            Mostrando {filteredModules.length} de {baseModules.length} módulos base
          </span>
          <span>
            Total: {implementations.length} implementações, {assignments.filter(a => a.assignment_active).length} assignments ativos
          </span>
        </div>
      )}
    </div>
  );
}
