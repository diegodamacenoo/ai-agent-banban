'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/core/supabase/client';

interface UserInfo {
  id: string;
  email?: string;
  organizations?: Array<{
    company_legal_name: string;
    company_trading_name: string;
  }>;
  is_setup_complete?: boolean;
  debug?: {
    profileData?: any;
    error?: any;
    connectivity?: any;
  };
}

export default function TestSubdomainPage() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState('');
  const [expectedSubdomain, setExpectedSubdomain] = useState('');
  const [connectivityInfo, setConnectivityInfo] = useState<any>(null);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    setCurrentUrl(window.location.href);
    
    async function fetchUserInfo() {
      try {
        setLoading(true);
        setError(null);

        // Debug: Verificar variáveis de ambiente
        console.debug('=== DEBUG ENVIRONMENT VARIABLES ===');
        console.debug('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
        console.debug('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'DEFINED' : 'UNDEFINED');
        console.debug('URL length:', process.env.NEXT_PUBLIC_SUPABASE_URL?.length);
        console.debug('Key length:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length);
        
        // Testar conectividade primeiro
        console.debug('=== TESTING CONNECTIVITY ===');
        const { checkSupabaseConnectivity } = await import('@/core/supabase/auth-helpers');
        const connectivity = await checkSupabaseConnectivity();
        setConnectivityInfo(connectivity);
        console.debug('Connectivity:', connectivity);
        
        // Usar helper robusto para obter usuário
        console.debug('=== USING ROBUST USER HELPER ===');
        const { getUserWithOfflineFallback } = await import('@/core/supabase/auth-helpers');
        const { user, error: userError } = await getUserWithOfflineFallback();
        
        if (userError) {
          console.error('❌ Erro ao obter usuário:', userError);
          setError(userError);
          return;
        }
        
        if (!user) {
          console.debug('👤 Usuário não autenticado');
          setUserInfo({
            id: 'not-authenticated',
            email: 'Not authenticated',
            organizations: [],
            is_setup_complete: false
          });
          return;
        }

        console.debug('✅ Usuário autenticado:', user.id);
        
        // Buscar dados da organização
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select(`
            *,
            organizations!profiles_organization_id_fkey(
              company_legal_name,
              company_trading_name
            )
          `)
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('❌ Erro ao buscar perfil:', profileError);
          setError(`Erro ao buscar perfil: ${profileError.message}`);
          return;
        }

        const userInfo: UserInfo = {
          id: user.id,
          email: user.email || 'N/A',
          organizations: profile?.organizations ? [profile.organizations] : [],
          is_setup_complete: profile?.is_setup_complete || false,
          debug: {
            profileData: profile,
            connectivity: connectivity
          }
        };

        setUserInfo(userInfo);
        
        // Calcular subdomínio esperado
        if (profile?.organizations?.company_trading_name) {
          const subdomain = profile.organizations.company_trading_name
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
          setExpectedSubdomain(subdomain);
        }

      } catch (err: any) {
        console.error('❌ Erro inesperado:', err);
        setError(`Erro inesperado: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }

    fetchUserInfo();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-red-800">❌ Erro</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">🧪 Teste de Redirecionamento de Subdomínio</h1>
      
      <div className="grid gap-6">
        {/* Informações da URL Atual */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">📍 URL Atual</h2>
          <p className="font-mono text-sm bg-white p-3 rounded border">
            {currentUrl}
          </p>
        </div>

        {/* Informações do Usuário */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-green-800">👤 Informações do Usuário</h2>
          {userInfo ? (
            <div className="space-y-3">
              <p><strong>ID:</strong> <span className="font-mono text-sm">{userInfo.id}</span></p>
              <p><strong>Email:</strong> {userInfo.email || 'N/A'}</p>
              <p><strong>Setup Completo:</strong> {userInfo.is_setup_complete ? '✅ Sim' : '❌ Não'}</p>
              
              {userInfo.organizations && userInfo.organizations.length > 0 ? (
                <div>
                  <strong>Organização:</strong>
                  <ul className="mt-2 space-y-1">
                    {userInfo.organizations.map((org, index) => (
                      <li key={index} className="bg-white p-3 rounded border">
                        <p><strong>Nome Legal:</strong> {org.company_legal_name}</p>
                        <p><strong>Nome Fantasia:</strong> {org.company_trading_name}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-yellow-600">⚠️ Nenhuma organização encontrada</p>
              )}

              {userInfo.debug && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-gray-600">
                    📝 Informações de Debug (clique para expandir)
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 rounded text-xs">
                    <pre>{JSON.stringify(userInfo.debug, null, 2)}</pre>
                  </div>
                </details>
              )}
            </div>
          ) : (
            <p className="text-red-600">❌ Usuário não autenticado</p>
          )}
        </div>

        {/* Subdomínio Esperado */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-yellow-800">🎯 Subdomínio Esperado</h2>
          <p className="font-mono text-sm bg-white p-3 rounded border">
            http://{expectedSubdomain || 'Calculando...'}
          </p>

          {expectedSubdomain && expectedSubdomain !== window.location.hostname && (
            <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded">
              <p className="text-red-700">
                ⚠️ <strong>Problema detectado:</strong> Você deveria estar em <code>{expectedSubdomain}</code> 
                mas está em <code>{window.location.hostname}:{window.location.port}</code>
              </p>
            </div>
          )}
        </div>

        {/* Teste Manual */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-purple-800">🔧 Teste Manual</h2>
          <p className="mb-4">Para testar o redirecionamento:</p>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Faça logout do sistema</li>
            <li>Acesse <code className="bg-white px-2 py-1 rounded">http://localhost:3000</code></li>
            <li>Faça login novamente</li>
            <li>O sistema deveria redirecionar automaticamente para o subdomínio correto</li>
          </ol>
          
          {expectedSubdomain && expectedSubdomain !== 'localhost:3000 (sem organização)' && (
            <div className="mt-4">
              <a 
                href={`http://${expectedSubdomain}`}
                className="inline-block bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors"
              >
                🚀 Ir para o subdomínio correto
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
