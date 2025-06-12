import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { userRoleOptions } from '@/app/(protected)/settings/types/user-settings-types';
import { createAuditLog, AUDIT_ACTION_TYPES, AUDIT_RESOURCE_TYPES, captureRequestInfo } from '@/lib/utils/audit-logger';

// Schema para validação de dados de convite
const inviteUserSchema = z.object({
  email: z.string().email('E-mail inválido'),
  role: z.enum(userRoleOptions).default('reader'),
  expiresIn: z.number().int().min(1).max(30).default(7), // Dias para expiração, padrão 7 dias
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
    const validation = inviteUserSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Dados inválidos', 
        details: validation.error.errors 
      }, { status: 400 });
    }

    const validatedData = validation.data;

    // Buscar dados do usuário logado para obter organization_id
    const { data: userProfile, error: userProfileError } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    if (userProfileError) {
      console.error('Erro ao buscar perfil do usuário:', userProfileError);
      return NextResponse.json({ error: 'Erro ao buscar perfil do usuário.' }, { status: 500 });
    }
    if (!userProfile) {
      return NextResponse.json({ error: 'Perfil de usuário não encontrado' }, { status: 404 });
    }

    if (userProfile.role !== 'organization_admin') {
      return NextResponse.json({ error: 'Apenas administradores podem enviar convites' }, { status: 403 });
    }

    // Chamada da edge function do Supabase
    const { data: result, error } = await supabase.functions.invoke('invite-new-user', {
      body: {
        email: validatedData.email,
        organization_id: userProfile.organization_id,
        role: validatedData.role,
      },
    });

    if (error) {
      console.error('Erro ao invocar edge function invite-new-user:', error);
      return NextResponse.json({ error: error.message || 'Erro ao enviar convite.' }, { status: 500 });
    }

    // Registrar log de auditoria
    try {
      const { ipAddress, userAgent, organizationId } = await captureRequestInfo(user.id);
      await createAuditLog({
        actor_user_id: user.id,
        action_type: AUDIT_ACTION_TYPES.USER_INVITE_SENT,
        resource_type: AUDIT_RESOURCE_TYPES.INVITE,
        ip_address: ipAddress,
        user_agent: userAgent,
        organization_id: organizationId,
        details: {
          invited_email: validatedData.email,
          role: validatedData.role,
          expires_in_days: validatedData.expiresIn,
          organization_id: userProfile.organization_id
        }
      });
    } catch (auditError) {
      console.error('Erro ao criar log de auditoria:', auditError);
      // Não falha a operação por causa do log de auditoria
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro na rota POST:', error);
    return NextResponse.json({ error: 'Erro ao enviar convite' }, { status: 500 });
  }
} 