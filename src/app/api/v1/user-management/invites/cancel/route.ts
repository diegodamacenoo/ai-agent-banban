import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/core/supabase/server';
import { cookies, headers } from 'next/headers';
import { z } from 'zod';
import { createAuditLog, captureRequestInfo } from '@/features/security/audit-logger';
import { AUDIT_ACTION_TYPES, AUDIT_RESOURCE_TYPES } from '@/core/schemas/audit';
import { withRateLimit } from '@/core/api/rate-limiter';

const cancelInviteSchema = z.object({
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

    const supabase = await createSupabaseServerClient();

    // Get user session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate request data
    const validatedData = cancelInviteSchema.parse(await request.json());

    // Get invite data
    const { data: inviteData, error: inviteError } = await supabase
      .from('user_invites')
      .select('email, role')
      .eq('id', validatedData.id)
      .single();

    if (inviteError || !inviteData) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }
    
    // Cancel invite
    const { error } = await supabase
      .from('user_invites')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', validatedData.id);
      
    if (error) {
      console.error('Error cancelling invite:', error);
      return NextResponse.json({ error: `Failed to cancel invite: ${error.message}` }, { status: 500 });
    }
    
    // Create audit log
    try {
      await createAuditLog({
        actor_user_id: user.id,
        action_type: AUDIT_ACTION_TYPES.USER_UPDATED,
        resource_type: AUDIT_RESOURCE_TYPES.USER,
        resource_id: validatedData.id,
        details: {
          action: 'invite_cancelled',
          target_email: inviteData.email,
          target_role: inviteData.role
        }
      });
    } catch (auditError) {
      console.error('Error creating audit log:', auditError);
      // Don't fail the operation because of audit log
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST route:', error);
    return NextResponse.json({ error: 'Failed to cancel invite' }, { status: 500 });
  }
} 
