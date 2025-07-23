'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createSupabaseBrowserClient } from '@/core/supabase/client';
import { getUserWithProfile, getUserOrganizationSafe } from '@/core/supabase/auth-helpers-v2';

export interface Organization {
  id: string;
  company_legal_name: string;
  company_trading_name: string;
  slug?: string;
  client_type: 'custom' | 'standard';
  custom_backend_url?: string;
  implementation_config: any;
  is_implementation_complete: boolean;
  implementation_date?: string;
  implementation_team_notes?: string;
}

interface OrganizationContextType {
  organization: Organization | null;
  isLoading: boolean;
  error: string | null;
  refreshOrganization: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | null>(null);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrganization = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Use the new robust helper
      const { user, profile, error: authError } = await getUserWithProfile();
      
      if (authError) {
        console.warn('[OrganizationContext] Auth error:', authError);
        setOrganization(null);
        setIsLoading(false);
        return;
      }
      
      if (!user) {
        setOrganization(null);
        setIsLoading(false);
        return;
      }

      // Check if user is master_admin (doesn't need organization)
      if (profile?.role === 'master_admin') {
        console.debug('[OrganizationContext] Master admin detected - no organization needed');
        setOrganization(null);
        setIsLoading(false);
        return;
      }
      
      // Get organization_id safely
      const organizationId = profile?.organization_id || await getUserOrganizationSafe(user.id);
      
      if (!organizationId) {
        console.debug('[OrganizationContext] User has no organization');
        setOrganization(null);
        setIsLoading(false);
        return;
      }

      // Create a new client instance for this request
      const supabase = createSupabaseBrowserClient();

      // Get the organization data
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .select(`
          id,
          company_legal_name,
          company_trading_name,
          slug,
          client_type,
          custom_backend_url,
          implementation_config,
          is_implementation_complete,
          implementation_date,
          implementation_team_notes
        `)
        .eq('id', organizationId)
        .single();

      if (orgError) {
        console.warn('[OrganizationContext] Organization fetch error:', orgError);
        setOrganization(null);
        return;
      }
      
      if (organization) {
        setOrganization(organization as Organization);
      } else {
        setOrganization(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('[OrganizationContext] Unexpected error:', errorMessage);
      setError(errorMessage);
      setOrganization(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganization();
  }, []);

  return (
    <OrganizationContext.Provider value={{
      organization,
      isLoading,
      error,
      refreshOrganization: fetchOrganization
    }}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within OrganizationProvider');
  }
  return context;
} 
