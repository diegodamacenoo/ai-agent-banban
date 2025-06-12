import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { z } from 'zod';

// Schema para validação dos dados de audit log
const auditLogSchema = z.object({
  actor_user_id: z.string().uuid('ID de usuário deve ser um UUID válido'),
  action_type: z.string().min(1, 'Tipo de ação é obrigatório'),
  resource_type: z.string().min(1, 'Tipo de recurso é obrigatório'),
  resource_id: z.string().optional(),
  details: z.record(z.any()).optional(),
  organization_id: z.string().uuid().optional()
});

/**
 * POST /api/audit-logs/create
 * Cria um novo log de auditoria
 */
export async function POST(request: NextRequest) {
  try {
    // Parse e validação do body
    const body = await request.json();
    const validatedData = auditLogSchema.parse(body);
    
    // Extrair informações da requisição
    const ip_address = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                      request.headers.get('x-real-ip') ||
                      request.headers.get('x-client-ip') ||
                      null;
    
    const user_agent = request.headers.get('user-agent');
    
    // Criar cliente Supabase
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    // Verificar se o usuário autenticado é o mesmo que está sendo auditado
    if (user.id !== validatedData.actor_user_id) {
      return NextResponse.json(
        { error: 'Usuário não pode criar logs para outros usuários' },
        { status: 403 }
      );
    }
    
    // Inserir log de auditoria
    const { error: insertError } = await supabase
      .from('audit_logs')
      .insert({
        actor_user_id: validatedData.actor_user_id,
        action_type: validatedData.action_type,
        resource_type: validatedData.resource_type,
        resource_id: validatedData.resource_id,
        details: validatedData.details || {},
        ip_address,
        user_agent,
        organization_id: validatedData.organization_id,
        action_timestamp: new Date().toISOString()
      });
    
    if (insertError) {
      console.error('Erro ao inserir log de auditoria:', insertError);
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Erro crítico na criação de audit log:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 