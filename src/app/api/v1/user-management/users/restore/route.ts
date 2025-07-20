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
 * Schema de validaÃ§Ã£o para restauraÃ§Ã£o de usuÃ¡rio.
 * @description Valida os dados necessÃ¡rios para restaurar um usuÃ¡rio excluÃ­do (soft delete).
 */
const restoreUserSchema = z.object({
  id: z.string().uuid('ID de usuÃ¡rio invÃ¡lido'),
});

/**
 * API Route para restauraÃ§Ã£o de usuÃ¡rios excluÃ­dos (soft delete).
 * 
 * @description Restaura um usuÃ¡rio especÃ­fico da organizaÃ§Ã£o que foi excluÃ­do via soft delete.
 * Apenas administradores da organizaÃ§Ã£o podem restaurar usuÃ¡rios.
 * 
 * @param {Request} request - RequisiÃ§Ã£o contendo { id: string }
 * @returns {Promise<NextResponse>} Resposta de sucesso ou erro
 * 
 * @security 
 * - Requer autenticaÃ§Ã£o vÃ¡lida
 * - Requer role 'organization_admin'
 * - Isolamento por organizaÃ§Ã£o (RLS)
 * - Verifica se usuÃ¡rio estÃ¡ realmente excluÃ­do
 * - Registra log de auditoria com informaÃ§Ãµes de IP e User Agent
 * 
 * @example
 * POST /api/user-management/users/restore
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

    // Get user session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate request data
    const validatedData = restoreUserSchema.parse(await request.json());

    // Get current user profile
    const { data: currentUserProfile, error: currentUserError } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single();

    if (currentUserError || !currentUserProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Check admin permissions
    if (currentUserProfile.role !== 'organization_admin') {
      return NextResponse.json({ error: 'Only administrators can restore users' }, { status: 403 });
    }

    // Get target user data
    const { data: targetUser, error: targetUserError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, organization_id, role, deleted_at')
      .eq('id', validatedData.id)
      .single();

    if (targetUserError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user email from auth.users using admin client
    let userEmail = null;
    try {
      const { data: authUser, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(validatedData.id);
      userEmail = authUser?.user?.email || null;
    } catch (authError) {
      console.warn('Could not fetch user email:', authError);
      userEmail = null;
    }

    // Check organization isolation
    if (targetUser.organization_id !== currentUserProfile.organization_id) {
      return NextResponse.json({ error: 'Cannot restore user from another organization' }, { status: 403 });
    }

    // Check if user is actually deleted
    if (!targetUser.deleted_at) {
      return NextResponse.json({ error: 'User is not deleted' }, { status: 400 });
    }

    // Restore user (remove deleted_at)
    const { error: restoreError } = await supabase
      .from('profiles')
      .update({
        deleted_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', validatedData.id);

    if (restoreError) {
      console.error('Error restoring user:', restoreError);
      return NextResponse.json({ error: `Failed to restore user: ${restoreError.message}` }, { status: 500 });
    }

    // Create audit log
    try {
      await createAuditLog({
        actor_user_id: user.id,
        action_type: AUDIT_ACTION_TYPES.USER_RESTORED,
        resource_type: AUDIT_RESOURCE_TYPES.USER,
        resource_id: validatedData.id,
        details: { message: 'User restored', isAdmin: true }
      });
    } catch (auditError) {
      console.error('Error creating audit log:', auditError);
      // Don't fail the operation because of audit log
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro na rota POST:', error);
    return NextResponse.json({ error: 'Erro ao restaurar usuÃ¡rio' }, { status: 500 });
  }
} 
