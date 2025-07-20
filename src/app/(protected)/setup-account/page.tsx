import { createSupabaseServerClient } from '@/core/supabase/server';
import { redirect } from "next/navigation";
import { SetupForm } from "./setup-form";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SetupPage({ searchParams }: PageProps) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Aguardando searchParams como Promise
  const params = await searchParams;
  const fromParam = params.from as string | undefined;
  const fromInvite = fromParam === 'invite';
  let inviteData = null;

  // Se vier de convite, buscar dados do convite
  if (fromInvite && user.email) {
    const { data: invite } = await supabase
      .from('user_invites')
      .select('id, email, role, organization_id, user_id, organization(id, name, slug)')
      .eq('email', user.email)
      .single();

    if (invite) {
      inviteData = invite;
    }
  }

  return (
    <SetupForm
      userEmail={user.email || ''}
      userName={user.user_metadata?.full_name || user.email?.split('@')[0] || ''}
      fromInvite={fromInvite}
      inviteData={inviteData}
      userMetadata={user.user_metadata}
    />
  );
}
