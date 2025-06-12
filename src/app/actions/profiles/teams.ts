'use server';

import { createSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

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
export async function getTeams() {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('Usuário não autenticado');
      return { error: 'Usuário não autenticado' };
    }
    
    // Primeiro, obtém o organization_id do perfil do usuário
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();
    
    if (profileError || !profileData?.organization_id) {
      console.error('Erro ao buscar organization_id do perfil:', profileError);
      return { error: 'Não foi possível identificar a organização do usuário' };
    }
    
    // Com o organization_id, busca as equipes dessa organização
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('organization_id', profileData.organization_id)
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Erro ao buscar equipes:', error);
      return { error: error.message };
    }
    
    return { data: data as Team[] };
  } catch (error) {
    console.error('Erro inesperado ao buscar equipes:', error);
    return { error: 'Falha ao buscar equipes' };
  }
} 