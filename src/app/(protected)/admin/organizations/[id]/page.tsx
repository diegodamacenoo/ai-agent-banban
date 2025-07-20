'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, Users, Settings, Activity, FileText, Loader2, Building2, CheckCircle, XCircle, Check, Clock, ChevronDown } from 'lucide-react';

import { getOrganizationById, deleteOrganization, updateOrganization } from '@/app/actions/admin/organizations';
import { getOrganizationUserStats } from '@/app/actions/admin/organization-users';
import { OrganizationHeader } from './components/OrganizationHeader';
import { OrganizationStats } from './components/OrganizationStats';
import { OrganizationModulesCard } from './components/OrganizationModulesCard';
import { OrganizationRequestsSection } from './components/OrganizationRequestsSection';
import { OrganizationApprovalsWidget } from './components/OrganizationApprovalsWidget';
import { OrganizationModulesStatusWidget } from './components/OrganizationModulesStatusWidget';
import { OrganizationQuickActionsWidget } from './components/OrganizationQuickActionsWidget';
import { EditOrganizationSheet } from './components/EditOrganizationSheet';
import { UsersTab } from './components/UsersTab';
import { CreateUserSheet } from '@/features/admin/create-user-sheet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { useToast } from '@/shared/ui/toast';
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from '@/shared/ui/modal';
import { Layout } from '@/shared/components/Layout';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';

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
  slug?: string;
}

interface UserStats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  suspended_users: number;
  recent_activity_count: number;
  new_users_last_week: number;
  days_since_creation: number;
}

