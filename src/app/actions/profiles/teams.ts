'use server';

import { createSupabaseServerClient } from '@/core/supabase/server';
import { z } from 'zod';

// Schema local para validação
const GetTeamsSchema = z.object({});

export type Team = {
  id: string;
  name: string;
  description: string | null;
  organization_id: string;
  created_at: string;
  updated_at: string;
  leader_id: string | null;
};

/**
 * Busca as equipes da organização do usuário atual
 */
export async function getTeams(): Promise<{ success: boolean; data?: Team[]; error?: string }> {
  const validation = GetTeamsSchema.safeParse({});
  if (!validation.success) {
    // This should not happen with an empty schema, but it's good practice
    return { success: false, error: 'Validation failed' };
  }

  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Usuário não autenticado');
      return { success: false, error: 'Usuário não autenticado' };
    }
    
    // Primeiro, obtém o organization_id do perfil do usuário
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();
    
    if (profileError || !profileData?.organization_id) {
      console.error('Erro ao buscar organization_id do perfil:', profileError);
      return { success: false, error: 'Não foi possível identificar a organização do usuário' };
    }
    
    // Com o organization_id, busca as equipes dessa organização
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('organization_id', profileData.organization_id)
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Erro ao buscar equipes:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data: data as Team[] };
  } catch (error) {
    console.error('Erro inesperado ao buscar equipes:', error);
    return { success: false, error: 'Falha ao buscar equipes' };
  }
} 
