import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getCachedUserProps } from "@/lib/auth/getUserData";
import { createSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SetupForm } from "./setup-form";
import { cookies } from "next/headers";

export default async function SetupPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const userData = await getCachedUserProps();

  if (!userData || !userData.email) {
    redirect('/login'); 
  }

  const errorMessage = searchParams?.error && typeof searchParams.error === 'string' 
    ? decodeURIComponent(searchParams.error) 
    : null;

  async function completeAccountSetup(formData: FormData) {
    'use server';

    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (!firstName || !lastName || !newPassword || !confirmPassword) {
        return redirect('/setup-account?error=' + encodeURIComponent('Todos os campos são obrigatórios.'));
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
      .eq('user_id', user.id);

    if (profileError) {
      console.error('Erro ao atualizar perfil:', profileError);
      return redirect('/setup-account?error=' + encodeURIComponent('Falha ao atualizar perfil: ' + profileError.message));
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
