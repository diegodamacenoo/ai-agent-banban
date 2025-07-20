import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/core/supabase/server';
import { cookies, headers } from 'next/headers';
import { z } from 'zod';
import { userRoleOptions } from '@/app/(protected)/settings/types/user-settings-types';
import { createAuditLog, captureRequestInfo } from '@/features/security/audit-logger';
import { AUDIT_ACTION_TYPES, AUDIT_RESOURCE_TYPES } from '@/core/schemas/audit';
import { withRateLimit } from '@/core/api/rate-limiter';

// Schema para validaÃ§Ã£o de dados de convite
const inviteUserSchema = z.object({
  email: z.string().email('E-mail invÃ¡lido'),
  role: z.enum(userRoleOptions).default('user'),
  expiresIn: z.number().int().min(1).max(30).default(7), // Dias para expiraÃ§Ã£o, padrÃ£o 7 dias
});

export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for');
    const { success } = await withRateLimit('standard', ip ?? "127.0.0.1");

    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const supabase = await createSupabaseServerClient();

    // Get user session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate request data
    const validatedData = inviteUserSchema.parse(await request.json());

    // Check if user already exists
    const { data: existingUser, error: existingUserError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', validatedData.email)
      .single();

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    // Create invite
    const { data: invite, error: inviteError } = await supabase
      .from('user_invites')
      .insert({
        email: validatedData.email,
        role: validatedData.role,
        status: 'pending',
        created_by: user.id,
        expires_at: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString()
      })
      .select()
      .single();

    if (inviteError) {
      console.error('Error creating invite:', inviteError);
      return NextResponse.json({ error: `Failed to create invite: ${inviteError.message}` }, { status: 500 });
    }

    // Create audit log
    try {
      await createAuditLog({
        actor_user_id: user.id,
        action_type: AUDIT_ACTION_TYPES.USER_CREATED,
        resource_type: AUDIT_RESOURCE_TYPES.USER,
        resource_id: invite.id,
        details: {
          action: 'invite_sent',
          target_email: validatedData.email,
          target_role: validatedData.role
        }
      });
    } catch (auditError) {
      console.error('Error creating audit log:', auditError);
      // Don't fail the operation because of audit log
    }

    return NextResponse.json({ success: true, data: invite });
  } catch (error) {
    console.error('Erro na rota POST:', error);
    return NextResponse.json({ error: 'Erro ao enviar convite' }, { status: 500 });
  }
} 
