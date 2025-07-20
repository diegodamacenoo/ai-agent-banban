import { createSupabaseServerClient } from '@/core/supabase/server';
import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';
import { type ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import { sanitizeText } from '@/features/security/server-side-sanitizer';
import { 
  generateDeviceFingerprint, 
  isKnownDevice, 
  registerKnownDevice,
  triggerSecurityAlert,
  getClientIP,
  getUserAgent
} from '@/shared/utils/security-detector';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? '/';
  
  console.debug('🔍 CALLBACK DEBUG - URL completa:', request.url);
  console.debug('🔍 CALLBACK DEBUG - Parâmetros:');
  console.debug('  - code:', code);
  console.debug('  - tokenHash:', tokenHash);
  console.debug('  - type:', type);
  console.debug('  - next:', next);
  console.debug('  - origin:', origin);
  
  // Iniciar com um response vazio - definiremos o redirect depois
  let response = NextResponse.next();

  const redirectToLogin = (message: string, error?: string) => {
    const url = new URL('/login', origin);
    url.searchParams.set('message', message);
    if (error) url.searchParams.set('error', error);
    response = NextResponse.redirect(url);
  };

  const redirectToLoginWithUnsafeMessage = (message: string, error?: string) => {
    const url = new URL('/login', origin);
    url.searchParams.set('message', sanitizeText(message));
    if (error) url.searchParams.set('error', error);
    response = NextResponse.redirect(url);
  };

  if (!code && !tokenHash) {
    redirectToLogin('CÃ³digo de autorizaÃ§Ã£o ou token nÃ£o encontrado.', 'missing_code');
    return response;
  }
  
  const supabase = await createSupabaseServerClient();
  let sessionData;

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      redirectToLoginWithUnsafeMessage(`Erro na autenticaÃ§Ã£o: ${error.message}`, 'auth_error');
      return response;
    }
    sessionData = data;
  } else if (tokenHash && type) {
    console.debug('🔑 VERIFICANDO TOKEN:');
    console.debug('  - tokenHash:', tokenHash);
    console.debug('  - type:', type);
    
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as any,
    });
    
    console.debug('📝 RESULTADO DA VERIFICAÇÃO:');
    console.debug('  - data:', data);
    console.debug('  - error:', error);
    
    if (error) {
      console.error('❌ ERRO NA VERIFICAÇÃO DO TOKEN:', error);
      redirectToLoginWithUnsafeMessage(`Erro na verificação do token: ${error.message}`, 'token_error');
      return response;
    }
    sessionData = data;
  }

  console.debug('👤 VERIFICANDO SESSÃO:');
  console.debug('  - sessionData:', sessionData);
  console.debug('  - user exists:', !!sessionData?.user);

  if (!sessionData?.user) {
    console.error('❌ USUÁRIO NÃO ENCONTRADO após autenticação');
    redirectToLogin('Usuário não encontrado após a autenticação.', 'no_user');
    return response;
  }

  const { user, session } = sessionData;
  console.debug('✅ SESSÃO CRIADA COM SUCESSO para usuário:', user.id);
  console.debug('📧 Email do usuário:', user.email);
  console.debug('🗂️ User metadata:', user.user_metadata);

  try {
    const deviceFingerprint = await generateDeviceFingerprint();
    const isInvite = type === 'invite';

    console.debug('🔍 DIAGNÓSTICO CALLBACK:');
    console.debug('- Type:', type);
    console.debug('- isInvite:', isInvite);
    console.debug('- User ID:', user.id);
    console.debug('- Next param:', next);

    if (isInvite) {
      console.debug('ðŸŽ‰ CONVITE DETECTADO! Processando...');
      await registerKnownDevice(user.id, deviceFingerprint, await getUserAgent() || undefined);
      
      const { data: existingProfile } = await supabase.from('profiles').select('id').eq('id', user.id).single();

      if (!existingProfile) {
        console.debug('ðŸ‘¤ CRIANDO PERFIL para usuÃ¡rio de convite:', user.id);
        const { error: profileError } = await supabase.from('profiles').insert({
          id: user.id,
          first_name: user.user_metadata?.first_name || '',
          last_name: user.user_metadata?.last_name || '',
          role: user.user_metadata?.role || 'reader',
          organization_id: user.user_metadata?.organization_id,
          status: 'active',
          is_setup_complete: false,
        });

        if (profileError) {
          console.error('âŒ ERRO AO CRIAR PERFIL:', profileError);
        } else {
          console.debug('âœ… PERFIL CRIADO COM SUCESSO!');
        }
      }
      
      console.debug('🚀 REDIRECIONANDO PARA SETUP-ACCOUNT...');
      const setupUrl = new URL('/setup-account', origin);
      setupUrl.searchParams.set('from', 'invite');
      console.debug('📍 URL de destino:', setupUrl.toString());
      
      // Tentar um redirect mais explícito
      return NextResponse.redirect(setupUrl, { status: 302 });
      
    } else {
      // LÃ³gica para usuÃ¡rios normais
      console.debug('âœ… USUÃRIO NORMAL, redirecionando para:', next);
      const nextUrl = new URL(next, origin);
      return NextResponse.redirect(nextUrl, { status: 302 });
    }
  } catch (e) {
    console.error('âŒ ERRO GERAL NO CALLBACK:', e);
    redirectToLogin('Ocorreu um erro inesperado.', 'unexpected_error');
    return response;
  }

  // Fallback - não deveria chegar aqui após os returns diretos
  return response;
} 
