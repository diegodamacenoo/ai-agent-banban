import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/core/supabase/server';
import { cookies, headers } from 'next/headers';
import { z } from 'zod';
import { createAuditLog, captureRequestInfo } from '@/features/security/audit-logger';
import { AUDIT_ACTION_TYPES, AUDIT_RESOURCE_TYPES } from '@/core/schemas/audit';
import { withRateLimit } from '@/core/api/rate-limiter';

const resendInviteSchema = z.object({
  id: z.string(),
});

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

    // Get user session
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate request data
    const validatedData = resendInviteSchema.parse(await request.json());

    // Get invite data
    const { data: inviteData, error: inviteError } = await supabase
      .from('user_invites')
      .select('*')
      .eq('id', validatedData.id)
      .single();

    if (inviteError || !inviteData) {
      return NextResponse.json(
        { error: 'Invite not found' },
        { status: 404 }
      );
    }

    // Resend invite
    const { data: invite, error: resendError } = await supabase
      .from('user_invites')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', validatedData.id)
      .select()
      .single();

    if (resendError) {
      console.error('Erro ao reenviar convite:', resendError);
      return NextResponse.json({ error: `Erro ao reenviar convite: ${resendError.message}` }, { status: 500 });
    }
    
    // Registrar log de auditoria
    try {
      const { ipAddress, userAgent, organizationId } = await captureRequestInfo(user.id);
      await createAuditLog({
        actor_user_id: user.id,
        action_type: AUDIT_ACTION_TYPES.USER_UPDATED,
        resource_type: AUDIT_RESOURCE_TYPES.USER,
        resource_id: validatedData.id,
        details: {
          action: 'invite_resent'
        }
      });
    } catch (auditError) {
      console.error('Erro ao criar log de auditoria:', auditError);
      // Não falha a operação por causa do log de auditoria
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro na rota POST:', error);
    return NextResponse.json({ error: 'Erro ao reenviar convite' }, { status: 500 });
  }
} 
