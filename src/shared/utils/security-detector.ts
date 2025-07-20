import { headers } from 'next/headers';
import crypto from 'crypto';
import { UAParser } from 'ua-parser-js';
import { type NextRequest } from 'next/server';
import { createHash } from 'crypto';

interface SecurityAlertData {
  type: 'new_device' | 'unusual_activity' | 'password_reset' | 'failed_login';
  user_id: string;
  user_email: string;
  ip_address?: string;
  user_agent?: string;
  device_fingerprint?: string;
  details?: Record<string, any>;
}

// Função para gerar fingerprint do dispositivo baseado em headers HTTP
export async function generateDeviceFingerprint(): Promise<string> {
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || 'desconhecido';
  const acceptLanguage = headersList.get('accept-language') || 'desconhecido';
  const ip = await getClientIP() || 'desconhecido';

  const source = `${userAgent}${acceptLanguage}${ip}`;
  return createHash('sha256').update(source).digest('hex');
}

// Função para obter IP do cliente
export async function getClientIP(): Promise<string | null> {
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for')?.split(',')[0] || 
             headersList.get('x-real-ip') ||
             headersList.get('cf-connecting-ip') || // Cloudflare
             null;
  return ip;
}

// Função para obter user agent
export async function getUserAgent(): Promise<string | null> {
  const headersList = await headers();
  return headersList.get('user-agent');
}

// Função para chamar a Edge Function de alertas de segurança
export async function triggerSecurityAlert(alertData: SecurityAlertData): Promise<void> {
  // Implementação do alerta
}

// Função para verificar se é um dispositivo conhecido
export async function isKnownDevice(
  userId: string,
  deviceFingerprint: string
): Promise<boolean> {
  try {
    const { createSupabaseAdminClient } = await import('@/core/supabase/server');
    const supabase = await createSupabaseAdminClient();
    
    const { data, error } = await supabase
      .from('user_known_devices')
      .select('id')
      .eq('user_id', userId)
      .eq('device_fingerprint', deviceFingerprint)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao verificar dispositivo conhecido:', error);
      return false; // Tratar erro como dispositivo não conhecido por segurança
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
    const { createSupabaseAdminClient } = await import('@/core/supabase/server');
    const supabase = await createSupabaseAdminClient();
    
    const { error } = await supabase
      .from('user_known_devices')
      .upsert(
        { user_id: userId, device_fingerprint: deviceFingerprint, user_agent: userAgent, last_seen_at: new Date().toISOString() },
        { onConflict: 'user_id, device_fingerprint' }
      );
      
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
  const { createSupabaseAdminClient } = await import('@/core/supabase/server');
  const supabase = await createSupabaseAdminClient();
  
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
}

// Função para registrar tentativa de login
export async function logLoginAttempt(
  email: string,
  userId: string | null,
  success: boolean,
  failureReason?: string,
  deviceFingerprint?: string
): Promise<void> {
  const { createSupabaseAdminClient } = await import('@/core/supabase/server');
  const supabase = await createSupabaseAdminClient();
  
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
}

export async function recordConsent(
  userId: string,
  consentType: string,
  version: string,
  isAccepted: boolean
) {
      // Implementação do consentimento
}

export async function isRateLimited(
  identifier: string,
  limit: number = 5,
  timeWindowMinutes: number = 15
): Promise<boolean> {
  const count = await countRecentLoginAttempts(identifier, timeWindowMinutes);
  return count >= limit;
}

export async function countRecentLoginAttempts(
  userId: string,
  timeWindowMinutes: number = 15
): Promise<number> {
  try {
    const { createSupabaseAdminClient } = await import('@/core/supabase/server');
    const supabase = await createSupabaseAdminClient();
    
    const timeLimit = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
    
    const { count, error } = await supabase
      .from('user_login_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('timestamp', timeLimit.toISOString());
      
    if (error) {
      console.error('Erro ao contar tentativas de login:', error);
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    console.error('Erro inesperado ao contar tentativas:', error);
    return 0;
  }
}

export async function recordLoginAttempt(
  userId: string,
  isSuccess: boolean,
  deviceFingerprint?: string
): Promise<void> {
  try {
    const { createSupabaseAdminClient } = await import('@/core/supabase/server');
    const supabase = await createSupabaseAdminClient();
    
    const ipAddress = await getClientIP();
    
    await supabase.from('user_login_attempts').insert({
      user_id: userId,
      ip_address: ipAddress,
      is_success: isSuccess,
      user_agent: await getUserAgent(),
      device_fingerprint: deviceFingerprint
    });
      
  } catch (error) {
    console.error('Erro ao registrar tentativa de login:', error);
  }
} 