export default function OrganizationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const organizationId = params.id as string;

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingOrganization, setDeletingOrganization] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [updatingImplementationStatus, setUpdatingImplementationStatus] = useState(false);

  // Calcular dias desde a criação
  const daysFromCreation = organization
    ? Math.floor((Date.now() - new Date(organization.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Carregar dados da organização
  const loadOrganization = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getOrganizationById(organizationId);

      if (result.error) {
        setError(result.error);
        toast.error(result.error, {
          title: 'Erro ao carregar organização',
        });
        return;
      }

      if (result.data) {
        setOrganization(result.data);
      }
    } catch (err) {
      console.error('Erro ao carregar organização:', err);
      setError('Erro inesperado ao carregar organização');
      toast.error('Não foi possível carregar os dados da organização', {
        title: 'Erro inesperado',
      });
    } finally {
      setLoading(false);
    }
  };

  // Carregar estatísticas de usuários
  const loadUserStats = async () => {
    try {
      setStatsLoading(true);

      const result = await getOrganizationUserStats(organizationId);

      if (result.error) {
        console.warn('Erro ao carregar estatísticas:', result.error);
        return;
      }

      if (result.data) {
        setUserStats(result.data);
      }
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) {
      loadOrganization();
      loadUserStats();
    }
  }, [organizationId]);

  const handleDeleteOrganization = async () => {
    try {
      setDeletingOrganization(true);
      const result = await deleteOrganization(organizationId);

      if (result.error) {
        toast.error(result.error, {
          title: 'Erro ao excluir organização',
        });
        return;
      }

      toast.success('A organização foi excluída com sucesso.', {
        title: 'Organização excluída',
      });

      router.push('/admin/organizations');
    } catch (err) {
      console.error('Erro ao excluir organização:', err);
      toast.error('Ocorreu um erro ao tentar excluir a organização.', {
        title: 'Erro inesperado',
      });
    } finally {
      setDeletingOrganization(false);
      setShowDeleteDialog(false);
    }
  };

  const handleOpenDeleteDialog = () => {
    setShowDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    if (!deletingOrganization) {
      setShowDeleteDialog(false);
    }
  };

  const handleRefresh = () => {
    loadOrganization();
    loadUserStats();
  };

  // Função para alternar status de implementação
  const handleToggleImplementationStatus = async () => {
    if (!organization) return;

    setUpdatingImplementationStatus(true);

    try {
      const newStatus = !organization.is_implementation_complete;
      const result = await updateOrganization({
        id: organizationId,
        is_implementation_complete: newStatus,
      });

      if (result.error) {
        toast.error(result.error, {
          title: 'Erro ao atualizar status',
        });
        return;
      }

      toast.success(`Implementação marcada como ${newStatus ? 'concluída' : 'pendente'}.`, {
        title: 'Status atualizado',
      });

      loadOrganization();
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      toast.error('Ocorreu um erro ao tentar atualizar o status.', {
        title: 'Erro inesperado',
      });
    } finally {
      setUpdatingImplementationStatus(false);
    }
  };

  // Componente do dropdown de status de implementação
  const ImplementationStatusDropdown = () => {
    if (!organization) return null;

    const statusInfo = organization.is_implementation_complete ? {
      icon: <CheckCircle className="h-4 w-4" />,
      label: 'Implementação Concluída',
      description: 'Configuração finalizada',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      borderColor: 'border-green-300',
    } : {
      icon: <Clock className="h-4 w-4" />,
      label: 'Implementação Pendente',
      description: 'Configuração ainda em andamento',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      borderColor: 'border-yellow-200',
    };

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={`gap-2 ${statusInfo.bgColor} ${statusInfo.textColor} ${statusInfo.borderColor}`}
            disabled={updatingImplementationStatus}
          >
            {updatingImplementationStatus ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              statusInfo.icon
            )}
            {statusInfo.label}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Status de Implementação</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleToggleImplementationStatus}
            disabled={updatingImplementationStatus}
          >
            {organization.is_implementation_complete
              ? 'Marcar como Pendente'
              : 'Marcar como Concluída'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  // Renderizar o conteúdo da sidebar
  const sidebarContent = (
    <>
      <div className="space-y-4">
        {/* Informações da Organização */}
        {organization && (
          <Card variant="default" size="sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Informações da Organização</CardTitle>
                <EditOrganizationSheet
                  organization={organization}
                  onSuccess={loadOrganization}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Razão Social</p>
                    <p className="text-base">{organization.company_legal_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Nome Fantasia</p>
                    <p className="text-base">{organization.company_trading_name}</p>
                  </div>
                  <div className="grid grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Status</p>
                      <div className="flex items-center gap-2">
                        {organization.is_implementation_complete ? (
                          <>
                            <Badge variant="success" className="w-fit">
                              <Check className="h-3 w-3" />
                              <span>Ativa</span>
                            </Badge>
                          </>
                        ) : (
                          <>
                            <Badge variant="outline" className="text-orange-800 w-fit">
                              <XCircle className="h-3 w-3" />
                              <span className="text-orange-600">Pendente</span>
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Tipo de Cliente</p>
                      <Badge variant={organization.client_type === 'custom' ? 'default' : 'secondary'} className="w-fit">
                        {organization.client_type === 'custom' ? 'Custom' : 'Padrão'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Slug</p>
                    <p className="text-base font-mono">{organization.slug || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analytics - Mais discretas */}
        <div className="space-y-3">
          <OrganizationStats
            stats={{
              total_users: userStats?.total_users || 0,
              active_users: userStats?.active_users || 0,
              inactive_users: userStats?.inactive_users || 0,
              recent_activity_count: userStats?.recent_activity_count || 0,
              days_since_creation: daysFromCreation
            }}
            loading={statsLoading}
          />
        </div>

        {/* Organization-specific widgets */}
        <div className="space-y-4 mt-6">
          <OrganizationApprovalsWidget organizationId={organizationId} />
          <OrganizationModulesStatusWidget organizationId={organizationId} />
          <OrganizationQuickActionsWidget organizationId={organizationId} />
        </div>
      </div>
    </>
  );

  return (
    <Layout loading={loading} error={error} onRetry={loadOrganization}>
      <Layout.Header>
        <Layout.Breadcrumbs items={[
          { title: 'Organizações', href: '/admin/organizations' },
          { title: organization?.company_trading_name || 'Carregando...' }
        ]} />
        <Layout.Actions>
          <ImplementationStatusDropdown />
          <Button
            variant="outline"
            onClick={() => router.push('/admin/organizations')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <Button
            variant="destructive"
            onClick={handleOpenDeleteDialog}
          >
            Excluir
          </Button>
        </Layout.Actions>
      </Layout.Header>
      <Layout.Body>
        <Layout.Sidebar width="w-1/4">
          {sidebarContent}
        </Layout.Sidebar>
        <Layout.Content>
          {/* Conteúdo Principal */}
          <div className="flex-1 flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Gestão da Organização
                </h3>
              </div>
            </div>

            {/* Seção de Usuários */}
            <Card variant="default" size="sm">
              <CardHeader>
                <CardTitle className="flex gap-2 justify-between">
                  Usuários
                  <div className="flex items-center justify-between">
                    {userStats && (
                      <CreateUserSheet onSuccess={loadUserStats} organizationId={organizationId} />
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userStats ? (
                  <UsersTab
                    organizationId={organizationId}
                    stats={{
                      total_users: userStats.total_users,
                      active_users: userStats.active_users,
                      inactive_users: userStats.inactive_users,
                      suspended_users: userStats.suspended_users
                    }}
                  />
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-5 w-5" />
                    <span>Carregando dados de usuários...</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Seção de Configuração de Módulos */}
            {organization && (
              <div data-section="modules">
                {/* OrganizationModulesCard foi removido daqui */}
              </div>
            )}

            {/* Seção de Solicitações de Módulos */}
            {organization && (
              <OrganizationRequestsSection
                organizationId={organization.id}
                className="mb-6"
              />
            )}

            {/* Seção de Atividades */}
            <Card variant="default" size="sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Log de Atividades
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-4 text-center py-8">
                  <Activity className="h-12 w-12 text-gray-400" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Log de Atividades</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Histórico de atividades será implementado na próxima fase
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Seção de Relatórios */}
            <Card variant="default" size="sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Relatórios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-4 text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Relatórios</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Relatórios específicos da organização serão implementados na próxima fase
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Modal de Confirmação de Exclusão */}
          <Modal
            open={showDeleteDialog}
            onOpenChange={handleCloseDeleteDialog}
          >
            <ModalContent>
              <ModalHeader>
                <ModalTitle>Excluir Organização</ModalTitle>
                <ModalDescription>
                  Tem certeza que deseja excluir a organização "{organization?.company_trading_name}"?
                  Esta ação não pode ser desfeita.
                </ModalDescription>
              </ModalHeader>
              <ModalFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={handleCloseDeleteDialog}
                  disabled={deletingOrganization}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteOrganization}
                  disabled={deletingOrganization}
                >
                  {deletingOrganization ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    'Sim, excluir'
                  )}
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </Layout.Content>
      </Layout.Body>
    </Layout>
  );
}
