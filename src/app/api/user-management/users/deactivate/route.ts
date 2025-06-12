// React e Next.js imports
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Bibliotecas de terceiros
import { z } from 'zod';

// Tipos
// (tipos são inferidos do Supabase e Zod)

// Componentes da UI (design system, genéricos)
// (não aplicável para API routes)

// Componentes da aplicação (específicos de features)
// (não aplicável para API routes)

// Hooks personalizados
// (não aplicável para API routes)

// Utilitários e Helpers
import { createSupabaseClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import { createAuditLog, AUDIT_ACTION_TYPES, AUDIT_RESOURCE_TYPES } from '@/lib/utils/audit-logger';

// Estilos
// (não aplicável para API routes)

/**
 * Schema de validação para desativação de usuário.
 * @description Valida os dados necessários para desativar um usuário.
 */
const deactivateUserSchema = z.object({
  id: z.string().min(1, 'ID do usuário é obrigatório'),
});

/**
 * API Route para desativação de usuários.
 * 
 * @description Desativa um usuário específico da organização.
 * Apenas administradores da organização podem desativar usuários.
 * Usuários não podem desativar a si mesmos.
 * 
 * @param {NextRequest} request - Requisição contendo { id: string }
 * @returns {Promise<NextResponse>} Resposta de sucesso ou erro
 * 
 * @security 
 * - Requer autenticação válida
 * - Requer role 'organization_admin'
 * - Isolamento por organização (RLS)
 * - Impede auto-desativação
 * - Registra log de auditoria
 * 
 * @example
 * POST /api/user-management/users/deactivate
 * Body: { id: "user-uuid" }
 * Response: { success: true }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse e validação do body da requisição
    const body = await request.json();
    const validation = deactivateUserSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Dados inválidos',
          details: validation.error.errors 
        },
        { status: 400 }
      );
    }

    const { id } = validation.data;

    // Verificação de autenticação
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);
    const supabaseAdmin = createSupabaseAdminClient(cookieStore);

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Busca do perfil do usuário atual para verificação de permissões
    const { data: userProfile, error: userProfileError } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', session.user.id)
      .single();

    if (userProfileError || !userProfile) {
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar perfil do usuário' },
        { status: 403 }
      );
    }

    // Verificação de permissões de administrador
    if (userProfile.role !== 'organization_admin') {
      return NextResponse.json(
        { success: false, error: 'Apenas administradores podem desativar usuários' },
        { status: 403 }
      );
    }

    // Validação para impedir auto-desativação
    if (id === session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Você não pode desativar sua própria conta' },
        { status: 400 }
      );
    }

    // Busca de dados do usuário alvo para validação e log
    const { data: targetUser, error: targetUserError } = await supabase
      .from('profiles')
      .select('first_name, last_name, organization_id, status')
      .eq('id', id)
      .single();

    if (targetUserError || !targetUser) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Busca do email do usuário da tabela auth.users usando cliente admin
    let userEmail = null;
    try {
      const { data: authUser, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(id);
      userEmail = authUser?.user?.email || null;
    } catch (authError) {
      console.warn('Não foi possível buscar email do usuário:', authError);
      userEmail = null;
    }

    // Verificação de isolamento por organização
    if (targetUser.organization_id !== userProfile.organization_id) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado na sua organização' },
        { status: 404 }
      );
    }

    // Execução da desativação do usuário
    const { error: deactivateError } = await supabase
      .from('profiles')
      .update({ 
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (deactivateError) {
      console.error('Erro ao desativar usuário:', deactivateError);
      return NextResponse.json(
        { success: false, error: 'Erro ao desativar usuário' },
        { status: 500 }
      );
    }

    // Registro de log de auditoria
    await createAuditLog({
      actor_user_id: session.user.id,
      action_type: AUDIT_ACTION_TYPES.USER_UPDATED,
      resource_type: AUDIT_RESOURCE_TYPES.USER,
      resource_id: id,
      details: {
        action: 'deactivate_user',
        target_user_email: userEmail,
        target_user_name: targetUser ? `${targetUser.first_name} ${targetUser.last_name}`.trim() : null,
        previous_status: targetUser.status,
        new_status: 'inactive'
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Erro inesperado ao desativar usuário:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 