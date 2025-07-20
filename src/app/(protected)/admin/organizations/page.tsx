'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { getAllOrganizations, deleteOrganization } from '@/app/actions/admin/organizations';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
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
import {
  Building2,
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  Users,
  Loader2,
  Brush,
  BadgeCheck,
  Check,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CreateOrganizationDrawer } from '@/features/admin/create-organization-sheet';
import { CreateUserSheet } from '@/features/admin/create-user-sheet';
import { useToast } from '@/shared/ui/toast';
import { Layout, AnalyticsCard, AnalyticsGrid } from '@/shared/components/Layout';
import { EditOrganizationSheet } from './[id]/components/EditOrganizationSheet';
import { ApprovalsCard } from './components/ApprovalsCard';
import { ApprovalsStatsWidget } from './components/ApprovalsStatsWidget';
import { UrgentAlertsWidget } from './components/UrgentAlertsWidget';
import { QuickActionsWidget } from './components/QuickActionsWidget';

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
  // New field for pending requests count
  pending_requests_count?: number;
}

export default function OrganizationsPage() {
  const { toast } = useToast();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'standard' | 'custom'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'complete' | 'incomplete'>('all');
  const [deletingOrganization, setDeletingOrganization] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Funcao para carregar organizacoes
  const loadOrganizations = useCallback(async () => {
    try {
      setLoading(true);
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
      console.error('Erro ao carregar organizacoes:', err);
      setError('Erro inesperado ao carregar organizacoes');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      const result = await getAllOrganizations();

      if (result.error) {
        toast.error(result.error, {
          title: "Erro ao atualizar",
        });
        return;
      }

      if (result.data) {
        setOrganizations(result.data);
        setLastUpdated(new Date());
        toast.success("A lista foi atualizada com sucesso.", {
          title: "Dados atualizados",
        });
      }
    } catch (err) {
      console.error('Erro ao atualizar organizacoes:', err);
      toast.error("Ocorreu um erro ao atualizar os dados.", {
        title: "Erro inesperado",
      });
    } finally {
      setRefreshing(false);
    }
  }, [toast]);

  // Carregar organizacoes apenas uma vez ao montar o componente
  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  // Calcular organizacoes filtradas
  const filteredOrganizations = useMemo(() => {
    let filtered = [...organizations];

    // Filtro de busca
    if (searchQuery) {
      filtered = filtered.filter(org =>
        org.company_legal_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.company_trading_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtro por tipo
    if (filterType !== 'all') {
      filtered = filtered.filter(org => org.client_type === filterType);
    }

    // Filtro por status de implementacao
    if (filterStatus !== 'all') {
      filtered = filtered.filter(org =>
        filterStatus === 'complete' ? org.is_implementation_complete : !org.is_implementation_complete
      );
    }

    return filtered;
  }, [organizations, searchQuery, filterType, filterStatus]);

  // Calcular estatisticas
  const stats = useMemo(() => ({
    total: organizations.length,
    active: organizations.filter(org => org.is_implementation_complete).length,
    custom: organizations.filter(org => org.client_type === 'custom').length,
    standard: organizations.filter(org => org.client_type === 'standard').length,
  }), [organizations]);

  const getStatusBadge = (organization: Organization) => {
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
  };

  const getTypeBadge = (type: string) => {
    if (type === 'custom') {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100 w-fit">Custom</Badge>;
    }
    return <Badge variant="outline" className="w-fit">Standard</Badge>;
  };

  // Funcao para calcular modulos atribuidos
  const getModulesCount = (organization: Organization) => {
    const config = organization.implementation_config;
    if (!config) return { assigned: 0, total: 6 };

    const subscribedModules = config.subscribed_modules || [];
    const customModules = config.custom_modules || [];
    const enabledStandardModules = config.enabled_standard_modules || [];

    // Contar modulos unicos atribuidos
    const allModules = new Set([
      ...subscribedModules,
      ...customModules,
      ...enabledStandardModules
    ]);

    return {
      assigned: allModules.size,
      total: 6 // Total de modulos disponiveis
    };
  };

  // Funcao para renderizar badge de modulos
  const getModulesBadge = (organization: Organization) => {
    const { assigned, total } = getModulesCount(organization);

    if (assigned === 0) {
      return (
        <Badge variant="outline" className="text-gray-500 w-fit">
          0/{total}
        </Badge>
      );
    }

    if (assigned === total) {
      return (
        <Badge variant="success" className="w-fit">
          {assigned}/{total}
        </Badge>
      );
    }

    return (
      <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100 w-fit">
        {assigned}/{total}
      </Badge>
    );
  };

  const handleDeleteOrganization = async (organizationId: string) => {
    try {
      setDeletingOrganization(organizationId);
      const result = await deleteOrganization(organizationId);

      if (result.error) {
        toast.error("Erro ao excluir organizacao", {
          description: result.error,
        });
        return;
      }

      toast.success("A organizacao foi excluida com sucesso.", {
        title: "Organizacao excluida",
      });

      // Recarregar a lista de organizacoes
      loadOrganizations();
    } catch (err) {
      console.error('Erro ao excluir organizacao:', err);
      toast.error("Ocorreu um erro ao tentar excluir a organizacao.", {
        title: "Erro inesperado",
      });
    } finally {
      setDeletingOrganization(null);
    }
  };

  // Configuracao do layout
  const breadcrumbs = [
    { title: 'Organizações', href: '/admin/organizations' }
  ];

  // Function to get pending requests badge
  const getPendingRequestsBadge = (organization: Organization) => {
    const count = organization.pending_requests_count || 0;
    if (count === 0) return null;

    return (
      <Badge variant="warning" className="w-fit">
        {count} pendente{count > 1 ? 's' : ''}
      </Badge>
    );
  };

  // Sidebar com analytics
  const sidebarContent = (
    <div className="flex flex-col gap-4">
      <h3 className="font-medium text-lg">Estatísticas</h3>

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
          description="implementacao completa"
          value={stats.active}
          icon={<Check className="h-5 w-5 text-emerald-600" />}
          iconBgColor="bg-emerald-100"
          textColor="text-emerald-600"
        />
        <AnalyticsCard
          title="Custom"
          description="implementacoes customizadas"
          value={stats.custom}
          icon={<Brush className="h-5 w-5 text-blue-600" />}
          iconBgColor="bg-blue-50"
          textColor="text-blue-600"
        />
        <AnalyticsCard
          title="Standard"
          description="implementacoes padrao"
          value={stats.standard}
          icon={<BadgeCheck className="h-5 w-5 text-zinc-600" />}
          iconBgColor="bg-zinc-50"
          textColor="text-zinc-600"
        />
      </AnalyticsGrid>

      {/* New Approval Widgets */}
      <div className="space-y-4 mt-6">
        <ApprovalsStatsWidget />
        <UrgentAlertsWidget />
        <QuickActionsWidget />
      </div>
    </div>
  );

  return (
    <Layout
      loading={loading}
      error={error}
      onRetry={loadOrganizations}
    >
      <Layout.Header>
        <Layout.Breadcrumbs items={breadcrumbs} />
        <Layout.Actions>
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing} leftIcon={<RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />}>
            Atualizar
          </Button>
          <CreateUserSheet onSuccess={loadOrganizations} />
          <CreateOrganizationDrawer onSuccess={loadOrganizations} />
        </Layout.Actions>
      </Layout.Header>
      <Layout.Body>
        <Layout.Sidebar width="w-96">
          {sidebarContent}
        </Layout.Sidebar>
        <Layout.Content>
          {/* New Approvals Card */}
          <ApprovalsCard />

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
        </Layout.Content>
      </Layout.Body>
    </Layout>
  );
} 
