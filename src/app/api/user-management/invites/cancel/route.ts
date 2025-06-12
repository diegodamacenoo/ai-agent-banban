import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { createAuditLog, AUDIT_ACTION_TYPES, AUDIT_RESOURCE_TYPES, captureRequestInfo } from '@/lib/utils/audit-logger';

const cancelInviteSchema = z.object({
  id: z.string(),
});

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);

    // Verifica se o usuário está autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Erro de autenticação:', userError);
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Obtém body da requisição
    const body = await request.json();
    console.log('DEBUG - Dados recebidos:', body);

    // Valida os dados do corpo da requisição
    const validation = cancelInviteSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Dados inválidos', 
        details: validation.error.errors 
      }, { status: 400 });
    }

    const validatedData = validation.data;

    // Buscar dados do convite antes de cancelar para o log
    const { data: inviteData, error: inviteError } = await supabase
      .from('user_invites')
      .select('email, role')
      .eq('id', validatedData.id)
      .single();

    if (inviteError) {
      console.error('Erro ao buscar convite:', inviteError);
      return NextResponse.json({ error: 'Convite não encontrado' }, { status: 404 });
    }
    
    // Cancelar convite alterando status
    const { error } = await supabase // RLS deve garantir que apenas admin da org correta possa fazer isso
      .from('user_invites')
      .update({
        status: 'cancelado',
        updated_at: new Date().toISOString()
      })
      .eq('id', validatedData.id);
      
    if (error) {
      console.error('Erro ao cancelar convite:', error);
      return NextResponse.json({ error: `Erro ao cancelar convite: ${error.message}` }, { status: 500 });
    }
    
    // Registrar log de auditoria
    try {
      const { ipAddress, userAgent, organizationId } = await captureRequestInfo(user.id);
      await createAuditLog({
        actor_user_id: user.id,
        action_type: AUDIT_ACTION_TYPES.USER_INVITE_CANCELLED,
        resource_type: AUDIT_RESOURCE_TYPES.INVITE,
        ip_address: ipAddress,
        user_agent: userAgent,
        organization_id: organizationId,
        resource_id: validatedData.id,
        details: {
          invited_email: inviteData?.email,
          role: inviteData?.role
        }
      });
    } catch (auditError) {
      console.error('Erro ao criar log de auditoria:', auditError);
      // Não falha a operação por causa do log de auditoria
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro na rota POST:', error);
    return NextResponse.json({ error: 'Erro ao cancelar convite' }, { status: 500 });
  }
} 