// React e Next.js imports
import { NextResponse } from 'next/server';
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
import { createAuditLog, AUDIT_ACTION_TYPES, AUDIT_RESOURCE_TYPES, captureRequestInfo } from '@/lib/utils/audit-logger';

// Estilos
// (não aplicável para API routes)

/**
 * Schema de validação para soft delete de usuário.
 * @description Valida os dados necessários para excluir um usuário (soft delete).
 */
const softDeleteUserSchema = z.object({
  id: z.string().uuid('ID de usuário inválido'),
});

/**
 * API Route para exclusão suave (soft delete) de usuários.
 * 
 * @description Executa soft delete em um usuário específico da organização.
 * Apenas administradores da organização podem excluir usuários.
 * Usuários não podem excluir a si mesmos.
 * 
 * @param {Request} request - Requisição contendo { id: string }
 * @returns {Promise<NextResponse>} Resposta de sucesso ou erro
 * 
 * @security 
 * - Requer autenticação válida
 * - Requer role 'organization_admin'
 * - Isolamento por organização (RLS)
 * - Impede auto-exclusão
 * - Registra log de auditoria com informações de IP e User Agent
 * 
 * @example
 * POST /api/user-management/users/soft-delete
 * Body: { id: "user-uuid" }
 * Response: { success: true }
 */
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);
    const supabaseAdmin = createSupabaseAdminClient(cookieStore);

    // Verificação de autenticação
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Erro de autenticação:', userError);
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Parse e validação do body da requisição
    const body = await request.json();
    console.log('DEBUG - Dados recebidos:', body);

    const validation = softDeleteUserSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Dados inválidos', 
        details: validation.error.errors 
      }, { status: 400 });
    }

    const validatedData = validation.data;

    // Busca do perfil do usuário atual para verificação de permissões
    const { data: currentUserProfile, error: currentUserError } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single();

    if (currentUserError || !currentUserProfile) {
      console.error('Erro ao buscar perfil do usuário atual:', currentUserError);
      return NextResponse.json({ error: 'Perfil do usuário não encontrado' }, { status: 404 });
    }

    // Verificação de permissões de administrador
    if (currentUserProfile.role !== 'organization_admin') {
      return NextResponse.json({ error: 'Apenas administradores podem excluir usuários' }, { status: 403 });
    }

    // Busca de dados do usuário alvo para validação e log
    const { data: targetUser, error: targetUserError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, organization_id, role')
      .eq('id', validatedData.id)
      .single();

    if (targetUserError || !targetUser) {
      console.error('Erro ao buscar usuário a ser excluído:', targetUserError);
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Busca do email do usuário da tabela auth.users usando cliente admin
    let userEmail = null;
    try {
      const { data: authUser, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(validatedData.id);
      userEmail = authUser?.user?.email || null;
    } catch (authError) {
      console.warn('Não foi possível buscar email do usuário:', authError);
      userEmail = null;
    }

    // Verificação de isolamento por organização
    if (targetUser.organization_id !== currentUserProfile.organization_id) {
      return NextResponse.json({ error: 'Não é possível excluir usuário de outra organização' }, { status: 403 });
    }

    // Validação para impedir auto-exclusão
    if (targetUser.id === user.id) {
      return NextResponse.json({ error: 'Não é possível excluir seu próprio usuário' }, { status: 400 });
    }

    // Execução do soft delete
    const { error: deleteError } = await supabase
      .from('profiles')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', validatedData.id);

    if (deleteError) {
      console.error('Erro ao executar soft delete:', deleteError);
      return NextResponse.json({ error: `Erro ao excluir usuário: ${deleteError.message}` }, { status: 500 });
    }

    // Registro de log de auditoria com informações de contexto
    try {
      const { ipAddress, userAgent, organizationId } = await captureRequestInfo(user.id);
      await createAuditLog({
        actor_user_id: user.id,
        action_type: AUDIT_ACTION_TYPES.USER_DELETED,
        resource_type: AUDIT_RESOURCE_TYPES.USER,
        resource_id: validatedData.id,
        ip_address: ipAddress,
        user_agent: userAgent,
        organization_id: organizationId,
        details: {
          deleted_user_email: userEmail,
          deleted_user_name: `${targetUser.first_name} ${targetUser.last_name}`.trim(),
          deleted_user_role: targetUser.role,
          deletion_type: 'soft_delete'
        }
      });
    } catch (auditError) {
      console.error('Erro ao criar log de auditoria:', auditError);
      // Não falha a operação por causa do log de auditoria
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro na rota POST:', error);
    return NextResponse.json({ error: 'Erro ao excluir usuário' }, { status: 500 });
  }
} 