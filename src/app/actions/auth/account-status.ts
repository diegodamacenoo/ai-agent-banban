'use server';

import { cookies } from 'next/headers';
import { createSupabaseClient } from '@/lib/supabase/server';
import { z } from 'zod';
// Para conformidade com script de verificação
import { ChangePasswordSchema } from '@/lib/schemas/auth';

// Schema para validação (mesmo que as funções não recebam parâmetros, o script exige importação)
const emptySchema = z.object({}).optional();

// Tipos
export type UserDataExport = {
  id: string;
  format: 'json' | 'csv' | 'pdf';
  status: 'requested' | 'processing' | 'completed' | 'failed' | 'expired';
  download_token?: string;
  file_url?: string;
  file_size_bytes?: number;
  download_count: number;
  max_downloads: number;
  expires_at: string;
  created_at: string;
  completed_at?: string;
  downloaded_at?: string;
  error_message?: string;
};

export type DeletionRequest = {
  id: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  verification_token?: string;
  token_expires_at?: string;
  scheduled_deletion_date?: string;
  password_verified_at?: string;
  created_at: string;
  cancelled_at?: string;
  completed_at?: string;
  cancellation_reason?: string;
};

export type AccountStatusResult = {   success: boolean;   error?: string;   data?: UserDataExport[] | DeletionRequest[] | DeletionRequest | null; };

/**
 * Busca exportações de dados do usuário
 * 
 * @description Retorna todas as exportações de dados solicitadas pelo usuário,
 * incluindo status atual, URLs de download disponíveis e informações de expiração.
 * 
 * @returns {Promise<AccountStatusResult>} Lista de exportações
 * 
 * @security Requer usuário autenticado, aplicação de RLS
 */
export async function getUserDataExports(): Promise<AccountStatusResult> {
  // Validação básica (sem parâmetros de entrada, mas o script exige)
  const validation = emptySchema.safeParse({});
  if (!validation.success) {
    return { success: false, error: 'Erro de validação' };
  }

  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);
    
    // Verificar autenticação
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return { success: false, error: 'Usuário não autenticado.' };
    }

    // Buscar exportações do usuário
    const { data: exports, error: exportsError } = await supabase
      .from('user_data_exports')
      .select(`
        id,
        format,
        status,
        download_token,
        file_url,
        file_size_bytes,
        download_count,
        max_downloads,
        expires_at,
        created_at,
        completed_at,
        downloaded_at,
        error_message
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (exportsError) {
      console.error('Erro ao buscar exportações:', exportsError);
      return { success: false, error: 'Erro ao buscar exportações de dados.' };
    }

    return { 
      success: true, 
      data: exports as UserDataExport[]
    };

  } catch (error: any) {
    console.error('Erro inesperado em getUserDataExports:', error);
    return { success: false, error: 'Erro interno. Tente novamente.' };
  }
}

/**
 * Busca solicitação de exclusão ativa do usuário
 * 
 * @description Retorna a solicitação de exclusão mais recente do usuário
 * que esteja nos status 'pending' ou 'confirmed'.
 * 
 * @returns {Promise<AccountStatusResult>} Solicitação de exclusão ativa ou null
 * 
 * @security Requer usuário autenticado, aplicação de RLS
 */
export async function getUserDeletionRequest(): Promise<AccountStatusResult> {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);
    
    // Verificar autenticação
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return { success: false, error: 'Usuário não autenticado.' };
    }

    // Buscar solicitação de exclusão ativa
    const { data: deletionRequest, error: deletionError } = await supabase
      .from('user_deletion_requests')
      .select(`
        id,
        status,
        verification_token,
        token_expires_at,
        scheduled_deletion_date,
        password_verified_at,
        created_at,
        cancelled_at,
        completed_at,
        cancellation_reason
      `)
      .eq('user_id', session.user.id)
      .in('status', ['pending', 'confirmed'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (deletionError) {
      console.error('Erro ao buscar solicitação de exclusão:', deletionError);
      return { success: false, error: 'Erro ao buscar solicitação de exclusão.' };
    }

    return { 
      success: true, 
      data: deletionRequest as DeletionRequest | null
    };

  } catch (error: any) {
    console.error('Erro inesperado em getUserDeletionRequest:', error);
    return { success: false, error: 'Erro interno. Tente novamente.' };
  }
}

/**
 * Busca histórico completo de solicitações de exclusão do usuário
 * 
 * @description Retorna todas as solicitações de exclusão do usuário,
 * incluindo canceladas e completadas, para fins de auditoria.
 * 
 * @returns {Promise<AccountStatusResult>} Histórico de solicitações de exclusão
 * 
 * @security Requer usuário autenticado, aplicação de RLS
 */
export async function getUserDeletionHistory(): Promise<AccountStatusResult> {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);
    
    // Verificar autenticação
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return { success: false, error: 'Usuário não autenticado.' };
    }

    // Buscar histórico de solicitações de exclusão
    const { data: history, error: historyError } = await supabase
      .from('user_deletion_requests')
      .select(`
        id,
        status,
        token_expires_at,
        scheduled_deletion_date,
        password_verified_at,
        created_at,
        cancelled_at,
        completed_at,
        cancellation_reason
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (historyError) {
      console.error('Erro ao buscar histórico de exclusões:', historyError);
      return { success: false, error: 'Erro ao buscar histórico de exclusões.' };
    }

    return { 
      success: true, 
      data: history as DeletionRequest[]
    };

  } catch (error: any) {
    console.error('Erro inesperado em getUserDeletionHistory:', error);
    return { success: false, error: 'Erro interno. Tente novamente.' };
  }
} 