'use server';

import { createSupabaseServerClient } from '@/core/supabase/server';
import { recordMultipleConsents, type ConsentData } from "@/app/actions/consent/consent-manager";
import { redirect } from "next/navigation";
import { z } from 'zod';
import { recordConsent } from '@/app/actions/consent/consent-manager';

export type SetupFormState = {
  success: boolean;
  message: string;
  errors?: {
    firstName?: string[];
    lastName?: string[];
    newPassword?: string[];
    confirmPassword?: string[];
    termsConsent?: string[];
    privacyConsent?: string[];
  };
};

const setupSchema = z.object({
  firstName: z.string().min(1, 'O nome é obrigatório.'),
  lastName: z.string().min(1, 'O sobrenome é obrigatório.'),
  newPassword: z.string()
    .min(8, 'A senha deve ter pelo menos 8 caracteres.')
    .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula.')
    .regex(/[a-z]/, 'A senha deve conter pelo menos uma letra minúscula.')
    .regex(/\d/, 'A senha deve conter pelo menos um número.'),
  confirmPassword: z.string(),
  termsConsent: z.literal(true, {
    errorMap: () => ({ message: 'Você deve aceitar os Termos de Uso.' }),
  }),
  privacyConsent: z.literal(true, {
    errorMap: () => ({ message: 'Você deve aceitar a Política de Privacidade.' }),
  }),
  marketingConsent: z.boolean(),
  isFromInvite: z.boolean(),
  inviteId: z.string().optional(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"],
});


export async function completeAccountSetup(prevState: SetupFormState, formData: FormData): Promise<SetupFormState> {
  const supabase = await createSupabaseServerClient();

  const rawData = {
    firstName: formData.get('firstName') as string,
    lastName: formData.get('lastName') as string,
    newPassword: formData.get('newPassword') as string,
    confirmPassword: formData.get('confirmPassword') as string,
    termsConsent: formData.get('termsConsent') === 'on',
    privacyConsent: formData.get('privacyConsent') === 'on',
    marketingConsent: formData.get('marketingConsent') === 'on',
    isFromInvite: formData.get('fromInvite') === 'true',
    inviteId: formData.get('inviteId') as string,
  };
  
  // Convert boolean strings to booleans for validation
  const dataToValidate = {
    ...rawData,
    termsConsent: rawData.termsConsent,
    privacyConsent: rawData.privacyConsent,
  };

  const validation = setupSchema.safeParse(dataToValidate);

  if (!validation.success) {
    return {
      success: false,
      message: "Por favor, corrija os erros no formulário.",
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const {
    firstName,
    lastName,
    newPassword,
    marketingConsent,
    isFromInvite,
    inviteId
  } = validation.data;


  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.error("Erro: Usuário não encontrado na Server Action de setup.");
    return redirect('/login?error=user_not_found');
  }
  
  const { error: authError } = await supabase.auth.updateUser({ password: newPassword });

  if (authError) {
    console.error('Erro ao atualizar senha:', authError);
    let specificMessage = "Ocorreu um erro ao atualizar sua senha.";
      if (authError.message.includes("same as the new password")) {
        specificMessage = "A nova senha não pode ser igual à senha antiga.";
      } else if (authError.message.includes("Password should be different from the existing password")) {
        specificMessage = "A nova senha deve ser diferente da senha existente.";
      } else if (authError.message.includes("Password is too short")) {
        specificMessage = "A senha é muito curta.";
      }
    return { success: false, message: specificMessage, errors: {} };
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
    return { success: false, message: `Falha ao atualizar perfil: ${profileError.message}`, errors: {} };
  }

  // Se for de convite, marcar convite como aceito
  if (isFromInvite && inviteId) {
    const { error: inviteUpdateError } = await supabase
      .from('user_invites')
      .update({ 
        status: 'aceito',
        updated_at: new Date().toISOString()
      })
      .eq('id', inviteId);

    if (inviteUpdateError) {
      console.error('Erro ao atualizar status do convite:', inviteUpdateError);
      // Não bloquear o setup por isso
    }
  }

  // Registrar consentimentos
  const consents: ConsentData[] = [
    { consent_type: 'terms_of_service', version: '1.0', accepted: true },
    { consent_type: 'privacy_policy', version: '1.0', accepted: true },
  ];
  
  if (marketingConsent) {
    consents.push({
      consent_type: 'marketing_communications',
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

  // Os consentimentos já foram registrados via recordMultipleConsents acima

  redirect('/');
}

export async function handleSignOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  return redirect('/login?message=Logout realizado com sucesso.'); 
} 
