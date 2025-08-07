import { type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/core/supabase/server';
import { createLogger } from '@/shared/utils/logger';
import { DEBUG_MODULES } from '@/shared/utils/debug-config';

const logger = createLogger(DEBUG_MODULES.AUTH);

interface DeviceInfo {
  browser?: string;
  os?: string;
  device_type?: 'desktop' | 'mobile' | 'tablet';
  screen_resolution?: string;
}

interface GeoLocation {
  country?: string;
  region?: string;
  city?: string;
  timezone?: string;
}

/**
 * Extrai informações do dispositivo a partir do User-Agent
 */
function parseDeviceInfo(userAgent: string): DeviceInfo {
  const info: DeviceInfo = {};

  // Detecção de navegador
  if (userAgent.includes('Chrome')) {
    info.browser = 'Chrome';
  } else if (userAgent.includes('Firefox')) {
    info.browser = 'Firefox';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    info.browser = 'Safari';
  } else if (userAgent.includes('Edge')) {
    info.browser = 'Edge';
  } else if (userAgent.includes('Opera')) {
    info.browser = 'Opera';
  }

  // Detecção de OS
  if (userAgent.includes('Windows')) {
    info.os = 'Windows';
  } else if (userAgent.includes('Mac')) {
    info.os = 'macOS';
  } else if (userAgent.includes('Linux')) {
    info.os = 'Linux';
  } else if (userAgent.includes('Android')) {
    info.os = 'Android';
  } else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    info.os = 'iOS';
  }

  // Detecção de tipo de dispositivo
  if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
    info.device_type = 'mobile';
  } else if (userAgent.includes('iPad') || userAgent.includes('Tablet')) {
    info.device_type = 'tablet';
  } else {
    info.device_type = 'desktop';
  }

  return info;
}

/**
 * Extrai informações de geolocalização a partir do IP e headers
 */
function extractGeoLocation(request: NextRequest): GeoLocation {
  const geo: GeoLocation = {};

  // Cloudflare headers (se usando Cloudflare)
  geo.country = request.headers.get('cf-ipcountry') || undefined;
  geo.region = request.headers.get('cf-region') || undefined;
  geo.city = request.headers.get('cf-ipcity') || undefined;
  geo.timezone = request.headers.get('cf-timezone') || undefined;

  // Vercel headers (se usando Vercel)
  if (!geo.country) {
    geo.country = request.headers.get('x-vercel-ip-country') || undefined;
    geo.region = request.headers.get('x-vercel-ip-region') || undefined;
    geo.city = request.headers.get('x-vercel-ip-city') || undefined;
    geo.timezone = request.headers.get('x-vercel-ip-timezone') || undefined;
  }

  return geo;
}

/**
 * Extrai o IP real do usuário
 */
function getClientIP(request: NextRequest): string | null {
  // Tentar vários headers em ordem de prioridade
  const ipHeaders = [
    'x-forwarded-for',
    'x-real-ip',
    'x-client-ip',
    'cf-connecting-ip',
    'x-vercel-forwarded-for'
  ];

  for (const header of ipHeaders) {
    const ip = request.headers.get(header);
    if (ip) {
      // x-forwarded-for pode conter múltiplos IPs, pegar o primeiro
      return ip.split(',')[0].trim();
    }
  }

  return request.ip || null;
}

/**
 * Registra ou atualiza a sessão do usuário no banco de dados
 */
export async function trackUserSession(request: NextRequest, userId: string, organizationId?: string): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();
    
    // NOVO: Verificar se o usuário está temporariamente bloqueado
    try {
      const { data: isBlocked } = await supabase
        .rpc('is_user_session_blocked', { check_user_id: userId });
      
      if (isBlocked) {
        logger.debug(`Usuário ${userId} está temporariamente bloqueado - não registrando atividade`);
        
        // Se está bloqueado, desativar todas as sessões ativas
        await supabase
          .from('user_sessions')
          .update({ 
            is_active: false,
            updated_at: new Date().toISOString(),
            security_flags: {
              ended_at: new Date().toISOString(),
              ended_reason: 'user_blocked'
            }
          })
          .eq('user_id', userId);
          
        return; // Não registrar atividade se estiver bloqueado
      }
    } catch (error) {
      logger.debug('Erro ao verificar bloqueio na sessão:', error);
      // Continuar com o tracking em caso de erro
    }
    
    const userAgent = request.headers.get('user-agent') || '';
    const ip = getClientIP(request);
    const deviceInfo = parseDeviceInfo(userAgent);
    const geoLocation = extractGeoLocation(request);

    // Determinar tipo de sessão baseado na rota
    let sessionType = 'web';
    if (request.nextUrl.pathname.startsWith('/api')) {
      sessionType = 'api';
    } else if (deviceInfo.device_type === 'mobile') {
      sessionType = 'mobile';
    }

    // Verificar se já existe uma sessão ativa recente (últimos 30 minutos)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    
    const { data: existingSession } = await supabase
      .from('user_sessions')
      .select('id, last_activity')
      .eq('user_id', userId)
      .eq('is_active', true)
      .gte('last_activity', thirtyMinutesAgo)
      .order('last_activity', { ascending: false })
      .limit(1)
      .single();

    const now = new Date().toISOString();

    if (existingSession) {
      // Atualizar sessão existente
      const { error: updateError } = await supabase
        .from('user_sessions')
        .update({
          last_activity: now,
          updated_at: now,
          device_info: deviceInfo,
          geo_location: geoLocation
        })
        .eq('id', existingSession.id);

      if (updateError) {
        logger.error('Erro ao atualizar sessão existente:', updateError);
      } else {
        logger.debug(`Sessão ${existingSession.id} atualizada para usuário ${userId}`);
      }
    } else {
      // Criar nova sessão
      const sessionData = {
        user_id: userId,
        user_agent: userAgent,
        ip: ip,
        device_info: deviceInfo,
        last_activity: now,
        is_active: true,
        session_type: sessionType,
        login_method: 'email', // Pode ser expandido para incluir outros métodos
        geo_location: geoLocation,
        organization_id: organizationId,
        expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 horas
        security_flags: {
          trusted_device: false,
          first_time_login: false
        },
        created_at: now,
        updated_at: now
      };

      const { data: newSession, error: insertError } = await supabase
        .from('user_sessions')
        .insert(sessionData)
        .select('id')
        .single();

      if (insertError) {
        logger.error('Erro ao criar nova sessão:', insertError);
      } else {
        logger.debug(`Nova sessão ${newSession.id} criada para usuário ${userId}`);
      }
    }

    // Limpar sessões antigas (mais de 24 horas inativas)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .eq('user_id', userId)
      .lt('last_activity', oneDayAgo);

  } catch (error) {
    logger.error('Erro no tracking de sessão:', error);
    // Não falhar o middleware por causa de erro de tracking
  }
}

/**
 * Marca uma sessão como inativa
 */
export async function deactivateUserSession(userId: string, sessionId?: string): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();

    if (sessionId) {
      // Desativar sessão específica
      await supabase
        .from('user_sessions')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .eq('user_id', userId);
    } else {
      // Desativar todas as sessões do usuário
      await supabase
        .from('user_sessions')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    }

    logger.debug(`Sessão(ões) desativada(s) para usuário ${userId}`);
  } catch (error) {
    logger.error('Erro ao desativar sessão:', error);
  }
}