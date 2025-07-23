'use client';

// React imports
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Skeleton } from '@/shared/ui/skeleton';
import { Tabs, TabsContent } from '@/shared/ui/tabs';
import { Layout, AnalyticsCard, AnalyticsGrid } from '@/shared/components/Layout';
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/alert-dialog";

// Icons
import {
  Building2,
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  Filter,
  Users,
  Loader2,
  Brush,
  BadgeCheck,
  Check,
  RefreshCw,
  FileText,
  Settings,
  BarChart3
} from 'lucide-react';

// External libraries
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Hooks
import { useToast } from '@/shared/ui/toast';

// Actions
import { getAllOrganizations, deleteOrganization } from '@/app/actions/admin/organizations';

// Components
import { CreateOrganizationDrawer } from '@/features/admin/create-organization-sheet';
import { CreateUserSheet } from '@/features/admin/create-user-sheet';
import { EditOrganizationSheet } from './[id]/components/EditOrganizationSheet';
import { ApprovalsCard } from './components/ApprovalsCard';
import { ApprovalsStatsWidget } from './components/ApprovalsStatsWidget';
import { UrgentAlertsWidget } from './components/UrgentAlertsWidget';
import { QuickActionsWidget } from './components/QuickActionsWidget';

// Constants
const TAB_ITEMS = [
  { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'organizations', label: 'Organizações', icon: <Building2 className="w-4 h-4" /> },
  { id: 'approvals', label: 'Aprovações', icon: <CheckCircle className="w-4 h-4" /> },
  { id: 'settings', label: 'Configurações', icon: <Settings className="w-4 h-4" /> },
];

const DEBOUNCE_DELAY = 300;

// Types
interface Organization {
  id: string;
  company_legal_name: string;
  company_trading_name: string;
  client_type: 'standard' | 'custom';
  custom_backend_url?: string;
  is_implementation_complete: boolean;
  implementation_date?: string;
  implementation_config?: {
    subscribed_modules?: string[];
    custom_modules?: string[];
    enabled_standard_modules?: string[];
    features?: string[];
  };
  created_at: string;
  updated_at: string;
  pending_requests_count?: number;
}

/**
 * Página Principal de Gestão de Organizações
 * 
 * Consolida toda a funcionalidade de gestão em abas organizadas:
 * - Overview: Estatísticas e visão geral do sistema
 * - Organizações: Lista e gestão de organizações
 * - Aprovações: Solicitações pendentes e aprovações
 * - Configurações: Configurações globais do sistema
 * 
 * Estrutura organizada seguindo padrões da página de módulos com
 * estado otimístico e sistema de skeletons diferenciado.
 */
