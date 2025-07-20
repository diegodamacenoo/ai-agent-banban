import { headers } from 'next/headers';
import { createSupabaseServerClient } from '@/core/supabase/server';

interface RequestInfo {
  ipAddress: string;
  userAgent: string;
  organizationId?: string;
}

/**
 * Captura informações da requisição atual
 */
export async function captureRequestInfo(userId: string): Promise<RequestInfo> {
  const headersList = await headers();
  
  // Capturar IP de vários headers possíveis
  let ipAddress = '127.0.0.1';
  try {
    const forwardedFor = headersList.get('x-forwarded-for');
    if (forwardedFor) {
      ipAddress = forwardedFor.split(',')[0].trim();
    } else {
      const realIp = headersList.get('x-real-ip');
      if (realIp) {
        ipAddress = realIp;
      } else {
        const cfIp = headersList.get('cf-connecting-ip');
        if (cfIp) {
          ipAddress = cfIp;
        }
      }
    }
  } catch (error) {
    console.warn('Erro ao capturar IP:', error);
  }

  // Capturar User-Agent
  let userAgent = 'Unknown';
  try {
    const ua = headersList.get('user-agent');
    if (ua) {
      userAgent = ua;
    }
  } catch (error) {
    console.warn('Erro ao capturar User-Agent:', error);
  }

  let organizationId: string | undefined;

  if (userId) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('organization_id')
        .eq('id', userId)
        .single();

      organizationId = profile?.organization_id;
    } catch (error) {
      console.warn('Erro ao buscar organization_id:', error);
    }
  }

  return {
    ipAddress,
    userAgent,
    organizationId
  };
} 