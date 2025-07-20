/**
 * Tipos base do sistema
 */

export type ClientType = 'custom' | 'standard';

export interface Organization {
  id: string;
  company_legal_name: string;
  company_trading_name: string;
  slug?: string;
  client_type: ClientType;
  implementation_config: any;
  is_implementation_complete: boolean;
  implementation_date?: Date;
  implementation_team_notes?: string;
}

export interface TenantInfo {
  id: string;
  clientType: ClientType;
  name?: string;
  customBackendUrl?: string;
  isImplementationComplete?: boolean;
} 