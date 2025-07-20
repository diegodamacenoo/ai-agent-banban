// React e Next.js imports
import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';

// Bibliotecas de terceiros
import { z } from 'zod';

// Tipos
// (tipos sÃ£o inferidos do Supabase e Zod)

// Componentes da UI (design system, genÃ©ricos)
// (nÃ£o aplicÃ¡vel para API routes)

// Componentes da aplicaÃ§Ã£o (especÃ­ficos de features)
// (nÃ£o aplicÃ¡vel para API routes)

// Hooks personalizados
// (nÃ£o aplicÃ¡vel para API routes)

// UtilitÃ¡rios e Helpers
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/core/supabase/server';
import { createAuditLog, captureRequestInfo } from '@/features/security/audit-logger';
import { AUDIT_ACTION_TYPES, AUDIT_RESOURCE_TYPES } from '@/core/schemas/audit';
import { withRateLimit } from '@/core/api/rate-limiter';

// Estilos
// (nÃ£o aplicÃ¡vel para API routes)

/**
 * Schema de validaÃ§Ã£o para soft delete de usuÃ¡rio.
 * @description Valida os dados necessÃ¡rios para excluir um usuÃ¡rio (soft delete).
 */
const softDeleteUserSchema = z.object({
  id: z.string().uuid('ID de usuÃ¡rio invÃ¡lido'),
});

/**
 * API Route para exclusÃ£o suave (soft delete) de usuÃ¡rios.
 * 
 * @description Executa soft delete em um usuÃ¡rio especÃ­fico da organizaÃ§Ã£o.
 * Apenas administradores da organizaÃ§Ã£o podem excluir usuÃ¡rios.
 * UsuÃ¡rios nÃ£o podem excluir a si mesmos.
 * 
 * @param {Request} request - RequisiÃ§Ã£o contendo { id: string }
 * @returns {Promise<NextResponse>} Resposta de sucesso ou erro
 * 
 * @security 
 * - Requer autenticaÃ§Ã£o vÃ¡lida
 * - Requer role 'organization_admin'
 * - Isolamento por organizaÃ§Ã£o (RLS)
 * - Impede auto-exclusÃ£o
 * - Registra log de auditoria com informaÃ§Ãµes de IP e User Agent
 * 
 * @example
 * POST /api/user-management/users/soft-delete
 * Body: { id: "user-uuid" }
 * Response: { success: true }
 */
export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for');
    const { success } = await withRateLimit('standard', ip ?? "127.0.0.1");

    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient();
    const supabaseAdmin = await createSupabaseAdminClient();

    // VerificaÃ§Ã£o de autenticaÃ§Ã£o
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Erro de autenticaÃ§Ã£o:', userError);
      return NextResponse.json({ error: 'NÃ£o autorizado' }, { status: 401 });
    }

    // Parse e validaÃ§Ã£o do body da requisiÃ§Ã£o
    const body = await request.json();
    console.debug('DEBUG - Dados recebidos:', body);

    const validation = softDeleteUserSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Dados invÃ¡lidos', 
        details: validation.error.errors 
      }, { status: 400 });
    }

    const validatedData = validation.data;

    // Busca do perfil do usuÃ¡rio atual para verificaÃ§Ã£o de permissÃµes
    const { data: currentUserProfile, error: currentUserError } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single();

    if (currentUserError || !currentUserProfile) {
      console.error('Erro ao buscar perfil do usuÃ¡rio atual:', currentUserError);
      return NextResponse.json({ error: 'Perfil do usuÃ¡rio nÃ£o encontrado' }, { status: 404 });
    }

    // VerificaÃ§Ã£o de permissÃµes de administrador
    if (currentUserProfile.role !== 'organization_admin') {
      return NextResponse.json({ error: 'Apenas administradores podem excluir usuÃ¡rios' }, { status: 403 });
    }

    // Busca de dados do usuÃ¡rio alvo para validaÃ§Ã£o e log
    const { data: targetUser, error: targetUserError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, organization_id, role')
      .eq('id', validatedData.id)
      .single();

    if (targetUserError || !targetUser) {
      console.error('Erro ao buscar usuÃ¡rio a ser excluÃ­do:', targetUserError);
      return NextResponse.json({ error: 'UsuÃ¡rio nÃ£o encontrado' }, { status: 404 });
    }

    // Busca do email do usuÃ¡rio da tabela auth.users usando cliente admin
    let userEmail = null;
    try {
      const { data: authUser, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(validatedData.id);
      userEmail = authUser?.user?.email || null;
    } catch (authError) {
      console.warn('NÃ£o foi possÃ­vel buscar email do usuÃ¡rio:', authError);
      userEmail = null;
    }

    // VerificaÃ§Ã£o de isolamento por organizaÃ§Ã£o
    if (targetUser.organization_id !== currentUserProfile.organization_id) {
      return NextResponse.json({ error: 'NÃ£o Ã© possÃ­vel excluir usuÃ¡rio de outra organizaÃ§Ã£o' }, { status: 403 });
    }

    // ValidaÃ§Ã£o para impedir auto-exclusÃ£o
    if (targetUser.id === user.id) {
      return NextResponse.json({ error: 'NÃ£o Ã© possÃ­vel excluir seu prÃ³prio usuÃ¡rio' }, { status: 400 });
    }

    // ExecuÃ§Ã£o do soft delete
    const { error: deleteError } = await supabase
      .from('profiles')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', validatedData.id);

    if (deleteError) {
      console.error('Erro ao executar soft delete:', deleteError);
      return NextResponse.json({ error: `Erro ao excluir usuÃ¡rio: ${deleteError.message}` }, { status: 500 });
    }

    // Registro de log de auditoria com informaÃ§Ãµes de contexto
    try {
      const { ipAddress, userAgent, organizationId } = await captureRequestInfo(user.id);
      await createAuditLog({
        actor_user_id: user.id,
        action_type: AUDIT_ACTION_TYPES.USER_DEACTIVATED,
        resource_type: AUDIT_RESOURCE_TYPES.USER,
        resource_id: validatedData.id,
        details: { message: 'User soft deleted', isAdmin: true }
      });
    } catch (auditError) {
      console.error('Erro ao criar log de auditoria:', auditError);
      // NÃ£o falha a operaÃ§Ã£o por causa do log de auditoria
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro na rota POST:', error);
    return NextResponse.json({ error: 'Erro ao excluir usuÃ¡rio' }, { status: 500 });
  }
} 
