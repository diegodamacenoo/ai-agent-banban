/**
 * Helpers para a Rota Universal (Client-side)
 * Fase 4 - Route Simplification
 */

import { ClientType } from '@/core/modules/types';

export interface Organization {
  id: string;
  slug: string;
  name: string;
  client_type: ClientType;
  company_trading_name: string;
  company_legal_name?: string;
  is_implementation_complete?: boolean;
}

/**
 * Resolve submodule path for client-side routing
 */
export function resolveSubModulePath(subPath?: string[]): string | null {
  if (!subPath || subPath.length === 0) {
    return null;
  }
  
  return subPath.join('/');
}