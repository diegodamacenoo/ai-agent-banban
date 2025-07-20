'use client';

import * as React from "react";
import { useEffect } from "react";
import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { AlertCircle } from "lucide-react";
import { Checkbox } from "@/shared/ui/checkbox";
import { completeAccountSetup, handleSignOut, type SetupFormState } from './actions';
import { PasswordInput } from "@/shared/ui/password-input";

interface SetupFormProps {
  userEmail: string;
  userName?: string | null;
  fromInvite?: boolean;
  inviteData?: any;
  userMetadata?: { [key: string]: any };
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Finalizando...' : 'Finalizar Configuração'}
    </Button>
  );
}


export function SetupForm({
  userEmail,
  userName,
  fromInvite = false,
  inviteData,
  userMetadata,
}: SetupFormProps) {
  const initialState: SetupFormState = { success: false, message: '', errors: {} };
  const [state, dispatch] = useActionState(completeAccountSetup, initialState);

  const initialFirstName = userMetadata?.first_name || '';
  const initialLastName = userMetadata?.last_name || '';
  
  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">
          {fromInvite ? 'Bem-vindo! Configure sua conta' : 'Configuração da conta'}
        </h1>
        <p className="text-muted-foreground">
          {fromInvite && inviteData ? (
            <>Você foi convidado para se juntar à <strong>{inviteData.organizations?.company_trading_name || inviteData.organizations?.company_legal_name}</strong> como <strong>{inviteData.role}</strong>.</>
          ) : (
            'Complete a configuração da sua conta para continuar.'
          )}
        </p>
      </div>

      {state.message && !state.success && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro na configuração</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Informações da Conta</CardTitle>
          <CardDescription>
            {fromInvite ? 'Configure sua senha e complete seus dados pessoais.' : 'Complete suas informações pessoais e defina uma senha.'}
          </CardDescription>
        </CardHeader>
        <form action={dispatch}>
          <CardContent className="space-y-4">
            {fromInvite && (
              <>
                <input type="hidden" name="fromInvite" value="true" />
                <input type="hidden" name="inviteId" value={inviteData?.id || ''} />
              </>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" value={userEmail} disabled className="bg-muted" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nome</Label>
                <Input id="firstName" name="firstName" placeholder="Seu nome" type="text" defaultValue={initialFirstName} required />
                {state.errors?.firstName && <p className="text-sm font-medium text-destructive">{state.errors.firstName.join(', ')}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Sobrenome</Label>
                <Input id="lastName" name="lastName" placeholder="Seu sobrenome" type="text" defaultValue={initialLastName} required />
                {state.errors?.lastName && <p className="text-sm font-medium text-destructive">{state.errors.lastName.join(', ')}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <PasswordInput id="newPassword" name="newPassword" placeholder="Digite sua nova senha" required />
              <p className="text-[0.8rem] text-muted-foreground">
                Mínimo 8 caracteres, com maiúsculas, minúsculas e números.
              </p>
              {state.errors?.newPassword && <p className="text-sm font-medium text-destructive">{state.errors.newPassword.join(', ')}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <PasswordInput id="confirmPassword" name="confirmPassword" placeholder="Confirme sua nova senha" required />
              {state.errors?.confirmPassword && <p className="text-sm font-medium text-destructive">{state.errors.confirmPassword.join(', ')}</p>}
            </div>

            <div className="space-y-2 pt-4">
                <div className="items-top flex space-x-2">
                  <Checkbox id="termsConsent" name="termsConsent" required />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="termsConsent"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Eu li e aceito os <Link href="/terms" className="underline">Termos de Uso</Link>
                    </label>
                  </div>
                </div>
                {state.errors?.termsConsent && <p className="text-sm font-medium text-destructive">{state.errors.termsConsent.join(', ')}</p>}
            </div>
            
            <div className="space-y-2">
                <div className="items-top flex space-x-2">
                  <Checkbox id="privacyConsent" name="privacyConsent" required />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="privacyConsent"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Eu li e aceito a <Link href="/privacy" className="underline">Política de Privacidade</Link>
                    </label>
                  </div>
                </div>
                {state.errors?.privacyConsent && <p className="text-sm font-medium text-destructive">{state.errors.privacyConsent.join(', ')}</p>}
            </div>

            <div className="space-y-2">
                <div className="items-top flex space-x-2">
                  <Checkbox id="marketingConsent" name="marketingConsent" />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="marketingConsent"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Eu gostaria de receber e-mails sobre novidades e promoções
                    </label>
                  </div>
                </div>
            </div>

          </CardContent>
          <CardFooter className="flex-col items-stretch gap-4 pt-6">
            <SubmitButton />
          </CardFooter>
        </form>
        <form action={handleSignOut} className="flex justify-center pt-4 w-full">
            <Button variant="link" className="p-0 h-auto" type="submit">
              Sair e fazer login
            </Button>
        </form>
      </Card>
    </div>
  );
} 
