import * as React from "react"
import { getCachedUserProps } from "@/lib/auth/getUserData";
import { createSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SetupForm } from "./setup-form";
import { cookies } from "next/headers";
import { recordMultipleConsents, type ConsentData } from "@/app/actions/consent/consent-manager";

export default async function SetupPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const userData = await getCachedUserProps();

  if (!userData || !userData.email) {
    redirect('/login'); 
  }

  const params = await searchParams;
  const errorMessage = params?.error && typeof params.error === 'string' 
    ? decodeURIComponent(params.error) 
    : null;

  async function completeAccountSetup(formData: FormData) {
    'use server';

    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    const termsConsent = formData.get('termsConsent') === 'true';
    const privacyConsent = formData.get('privacyConsent') === 'true';
    const marketingConsent = formData.get('marketingConsent') === 'true';

    if (!firstName || !lastName || !newPassword || !confirmPassword) {
        return redirect('/setup-account?error=' + encodeURIComponent('Todos os campos são obrigatórios.'));
    }

    if (!termsConsent || !privacyConsent) {
        return redirect('/setup-account?error=' + encodeURIComponent('Você deve aceitar os Termos de Uso e a Política de Privacidade para continuar.'));
    }

    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);
    
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error("Erro: Usuário não encontrado na Server Action de setup.");
      return redirect('/login?error=user_not_found');
    }

    if (newPassword !== confirmPassword) {
      return redirect('/setup-account?error=' + encodeURIComponent('As senhas não coincidem.'));
    }
    if (newPassword.length < 8 || 
        !/[A-Z]/.test(newPassword) || 
        !/[a-z]/.test(newPassword) || 
        !/\d/.test(newPassword)) {
      return redirect('/setup-account?error=' + encodeURIComponent('A senha não atende aos critérios de complexidade.'));
    }

    const { error: authError } = await supabase.auth.updateUser({ password: newPassword });

    if (authError) {
      console.error('Erro ao atualizar senha:', authError);
      let specificMessage = authError.message;
      if (authError.message.includes("same as the new password")) {
        specificMessage = "A nova senha não pode ser igual à senha antiga.";
      } else if (authError.message.includes("Password should be different from the existing password")) {
        specificMessage = "A nova senha deve ser diferente da senha existente.";
      } else if (authError.message.includes("Password is too short")) {
        specificMessage = "A senha é muito curta.";
      }
      return redirect('/setup-account?error=' + encodeURIComponent('Falha ao atualizar senha: ' + specificMessage));
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        first_name: firstName,
        last_name: lastName,
        is_setup_complete: true,
      })
      .eq('id', user.id);

    if (profileError) {
      console.error('Erro ao atualizar perfil:', profileError);
      return redirect('/setup-account?error=' + encodeURIComponent('Falha ao atualizar perfil: ' + profileError.message));
    }

    // Registrar consentimentos
    const consents: ConsentData[] = [];
    
    if (termsConsent) {
      consents.push({
        consent_type: 'terms_of_service',
        version: '1.0',
        accepted: true
      });
    }
    
    if (privacyConsent) {
      consents.push({
        consent_type: 'privacy_policy',
        version: '1.0',
        accepted: true
      });
    }
    
    if (marketingConsent) {
      consents.push({
        consent_type: 'marketing',
        version: '1.0',
        accepted: true
      });
    }

    if (consents.length > 0) {
      const consentResult = await recordMultipleConsents(consents);
      if (!consentResult.success) {
        console.error('Erro ao registrar consentimentos:', consentResult.error);
        // Não bloquear o setup por erro de consentimento, mas logar
      }
    }

    return redirect('/dashboard');
  }

  // Nova Server Action para Logout
  async function handleSignOut() {
    'use server';
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);
    await supabase.auth.signOut();
    // Adicionar uma mensagem para o usuário saber que o logout foi efetuado pode ser bom
    return redirect('/login?message=Logout realizado com sucesso.'); 
  }

  return (
    <SetupForm
      userEmail={userData.email}
      userName={userData.name}
      initialFirstName={userData.user_metadata?.first_name}
      initialLastName={userData.user_metadata?.last_name}
      serverAction={completeAccountSetup}
      signOutAction={handleSignOut}
      errorMessage={errorMessage}
    />
  )
}
