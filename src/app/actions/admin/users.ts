'use server';

import { createSupabaseAdminClient } from '@/core/supabase/server';
import { z } from 'zod';

// Schema para validação dos dados do formulário no servidor
const inviteUserSchema = z.object({
  email: z.string().email('Formato de email inválido.'),
  first_name: z.string().min(1, 'O nome é obrigatório.'),
  last_name: z.string().min(1, 'O sobrenome é obrigatório.'),
  role: z.enum(['organization_admin', 'editor', 'reader', 'visitor']),
  organization_id: z.string().uuid('ID da organização inválido.'),
});

interface InviteUserFormData {
  email: string;
  first_name: string;
  last_name: string;
  role: 'organization_admin' | 'editor' | 'reader' | 'visitor';
  organization_id: string;
}

/**
 * Convida um novo usuário para uma organização por email.
 * Esta ação:
 * 1. Cria o usuário no sistema de autenticação do Supabase
 * 2. Cria um registro correspondente na tabela `profiles`
 * 3. Associa o usuário à organização especificada
 * 
 * @param formData - Os dados do usuário a ser convidado.
 * @returns Um objeto com os dados do usuário convidado ou um erro.
 */
export async function inviteNewUser(formData: InviteUserFormData) {
  console.debug('[Server Action] Iniciando convite para:', formData.email);

  // Validação dos dados no servidor
  const validationResult = inviteUserSchema.safeParse(formData);
  if (!validationResult.success) {
    console.error('[Server Action] Erro de validação:', validationResult.error.flatten());
    return { error: 'Dados inválidos. Por favor, verifique o formulário.' };
  }

  try {
    const supabase = await createSupabaseAdminClient();

    // Passo 1: Criar usuário no sistema de autenticação
    const { data: authData, error: authError } = await supabase.auth.admin.inviteUserByEmail(
      validationResult.data.email,
      {
        // Dados que serão armazenados no `user_metadata` do usuário
        data: {
          first_name: validationResult.data.first_name,
          last_name: validationResult.data.last_name,
          role: validationResult.data.role,
          organization_id: validationResult.data.organization_id,
        },
      }
    );

    if (authError) {
      console.error('[Server Action] Erro ao convidar usuário no Supabase:', authError.message);
      // Mapear erros comuns para mensagens mais amigáveis
      if (authError.message.includes('User already registered')) {
        return { error: 'Este email já está cadastrado no sistema.' };
      }
      return { error: `Falha ao enviar convite: ${authError.message}` };
    }

    if (!authData?.user?.id) {
      console.error('[Server Action] Usuário criado mas ID não retornado');
      return { error: 'Erro interno: ID do usuário não foi retornado.' };
    }

    console.debug('[Server Action] Usuário criado na autenticação:', authData.user.id);

    // Passo 2: Criar registro na tabela profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        first_name: validationResult.data.first_name,
        last_name: validationResult.data.last_name,
        role: validationResult.data.role,
        organization_id: validationResult.data.organization_id,
        status: 'ACTIVE',
        is_setup_complete: false, // Novo usuário precisa completar setup
        prefers_email_notifications: true,
        prefers_push_notifications: true,
        theme: 'light',
        is_2fa_enabled: false,
      });

    if (profileError) {
      console.error('[Server Action] Erro ao criar perfil do usuário:', profileError.message);
      
      // Se o perfil não foi criado, devemos remover o usuário da autenticação para manter consistência
      try {
        await supabase.auth.admin.deleteUser(authData.user.id);
        console.debug('[Server Action] Usuário removido da autenticação devido ao erro no perfil');
      } catch (cleanupError) {
        console.error('[Server Action] Erro ao limpar usuário após falha no perfil:', cleanupError);
      }
      
      return { error: `Falha ao criar perfil do usuário: ${profileError.message}` };
    }

    console.debug('[Server Action] Perfil criado com sucesso para usuário:', authData.user.id);
    console.debug('[Server Action] Convite completo enviado para:', authData.user.email);

    return { 
      data: {
        ...authData,
        profile_created: true
      }
    };

  } catch (e: any) {
    console.error('[Server Action] Exceção inesperada:', e.message);
    return { error: 'Ocorreu um erro inesperado no servidor.' };
  }
}

/**
 * Retorna todos os usuários do sistema com suas informações básicas.
 */
export async function getAllUsers() {
  try {
    const supabase = await createSupabaseAdminClient();

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        role,
        status,
        last_sign_in_at,
        created_at,
        job_title,
        phone,
        organizations (
          id,
          company_trading_name,
          client_type
        )
      `);

    if (error) {
      console.error('[Server Action] Erro ao buscar usuários:', error.message);
      return { error: 'Falha ao carregar usuários.' };
    }

    // Buscar emails dos usuários
    const { data: users, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error('[Server Action] Erro ao buscar emails:', authError.message);
      return { error: 'Falha ao carregar emails dos usuários.' };
    }

    // Mapear emails para os perfis
    const usersWithEmail = profiles.map(profile => {
      const user = users.users.find(u => u.id === profile.id);
      return {
        ...profile,
        email: user?.email || 'Email não encontrado'
      };
    });

    return { data: usersWithEmail };
  } catch (e: any) {
    console.error('[Server Action] Exceção inesperada:', e.message);
    return { error: 'Ocorreu um erro inesperado no servidor.' };
  }
}

/**
 * Retorna estatísticas sobre os usuários do sistema.
 */
export async function getUserStats() {
  try {
    const supabase = await createSupabaseAdminClient();

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) {
      console.error('[Server Action] Erro ao buscar estatísticas:', error.message);
      return { error: 'Falha ao carregar estatísticas.' };
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const stats = {
      total: profiles.length,
      active: profiles.filter(p => p.status === 'ACTIVE').length,
      inactive: profiles.filter(p => p.status === 'INACTIVE').length,
      pending: profiles.filter(p => p.status === 'PENDING').length,
  deleted: profiles.filter(p => p.status === 'DELETED').length,
      admins: profiles.filter(p => p.role === 'master_admin' || p.role === 'organization_admin').length,
      recent: profiles.filter(p => new Date(p.created_at) > oneWeekAgo).length
    };

    return { data: stats };
  } catch (e: any) {
    console.error('[Server Action] Exceção inesperada:', e.message);
    return { error: 'Ocorreu um erro inesperado no servidor.' };
  }
}