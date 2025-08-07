// ============================================
// TYPES & INTERFACES
// ============================================

/**
 * Representação de uma organização no sistema
 * Contém informações básicas da empresa e configurações de implementação
 */
export interface Organization {
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
 * Representação de um usuário no sistema
 * Inclui informações pessoais e de autorização
 */
export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'manager' | 'user';
  organization_id: string;
  organization_name: string;
  is_active: boolean;
  last_login: string;
  created_at: string;
  profile_picture?: string;
  phone?: string;
}

/**
 * Props para componentes de filtro
 */
export interface FilterProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

/**
 * Props para componentes de organizações
 */
export interface OrganizationFilterProps extends FilterProps {
  filterType: 'all' | 'standard' | 'custom';
  setFilterType: (type: 'all' | 'standard' | 'custom') => void;
  filterStatus: 'all' | 'complete' | 'incomplete';
  setFilterStatus: (status: 'all' | 'complete' | 'incomplete') => void;
}

/**
 * Props para componentes de usuários
 */
export interface UserFilterProps extends FilterProps {
  filterRole: 'all' | 'admin' | 'manager' | 'user';
  setFilterRole: (role: 'all' | 'admin' | 'manager' | 'user') => void;
}

/**
 * Estatísticas de organizações
 */
export interface OrganizationStats {
  total: number;
  active: number;
  custom: number;
  standard: number;
}

/**
 * Estatísticas de usuários
 */
export interface UserStats {
  total: number;
  active: number;
  admins: number;
  managers: number;
  regular: number;
}