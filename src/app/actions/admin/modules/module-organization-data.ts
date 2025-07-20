'use server';

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { verifyAdminAccess } from "./utils";
import { trackServerCall } from './call-tracker';

export interface OrganizationData {
  id: string;
  name: string;
  slug: string;
  status: string;
  client_type: string;
}

/**
 * Busca dados das organizações de forma simplificada
 */
export async function getAllModulesWithOrganizationAssignments(): Promise<{ success: boolean; data?: OrganizationData[]; error?: string }> {
  try {
    trackServerCall('🏢 SERVER: getAllModulesWithOrganizationAssignments');
    
    const { isAuthenticated, isAdmin } = await verifyAdminAccess();
    
    if (!isAuthenticated || !isAdmin) {
      return { success: false, error: 'Acesso negado' };
    }

    const supabase = await createSupabaseServerClient();

    // Buscar organizações básicas (todas, incluindo inativas que podem ter assignments)
    const { data: organizations, error: organizationsError } = await supabase
      .from('organizations')
      .select('id, slug, company_trading_name, company_legal_name, status, client_type');

    if (organizationsError) {
      console.error('Erro ao buscar organizações:', organizationsError.message);
      return { success: false, error: 'Falha ao buscar organizações.' };
    }

    const organizationData: OrganizationData[] = (organizations || []).map(org => ({
      id: org.id,
      name: org.company_trading_name || org.company_legal_name || org.slug,
      slug: org.slug,
      status: org.status,
      client_type: org.client_type
    }));

    return { success: true, data: organizationData };
  } catch (error) {
    console.error('Erro ao buscar organizações:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao buscar organizações.',
    };
  }
}