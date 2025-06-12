import { createSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';
import { type ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import { 
  generateDeviceFingerprint, 
  isKnownDevice, 
  registerKnownDevice,
  triggerSecurityAlert,
  getClientIP,
  getUserAgent
} from '@/lib/utils/security-detector';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // se "next" estiver presente, use-o como o caminho de redirecionamento
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = createSupabaseClient(request.cookies as unknown as ReadonlyRequestCookies); // Usa o server client que lê cookies da requisição
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.user) {
      try {
        // Gerar fingerprint do dispositivo
        const deviceFingerprint = await generateDeviceFingerprint();
        const userAgent = await getUserAgent();
        const ipAddress = await getClientIP();
        
        // Verificar se é um dispositivo conhecido
        const isKnown = await isKnownDevice(data.user.id, deviceFingerprint);
        
        if (!isKnown) {
          // Dispositivo novo - registrar como conhecido
          await registerKnownDevice(data.user.id, deviceFingerprint, userAgent || undefined);
          
          // Disparar alerta de novo dispositivo
          await triggerSecurityAlert({
            type: 'new_device',
            user_id: data.user.id,
            user_email: data.user.email || '',
            ip_address: ipAddress || undefined,
            user_agent: userAgent || undefined,
            device_fingerprint: deviceFingerprint
          });
          
          console.log('Novo dispositivo detectado e registrado para usuário:', data.user.id);
        } else {
          // Dispositivo conhecido - apenas atualizar last_seen_at
          await registerKnownDevice(data.user.id, deviceFingerprint, userAgent || undefined);
          console.log('Dispositivo conhecido, updated last_seen_at para usuário:', data.user.id);
        }
      } catch (securityError) {
        console.error('Erro ao processar detecção de dispositivo:', securityError);
        // Não bloquear o login por erro de segurança
      }
      
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error('Auth callback error exchanging code:', error);
  } else {
    console.error('Auth callback: No code found in search params');
  }

  // retornar para uma página de erro ou login em caso de falha
  const redirectUrl = new URL('/login', origin);
  redirectUrl.searchParams.set('error', 'auth_callback_error');
  redirectUrl.searchParams.set('message', 'Falha no callback de autenticação.');
  return NextResponse.redirect(redirectUrl);
} 