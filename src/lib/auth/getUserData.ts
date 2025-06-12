import { cache } from 'react';
import { createSupabaseClient } from '@/lib/supabase/server'; // Atualizado para createSupabaseClient
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers'; // Importar cookies de next/headers

// Esta função será cacheada por requisição.
export const getCachedUserProps = cache(async () => {
  const cookieStore = await cookies(); // Adicionar await aqui
  const supabase = createSupabaseClient(cookieStore); // Passar cookieStore

  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData?.user) {
    // Se não estiver autenticado, redireciona para o login.
    // Isso interromperá a renderização dos componentes que chamam esta função.
    redirect('/login?message=Sessão inválida ou usuário não encontrado.');
  }

  // Buscar dados essenciais da tabela 'profiles' (campos específicos ao invés de *)
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('first_name, last_name, username, avatar_url')
    .eq('id', authData.user.id)
    .single();

  if (profileError) {
    // Logar o erro pode ser útil, mas não necessariamente redirecionar ou falhar
    // Pode ser que o perfil ainda não exista, o que pode ser um estado válido
    console.error('Erro ao buscar perfil do usuário:', profileError.message);
    // Dependendo da sua lógica de negócios, você pode querer lançar um erro ou lidar de outra forma
    // Por agora, continuaremos, e os campos do perfil estarão ausentes ou com valores padrão
  }

  const userEmail = authData.user.email || 'usuário@exemplo.com';
  const firstName = profileData?.first_name || // Usar o primeiro nome do perfil
                    authData.user.user_metadata?.first_name || // Ou do metadata se existir
                    userEmail.split('@')[0]; // Fallback para parte local do email

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
    // Mesclar outros dados do perfil, se houver
    // Certifique-se de que os nomes das colunas em 'profiles' sejam usados aqui
    // Exemplo: profileData?.username, profileData?.bio, etc.
    ...(profileData || {}), // Mescla todos os campos de profileData, se existir
  };
}); 