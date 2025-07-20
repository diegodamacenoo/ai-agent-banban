'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabaseClient } from '@/lib/supabase/client';
import { safeGetUser } from '@/core/supabase/auth-helpers';

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

      const { user, error: userError } = await safeGetUser();
      
      if (userError) {
        throw new Error(`Authentication error: ${userError}`);
      }
      
      if (!user) {
        setOrganization(null);
        setIsLoading(false);
        return;
      }

      // First, get the profile to get organization_id
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (profileError) {
        throw new Error(`Profile error: ${profileError.message}`);
      }

      if (!profile?.organization_id) {
        setOrganization(null);
        return;
      }

      // Then get the organization data
      const { data: organization, error: orgError } = await supabaseClient
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
        .eq('id', profile.organization_id)
        .single();

      if (orgError) {
        throw new Error(`Organization error: ${orgError.message}`);
      }
      
      if (organization) {
        setOrganization(organization as Organization);
      } else {
        setOrganization(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
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
