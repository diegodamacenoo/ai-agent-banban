import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/core/supabase/server';
import { createLogger } from '@/shared/utils/logger';
import { DEBUG_MODULES } from '@/shared/utils/debug-config';

const logger = createLogger(DEBUG_MODULES.AUTH);

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { last_activity } = body;

    if (!last_activity) {
      return NextResponse.json(
        { error: 'last_activity é obrigatório' },
        { status: 400 }
      );
    }

    // Extrair informações da requisição
    const userAgent = request.headers.get('user-agent') || '';
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
              request.headers.get('x-real-ip') || 
              request.ip || 
              'unknown';

    // Buscar sessão ativa mais recente do usuário
    const { data: activeSession } = await supabase
      .from('user_sessions')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('last_activity', { ascending: false })
      .limit(1)
      .single();

    if (activeSession) {
      // Atualizar sessão existente
      const { error: updateError } = await supabase
        .from('user_sessions')
        .update({
          last_activity: new Date(last_activity).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', activeSession.id);

      if (updateError) {
        logger.error('Erro ao atualizar atividade da sessão:', updateError);
        return NextResponse.json(
          { error: 'Erro ao atualizar sessão' },
          { status: 500 }
        );
      }

      logger.debug(`Atividade atualizada para sessão ${activeSession.id}`);
      return NextResponse.json({ success: true, sessionId: activeSession.id });
    } else {
      // Se não há sessão ativa, criar uma nova
      const sessionData = {
        user_id: user.id,
        user_agent: userAgent,
        ip: ip,
        last_activity: new Date(last_activity).toISOString(),
        is_active: true,
        session_type: 'web',
        login_method: 'email',
        expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 horas
        device_info: {},
        geo_location: {},
        security_flags: {}
      };

      const { data: newSession, error: insertError } = await supabase
        .from('user_sessions')
        .insert(sessionData)
        .select('id')
        .single();

      if (insertError) {
        logger.error('Erro ao criar nova sessão:', insertError);
        return NextResponse.json(
          { error: 'Erro ao criar sessão' },
          { status: 500 }
        );
      }

      logger.debug(`Nova sessão criada: ${newSession.id}`);
      return NextResponse.json({ success: true, sessionId: newSession.id });
    }
  } catch (error) {
    logger.error('Erro na API de atualização de atividade:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}