export default function OrganizationsPage() {
  // ===========================================
  // STATE MANAGEMENT
  // ===========================================
  
  // UI State
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'standard' | 'custom'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'complete' | 'incomplete'>('all');
  
  // Loading States
  const [loading, setLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingOrganization, setDeletingOrganization] = useState<string | null>(null);
  
  // Data State
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // ===========================================
  // REFS FOR LIFECYCLE MANAGEMENT
  // ===========================================
  
  const loadingRef = useRef(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(false);
  const loadCalledRef = useRef(false);
  const loadCompletedRef = useRef(false);
  
  // ===========================================
  // COMPUTED VALUES
  // ===========================================
  
  // Filtered organizations
  const filteredOrganizations = useMemo(() => {
    let filtered = [...organizations];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(org =>
        org.company_legal_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.company_trading_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(org => org.client_type === filterType);
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(org =>
        filterStatus === 'complete' ? org.is_implementation_complete : !org.is_implementation_complete
      );
    }

    return filtered;
  }, [organizations, searchQuery, filterType, filterStatus]);
  
  // Statistics
  const stats = useMemo(() => ({
    total: organizations.length,
    active: organizations.filter(org => org.is_implementation_complete).length,
    custom: organizations.filter(org => org.client_type === 'custom').length,
    standard: organizations.filter(org => org.client_type === 'standard').length,
  }), [organizations]);
  
  // Combined loading state
  const combinedLoading = loading;
  
  // ===========================================
  // HOOKS
  // ===========================================
  
  const { toast } = useToast();
  
  // ===========================================
  // DATA LOADING LOGIC
  // ===========================================
  
  const loadOrganizations = useCallback(async () => {
    if (loadingRef.current) {
      console.debug('🚫 CLIENT: Carregamento já em progresso, ignorando...');
      return;
    }

    if (loadCompletedRef.current) {
      console.debug('🚫 CLIENT: Dados já carregados, ignorando...');
      return;
    }

    if (!mountedRef.current && mountedRef.current !== false) {
      console.debug('🚫 CLIENT: Component not mounted, skipping loadData');
      return;
    }

    const callId = `LOAD_${Date.now()}`;
    console.debug(`🚀 CLIENT: Starting loadOrganizations ${callId}`);

    loadingRef.current = true;
    setLoading(true);
    
    try {
      setError(null);
      const result = await getAllOrganizations();

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.data) {
        setOrganizations(result.data);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Erro ao carregar organizações:', err);
      setError('Erro inesperado ao carregar organizações');
      setOrganizations([]);
    } finally {
      loadingRef.current = false;
      setLoading(false);
      setIsInitialLoad(false);
      loadCompletedRef.current = true;
      console.debug(`✅ CLIENT: Completed loadOrganizations ${callId}`);
    }
  }, []);
  
  // Load organizations on mount
  useEffect(() => {
    if (loadCalledRef.current) {
      console.debug('🚫 CLIENT: loadOrganizations já foi chamado, pulando...');
      return;
    }

    loadCalledRef.current = true;
    mountedRef.current = true;

    loadOrganizations();

    return () => {
      mountedRef.current = false;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [loadOrganizations]);
  
  // ===========================================
  // UTILITY FUNCTIONS
  // ===========================================
  
  const getModulesCount = useCallback((organization: Organization) => {
    const config = organization.implementation_config;
    if (!config) return { assigned: 0, total: 6 };

    const subscribedModules = config.subscribed_modules || [];
    const customModules = config.custom_modules || [];
    const enabledStandardModules = config.enabled_standard_modules || [];

    const allModules = new Set([
      ...subscribedModules,
      ...customModules,
      ...enabledStandardModules
    ]);

    return {
      assigned: allModules.size,
      total: 6
    };
  }, []);
  
  const getStatusBadge = useCallback((organization: Organization) => {
    if (organization.is_implementation_complete) {
      return (
        <Badge variant="success" className="w-fit" icon={Check}>
          Completa
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="w-fit" icon={Clock}>
        Pendente
      </Badge>
    );
  }, []);

  const getTypeBadge = useCallback((type: string) => {
    if (type === 'custom') {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100 w-fit">Custom</Badge>;
    }
    return <Badge variant="outline" className="w-fit">Standard</Badge>;
  }, []);

  const getPendingRequestsBadge = useCallback((organization: Organization) => {
    const count = organization.pending_requests_count || 0;
    if (count === 0) return null;

    return (
      <Badge variant="warning" className="w-fit">
        {count} pendente{count > 1 ? 's' : ''}
      </Badge>
    );
  }, []);
  
  // ===========================================
  // ORGANIZATION HANDLERS
  // ===========================================
  
  const handleDeleteOrganization = useCallback(async (organizationId: string) => {
    try {
      setDeletingOrganization(organizationId);
      const result = await deleteOrganization(organizationId);

      if (result.error) {
        toast.error("Erro ao excluir organização", {
          description: result.error,
        });
        return;
      }

      toast.success("A organização foi excluída com sucesso.", {
        title: "Organização excluída",
      });

      loadOrganizations();
    } catch (err) {
      console.error('Erro ao excluir organização:', err);
      toast.error("Ocorreu um erro ao tentar excluir a organização.", {
        title: "Erro inesperado",
      });
    } finally {
      setDeletingOrganization(null);
    }
  }, [toast, loadOrganizations]);
  
  // ===========================================
  // GENERAL HANDLERS
  // ===========================================
  
  const handleRefresh = useCallback(async () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Reset flags para permitir novo carregamento
    loadCompletedRef.current = false;
    loadCalledRef.current = false;
    // Não resetar isInitialLoad durante refresh - mantém false

    debounceRef.current = setTimeout(() => {
      loadOrganizations();
    }, DEBOUNCE_DELAY);
  }, [loadOrganizations]);
  
  // ===========================================
  // RENDER
  // ===========================================
  
  return (
    <Layout
      error={error}
      onRetry={loadOrganizations}
      width='container'
    >
      <Layout.Header>
        <Layout.Header.Title>
          Gestão de Organizações
          <Layout.Header.Description>
            Gerencie organizações, aprovações e configurações de forma centralizada.
          </Layout.Header.Description>
        </Layout.Header.Title>
        <Layout.Actions>
          <Button 
            variant="outline" 
            leftIcon={
              !isInitialLoad && loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )
            }
            onClick={handleRefresh} 
            disabled={!isInitialLoad && loading}
          >
            {!isInitialLoad && loading ? 'Atualizando' : 'Atualizar'}
          </Button>
          <CreateUserSheet onSuccess={loadOrganizations} />
          <CreateOrganizationDrawer onSuccess={loadOrganizations} />
        </Layout.Actions>
      </Layout.Header>

      <Layout.Body>
        <Layout.Content>
          <div className="w-full space-y-4">
            <Tabs
              items={TAB_ITEMS}
              value={activeTab}
              onValueChange={setActiveTab}
              variant="underline"
              className="w-full"
              defaultValue="overview"
            />

            {renderOverviewTab()}
            {renderOrganizationsTab()}
            {renderApprovalsTab()}
            {renderSettingsTab()}
          </div>
        </Layout.Content>
      </Layout.Body>
    </Layout>
  );
  
  // ===========================================
  // SKELETON COMPONENTS
  // ===========================================
  
  function OverviewSkeleton() {
    return (
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} size="sm">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} size="sm">
              <CardHeader>
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="flex items-center justify-between">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  function OrganizationsSkeleton() {
    return (
      <Card size="sm">
        <CardHeader>
          <div className="space-y-4">
            <Skeleton className="h-6 w-48" />
            
            {/* Search and filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Skeleton className="h-10 flex-1" />
              <div className="flex gap-2">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Table header */}
            <div className="flex items-center gap-4 pb-2 border-b">
              {['Organização', 'Tipo', 'Pendências', 'Módulos', 'Status', 'Ações'].map((_, i) => (
                <Skeleton key={i} className="h-4 w-20" />
              ))}
            </div>
            
            {/* Table rows */}
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3">
                <div className="flex-1">
                  <Skeleton className="h-4 w-40 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  function ApprovalsSkeleton() {
    return (
      <div className="space-y-4">
        <Card size="sm">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  function SettingsSkeleton() {
    return (
      <div className="space-y-4">
        <Card size="sm">
          <CardHeader>
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-4 w-80" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ===========================================
  // TAB RENDERERS
  // ===========================================
  
  function renderOverviewTab() {
    return (
      <TabsContent value="overview" activeValue={activeTab}>
        {isInitialLoad && loading ? (
          <OverviewSkeleton />
        ) : (
          <div className="space-y-6">
            {/* Statistics */}
            <AnalyticsGrid>
              <AnalyticsCard
                title="Total de Organizações"
                description="organizações cadastradas"
                value={stats.total}
                icon={<Building2 className="h-4 w-4 text-zinc-600" />}
                iconBgColor="bg-zinc-100"
              />
              <AnalyticsCard
                title="Implementadas"
                description="implementação completa"
                value={stats.active}
                icon={<Check className="h-5 w-5 text-emerald-600" />}
                iconBgColor="bg-emerald-100"
                textColor="text-emerald-600"
              />
              <AnalyticsCard
                title="Custom"
                description="implementações customizadas"
                value={stats.custom}
                icon={<Brush className="h-5 w-5 text-blue-600" />}
                iconBgColor="bg-blue-50"
                textColor="text-blue-600"
              />
              <AnalyticsCard
                title="Standard"
                description="implementações padrão"
                value={stats.standard}
                icon={<BadgeCheck className="h-5 w-5 text-zinc-600" />}
                iconBgColor="bg-zinc-50"
                textColor="text-zinc-600"
              />
            </AnalyticsGrid>

            {/* Widgets */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <ApprovalsStatsWidget />
              <UrgentAlertsWidget />
              <QuickActionsWidget />
            </div>
          </div>
        )}
      </TabsContent>
    );
  }
  
  function renderOrganizationsTab() {
    if (isInitialLoad && loading) {
      return (
        <TabsContent value="organizations" activeValue={activeTab}>
          <OrganizationsSkeleton />
        </TabsContent>
      );
    }
    
    return (
      <TabsContent value="organizations" activeValue={activeTab}>
        <Card size="sm">
          <CardHeader>
            <CardTitle>Lista de Organizações</CardTitle>
            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por razão social ou nome fantasia..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="h-4 w-4 text-muted-foreground" />}
                />
              </div>
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <Filter className="h-4 w-4" />
                      Tipo: {filterType === 'all' ? 'Todos' : filterType === 'custom' ? 'Custom' : 'Standard'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Filtrar por Tipo</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setFilterType('all')}>
                      Todos
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterType('custom')}>
                      Custom
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterType('standard')}>
                      Standard
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" leftIcon={<Filter className="h-4 w-4" />}>
                      Status: {filterStatus === 'all' ? 'Todos' : filterStatus === 'complete' ? 'Completas' : 'Pendentes'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Filtrar por Status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setFilterStatus('all')}>
                      Todos
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterStatus('complete')}>
                      Completas
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterStatus('incomplete')}>
                      Pendentes
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Organizations Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organização</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Pendências</TableHead>
                    <TableHead>Módulos</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrganizations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        <div className="flex flex-col items-center gap-2 text-zinc-500">
                          <Building2 className="h-8 w-8" />
                          <span>Nenhuma organização encontrada</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrganizations.map((organization) => {
                      const { assigned, total } = getModulesCount(organization);
                      return (
                        <TableRow key={organization.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {organization.company_trading_name}
                              </span>
                              <span className="text-sm text-gray-500">
                                {organization.company_legal_name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getTypeBadge(organization.client_type)}
                          </TableCell>
                          <TableCell>
                            {getPendingRequestsBadge(organization) || (
                              <span className="text-sm text-zinc-500">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="w-fit">
                              {assigned}/{total} módulos
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(organization)}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Ações</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/admin/organizations/${organization.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Ver Detalhes
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="p-0 cursor-pointer">
                                  <EditOrganizationSheet
                                    organization={organization}
                                    onSuccess={loadOrganizations}
                                    trigger={
                                      <div className="flex items-center px-2 py-1.5 text-sm w-full">
                                        <Edit className="mr-2 h-4 w-4" />
                                        Editar
                                      </div>
                                    }
                                  />
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      className="w-full justify-start px-2 py-1.5 text-sm font-normal text-red-600 hover:text-red-700 hover:bg-red-50"
                                      disabled={deletingOrganization === organization.id}
                                    >
                                      {deletingOrganization === organization.id ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      ) : (
                                        <Trash2 className="mr-2 h-4 w-4" />
                                      )}
                                      Excluir
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Essa ação não pode ser desfeita. Isso excluirá permanentemente a
                                        organização e todos os seus dados associados.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteOrganization(organization.id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Confirmar Exclusão
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    );
  }
  
  function renderApprovalsTab() {
    if (isInitialLoad && loading) {
      return (
        <TabsContent value="approvals" activeValue={activeTab}>
          <ApprovalsSkeleton />
        </TabsContent>
      );
    }
    
    return (
      <TabsContent value="approvals" activeValue={activeTab}>
        <div className="space-y-4">
          <ApprovalsCard />
          
          <Card size="sm">
            <CardHeader>
              <CardTitle>Aprovações Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-zinc-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-2" />
                <p>Nenhuma aprovação pendente no momento</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    );
  }
  
  function renderSettingsTab() {
    if (isInitialLoad && loading) {
      return (
        <TabsContent value="settings" activeValue={activeTab}>
          <SettingsSkeleton />
        </TabsContent>
      );
    }
    
    return (
      <TabsContent value="settings" activeValue={activeTab}>
        <Card size="sm">
          <CardHeader>
            <CardTitle>Configurações do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-zinc-500">
              <Settings className="h-12 w-12 mx-auto mb-2" />
              <p>Configurações em desenvolvimento</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    );
  }
}