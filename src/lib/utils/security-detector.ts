import { headers } from 'next/headers';
import crypto from 'crypto';

// Função para gerar fingerprint do dispositivo baseado em headers HTTP
export async function generateDeviceFingerprint(): Promise<string> {
  const headersList = await headers();
  
  const userAgent = headersList.get('user-agent') || '';
  const acceptLanguage = headersList.get('accept-language') || '';
  const acceptEncoding = headersList.get('accept-encoding') || '';
  const xForwardedFor = headersList.get('x-forwarded-for') || '';
  
  // Combinar headers relevantes para criar fingerprint único
  const fingerprintData = [
    userAgent,
    acceptLanguage,
    acceptEncoding,
    xForwardedFor
  ].join('|');
  
  return crypto
    .createHash('sha256')
    .update(fingerprintData)
    .digest('hex');
}

// Função para obter IP do cliente
export async function getClientIP(): Promise<string | null> {
  const headersList = await headers();
  
  // Tentar diferentes headers para obter o IP real
  const xForwardedFor = headersList.get('x-forwarded-for');
  const xRealIP = headersList.get('x-real-ip');
  const xClientIP = headersList.get('x-client-ip');
  
  if (xForwardedFor) {
    // x-forwarded-for pode conter múltiplos IPs separados por vírgula
    return xForwardedFor.split(',')[0].trim();
  }
  
  if (xRealIP) {
    return xRealIP;
  }
  
  if (xClientIP) {
    return xClientIP;
  }
  
  return null;
}

// Função para obter user agent
export async function getUserAgent(): Promise<string | null> {
  const headersList = await headers();
  return headersList.get('user-agent');
}

// Função para chamar a Edge Function de alertas de segurança
export async function triggerSecurityAlert(event: {
  type: 'new_device' | 'failed_attempts' | 'user_deletion';
  user_id: string;
  user_email: string;
  ip_address?: string;
  user_agent?: string;
  device_fingerprint?: string;
  details?: Record<string, any>;
}): Promise<boolean> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/security-alerts`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({
          ...event,
          timestamp: new Date().toISOString()
        })
      }
    );
    
    if (!response.ok) {
      console.error('Erro ao acionar alerta de segurança:', await response.text());
      return false;
    }
    
    console.log('Alerta de segurança acionado com sucesso:', event.type);
    return true;
  } catch (error) {
    console.error('Erro inesperado ao acionar alerta:', error);
    return false;
  }
}

// Função para verificar se é um dispositivo conhecido
export async function isKnownDevice(
  userId: string, 
  deviceFingerprint: string
): Promise<boolean> {
  try {
    const { createSupabaseAdminClient } = await import('@/lib/supabase/server');
    const { cookies } = await import('next/headers');
    
    const cookieStore = await cookies();
    const supabase = createSupabaseAdminClient(cookieStore);
    
    const { data, error } = await supabase
      .from('user_known_devices')
      .select('id')
      .eq('user_id', userId)
      .eq('device_fingerprint', deviceFingerprint)
      .eq('is_trusted', true)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao verificar dispositivo conhecido:', error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('Erro inesperado ao verificar dispositivo:', error);
    return false;
  }
}

// Função para registrar novo dispositivo conhecido
export async function registerKnownDevice(
  userId: string, 
  deviceFingerprint: string, 
  userAgent?: string
): Promise<boolean> {
  try {
    const { createSupabaseAdminClient } = await import('@/lib/supabase/server');
    const { cookies } = await import('next/headers');
    
    const cookieStore = await cookies();
    const supabase = createSupabaseAdminClient(cookieStore);
    
    const { error } = await supabase
      .from('user_known_devices')
      .upsert({
        user_id: userId,
        device_fingerprint: deviceFingerprint,
        user_agent: userAgent,
        last_seen_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,device_fingerprint'
      });
    
    if (error) {
      console.error('Erro ao registrar dispositivo conhecido:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erro inesperado ao registrar dispositivo:', error);
    return false;
  }
}

// Função para contar tentativas de login falhadas recentes
export async function countRecentFailedAttempts(
  email: string, 
  timeWindowMinutes: number = 15
): Promise<number> {
  try {
    const { createSupabaseAdminClient } = await import('@/lib/supabase/server');
    const { cookies } = await import('next/headers');
    
    const cookieStore = await cookies();
    const supabase = createSupabaseAdminClient(cookieStore);
    
    const timeLimit = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
    
    const { count, error } = await supabase
      .from('login_attempt_history')
      .select('*', { count: 'exact', head: true })
      .eq('email', email)
      .eq('success', false)
      .gte('attempted_at', timeLimit.toISOString());
    
    if (error) {
      console.error('Erro ao contar tentativas falhadas:', error);
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    console.error('Erro inesperado ao contar tentativas:', error);
    return 0;
  }
}

// Função para registrar tentativa de login
export async function logLoginAttempt(
  email: string,
  userId: string | null,
  success: boolean,
  failureReason?: string,
  deviceFingerprint?: string
): Promise<void> {
  try {
    const { createSupabaseAdminClient } = await import('@/lib/supabase/server');
    const { cookies } = await import('next/headers');
    
    const cookieStore = await cookies();
    const supabase = createSupabaseAdminClient(cookieStore);
    
    const ipAddress = await getClientIP();
    const userAgent = await getUserAgent();
    
    await supabase
      .from('login_attempt_history')
      .insert({
        user_id: userId,
        email,
        ip_address: ipAddress,
        user_agent: userAgent,
        success,
        failure_reason: failureReason,
        device_fingerprint: deviceFingerprint
      });
      
  } catch (error) {
    console.error('Erro ao registrar tentativa de login:', error);
  }
} 