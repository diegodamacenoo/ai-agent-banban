import { useMemo } from 'react';
import type { Organization, User, OrganizationStats, UserStats } from '../types';

interface FilterOptions {
  searchQuery: string;
  filterType: 'all' | 'standard' | 'custom';
  filterStatus: 'all' | 'complete' | 'incomplete';
  filterRole: 'all' | 'admin' | 'manager' | 'user';
}

/**
 * Hook customizado para filtros e computed values
 * Centraliza toda a lógica de filtros e cálculos derivados
 */
export const useOrganizationsFilters = (
  organizations: Organization[],
  users: User[],
  filters: FilterOptions
) => {
  const { searchQuery, filterType, filterStatus, filterRole } = filters;

  /**
   * Organizações filtradas com base nos critérios de busca e filtros
   * Aplica filtros de texto, tipo e status de implementação
   */
  const filteredOrganizations = useMemo(() => {
    let filtered = [...organizations];

    // Filtro de busca textual - busca em razão social e nome fantasia
    if (searchQuery) {
      filtered = filtered.filter(org =>
        org.company_legal_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.company_trading_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtro por tipo de cliente (standard/custom)
    if (filterType !== 'all') {
      filtered = filtered.filter(org => org.client_type === filterType);
    }

    // Filtro por status de implementação
    if (filterStatus !== 'all') {
      filtered = filtered.filter(org =>
        filterStatus === 'complete' ? org.is_implementation_complete : !org.is_implementation_complete
      );
    }

    return filtered;
  }, [organizations, searchQuery, filterType, filterStatus]);

  /**
   * Usuários filtrados com base na busca textual
   * Busca em nome, email e organização
   */
  const filteredUsers = useMemo(() => {
    let filtered = [...users];

    // Filtro de busca - nome, email ou organização
    if (searchQuery) {
      filtered = filtered.filter(user =>
        user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.organization_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtro por role
    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.role === filterRole);
    }

    return filtered;
  }, [users, searchQuery, filterRole]);
  
  /**
   * Estatísticas das organizações para o dashboard
   * Calcula totais por tipo e status
   */
  const organizationStats: OrganizationStats = useMemo(() => ({
    total: organizations.length,
    active: organizations.filter(org => org.is_implementation_complete).length,
    custom: organizations.filter(org => org.client_type === 'custom').length,
    standard: organizations.filter(org => org.client_type === 'standard').length,
  }), [organizations]);

  /**
   * Estatísticas dos usuários para o dashboard
   * Calcula totais por role e status de atividade
   */
  const userStats: UserStats = useMemo(() => ({
    total: users.length,
    active: users.filter(user => user.is_active).length,
    admins: users.filter(user => user.role === 'admin').length,
    managers: users.filter(user => user.role === 'manager').length,
    regular: users.filter(user => user.role === 'user').length,
  }), [users]);

  return {
    filteredOrganizations,
    filteredUsers,
    organizationStats,
    userStats,
  };
};