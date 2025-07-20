import { createSupabaseServerClient } from '@/core/supabase/server';
import { unstable_cache } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

// Função auxiliar que faz o trabalho real de buscar os dados do usuário
async function getUserPropsInternal(supabase: any) {
  // Usar getUser() ao invés de getSession() para maior segurança
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData?.user) {
    // Se não estiver autenticado, redireciona para o login.
    // Isso interromperá a renderização dos componentes que chamam esta função.
    redirect('/login?message=Sessão inválida ou usuário não encontrado.');
  }

  // Buscar dados essenciais da tabela 'profiles' (usando abordagem mais robusta)
  const { data: profileDataArray, error: profileError } = await supabase
    .from('profiles')
    .select('first_name, last_name, username, avatar_url, organization_id, role')
    .eq('id', authData.user.id)
    .limit(1);

  let profileData = null;
  if (profileError) {
    console.error('Erro ao buscar perfil do usuário:', profileError.message);
  } else if (profileDataArray && profileDataArray.length > 0) {
    profileData = profileDataArray[0];
    // Se há múltiplos perfis, logar o problema
    if (profileDataArray.length > 1) {
      console.warn(`Múltiplos perfis encontrados para usuário ${authData.user.id}. Usando o primeiro. Total: ${profileDataArray.length}`);
    }
  } else {
    console.warn(`Nenhum perfil encontrado para usuário ${authData.user.id}`);
  }

  // Se tiver organization_id, buscar dados da organização
  let organizationData = null;
  if (profileData?.organization_id) {
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('company_legal_name, company_trading_name')
      .eq('id', profileData.organization_id)
      .single();
    
    if (!orgError && org) {
      organizationData = org;
    }
  }

  const userEmail = authData.user.email || 'usuário@exemplo.com';
  const firstName = profileData?.first_name || // Usar o primeiro nome do perfil
                    authData.user.user_metadata?.first_name || // Ou do metadata se existir
                    userEmail.split('@')[0];

  const fullName = profileData?.first_name && profileData?.last_name 
                   ? `${profileData.first_name} ${profileData.last_name}` 
                   : profileData?.username || // Ou usar username do perfil
                   authData.user.user_metadata?.full_name || 
                   authData.user.user_metadata?.name || 
                   userEmail.split('@')[0];

  const userAvatar = profileData?.avatar_url || // Priorizar avatar do perfil
                     authData.user.user_metadata?.avatar_url || ''; 

  return {
    id: authData.user.id,
    email: userEmail,
    firstName,
    fullName,
    name: fullName, // Adicionando name para consistência com o que SetupForm espera para userName
    user_metadata: authData.user.user_metadata, // Passando user_metadata para page.tsx
    avatar: userAvatar,
    organization_id: profileData?.organization_id,
    role: profileData?.role,
    organization: organizationData,
    // Mesclar outros dados do perfil, se houver
    // Certifique-se de que os nomes das colunas em 'profiles' sejam usados aqui
    // Exemplo: profileData?.username, profileData?.bio, etc.
    ...(profileData || {}), // Mescla todos os campos de profileData, se existir
  };
}

// Esta função será cacheada por requisição.
export const getCachedUserProps = async () => {
  const supabase = await createSupabaseServerClient();
  
  // Função cacheada que recebe o cliente Supabase como parâmetro
  const getCachedProps = unstable_cache(
    async () => getUserPropsInternal(supabase),
    ['user-props'],
    { revalidate: 60 } // Cache por 60 segundos
  );

  return getCachedProps();
};
