'use client';

// ============================================
// IMPORTS
// ============================================

// React core
import { useState } from 'react';

// UI Components
import { Layout } from '@/shared/components/Layout';
import { Tabs } from '@/shared/ui/tabs';
import { Button } from '@/shared/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';

// Local imports
import {
  useOrganizationsData,
  useOrganizationsFilters,
  useUsersData,
  } from './hooks';
import {
  OverviewTab,
  OrganizationsTab,
  UsersTab,
  ApprovalsTab,
  SettingsTab,
} from './components/tabs';
import { TAB_ITEMS } from './constants';

// Feature Components
import { CreateUserSheet } from '@/features/admin/create-user-sheet';
import { CreateOrganizationDrawer } from '@/features/admin/create-organization-sheet';

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * Página Principal de Gestão de Organizações
 * 
 * Esta página consolida toda a funcionalidade de gestão administrativa em abas organizadas:
 * 
 * @overview - Estatísticas gerais e visão geral do sistema com widgets informativos
 * @organizations - Lista completa de organizações com filtros e ações de gestão
 * @users - Gestão de usuários do sistema com visualização de perfis
 * @approvals - Central de aprovações e solicitações pendentes
 * @settings - Configurações globais e administrativas do sistema
 * 
 * Características técnicas:
 * - Estado otimístico para melhor UX
 * - Sistema de skeletons diferenciado por seção
 * - Carregamento inteligente com debounce
 * - Gestão de refs para controle de ciclo de vida
 * - Integração com server actions para operações de dados
 */
export default function OrganizationsPage() {
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  
  // Interface state - controla navegação e filtros
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'standard' | 'custom'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'complete' | 'incomplete'>('all');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'manager' | 'user'>('all');

  // ==========================================
  // CUSTOM HOOKS
  // ==========================================
  
  // Data management hooks
  const {
    organizations,
    users: mockUsers,
    loading: orgLoading,
    isInitialLoad: orgIsInitialLoad,
    error: orgError,
    loadOrganizations,
    handleRefresh: handleOrgRefresh,
    handleDeleteOrganization,
    deletingOrganization,
  } = useOrganizationsData();

  const {
    users,
    userStats: realUserStats,
    loading: usersLoading,
    isInitialLoad: usersIsInitialLoad,
    error: usersError,
    handleRefresh: handleUsersRefresh,
  } = useUsersData();

  // Filtering and computed values hook
  const {
    filteredOrganizations,
    filteredUsers,
    organizationStats,
    userStats: filteredUserStats,
  } = useOrganizationsFilters(organizations, users, {
    searchQuery,
    filterType,
    filterStatus,
    filterRole,
  });

  // Layout principal sem erros específicos - cada tab gerencia seus próprios erros
  const loading = false; // Não mais afeta o layout principal
  const isInitialLoad = false; // Não mais afeta o layout principal  
  const error = null; // Erros são tratados individualmente por cada tab

  // Função de refresh combinada
  const handleRefresh = async () => {
    await Promise.all([handleOrgRefresh(), handleUsersRefresh()]);
  };


  // ==========================================
  // TAB PROPS CONFIGURATION
  // ==========================================
  
  const commonProps = {
    loading,
    isInitialLoad,
  };

  const overviewProps = {
    ...commonProps,
    activeTab,
    organizationStats,
  };

  const organizationsProps = {
    activeTab,
    loading: orgLoading,
    isInitialLoad: orgIsInitialLoad,
    organizations: filteredOrganizations,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    filterStatus,
    setFilterStatus,
    onDelete: handleDeleteOrganization,
    onSuccess: loadOrganizations,
    deletingOrganization,
    error: orgError,
    onRetry: handleOrgRefresh,
  };

  const usersProps = {
    activeTab,
    loading: usersLoading,
    isInitialLoad: usersIsInitialLoad,
    users: filteredUsers,
    userStats: realUserStats,
    searchQuery,
    setSearchQuery,
    filterRole,
    setFilterRole,
    error: usersError,
    onRetry: handleUsersRefresh,
  };

  const approvalsProps = {
    ...commonProps,
    activeTab,
  };

  const settingsProps = {
    ...commonProps,
    activeTab,
  };

  // ==========================================
  // MAIN RENDER
  // ==========================================
  
  return (
    <Layout error={error} onRetry={handleRefresh} width='container'>
      {/* Cabeçalho da página com título e ações */}
      <Layout.Header>
        <Layout.Header.Title>
          Gestão de Organizações
          <Layout.Header.Description>
            Gerencie organizações, aprovações e configurações de forma centralizada.
          </Layout.Header.Description>
        </Layout.Header.Title>
        <Layout.Actions>
          {/* Botão de atualização com estado de loading */}
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
          {/* Componentes de criação */}
          <CreateUserSheet onSuccess={handleRefresh} />
          <CreateOrganizationDrawer onSuccess={handleRefresh} />
        </Layout.Actions>
      </Layout.Header>

      {/* Corpo principal da página */}
      <Layout.Body>
        <Layout.Content>
          <div className="w-full space-y-4">
            {/* Sistema de navegação por abas */}
            <Tabs
              items={TAB_ITEMS}
              value={activeTab}
              onValueChange={setActiveTab}
              variant="underline"
              className="w-full"
              defaultValue="overview"
            />

            {/* Renderização das abas */}
            <OverviewTab {...overviewProps} />
            <OrganizationsTab {...organizationsProps} />
            <UsersTab {...usersProps} />
            <ApprovalsTab {...approvalsProps} />
            <SettingsTab {...settingsProps} />
          </div>
        </Layout.Content>
      </Layout.Body>

    </Layout>
  );
}