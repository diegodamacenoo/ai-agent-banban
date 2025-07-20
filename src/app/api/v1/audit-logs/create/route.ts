import { NextRequest, NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { createSupabaseServerClient } from '@/core/supabase/server';
import { withRateLimit } from '@/core/api/rate-limiter';
import { 
  AUDIT_ACTION_TYPES,
  AUDIT_RESOURCE_TYPES,
  type AuditActionType,
  type AuditResourceType 
} from '@/core/schemas/audit';

/**
 * POST /api/audit-logs/create
 * Cria um novo log de auditoria
 */
export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for');
    const { success, headers: rateHeaders } = await withRateLimit('standard', 'audit-logs-api');
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { 
        status: 429,
        headers: rateHeaders
      });
    }

    const supabase = await createSupabaseServerClient();
    
    // Verificar autenticação
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Acesso não autorizado' },
        { status: 401 }
      );
    }

    // Verificar se tem permissão para criar logs
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json(
        { error: 'Acesso negado. Usuário sem organização.' },
        { status: 403 }
      );
    }

    // Ler body da requisição
    const body = await request.json();
    const { 
      action_type, 
      resource_type, 
      resource_id,
      details 
    } = body;

    // Validar tipos de ação e recurso
    if (!Object.values(AUDIT_ACTION_TYPES).includes(action_type)) {
      return NextResponse.json(
        { error: 'Tipo de ação inválido' },
        { status: 400 }
      );
    }

    if (!Object.values(AUDIT_RESOURCE_TYPES).includes(resource_type)) {
      return NextResponse.json(
        { error: 'Tipo de recurso inválido' },
        { status: 400 }
      );
    }

    // Criar log de auditoria
    const { data: log, error: insertError } = await supabase
      .from('audit_logs')
      .insert({
        actor_user_id: user.id,
        organization_id: profile.organization_id,
        action_type,
        resource_type,
        resource_id,
        details: JSON.stringify(details),
        ip_address: ip,
        user_agent: request.headers.get('user-agent')
      })
      .select()
      .single();

    if (insertError) {
      console.error('Erro ao criar log de auditoria:', insertError);
      return NextResponse.json(
        { error: 'Erro ao criar log de auditoria' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      log_id: log.id,
      created_at: log.created_at
    });

  } catch (error) {
    console.error('Erro na API de criação de logs:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 
