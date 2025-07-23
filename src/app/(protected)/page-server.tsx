import { createSupabaseServerClient } from '@/core/supabase/server';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Se não tem usuário, redirecionar para login
  if (!user) {
    redirect('/auth/login');
    return;
  }

  // Buscar apenas o role do usuário para simplificar
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_setup_complete')
    .eq('id', user.id)
    .single();

  // Se não tem perfil, redirecionar para setup
  if (!profile) {
    redirect('/setup-account');
    return;
  }

  // Se setup não foi completado, redirecionar para setup
  if (!profile.is_setup_complete) {
    redirect('/setup-account');
    return;
  }

  // Se é master_admin, redirecionar para admin
  if (profile.role === 'master_admin') {
    redirect('/admin');
    return;
  }

  // Para outros casos, redirecionar para admin também (temporariamente)
  redirect('/admin');
}