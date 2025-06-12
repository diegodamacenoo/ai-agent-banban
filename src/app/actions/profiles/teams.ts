'use server';

import { createSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { GetTeamsSchema } from '@/lib/schemas/profiles';

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
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      console.error('Usuário não autenticado');
      return { success: false, error: 'Usuário não autenticado' };
    }
    
    const user = session.user;
    
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