'use client';

import * as React from "react";
import { useState, useEffect } from "react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

type PasswordStatus = "neutral" | "valid" | "invalid";

interface SetupFormProps {
  userEmail: string;
  userName?: string | null;
  initialFirstName?: string | null;
  initialLastName?: string | null;
  serverAction: (formData: FormData) => Promise<void>;
  signOutAction: () => Promise<void>;
  errorMessage?: string | null;
}

const checkPasswordStrength = (password: string): boolean => {
  if (password.length === 0) return true;
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  return hasMinLength && hasUpperCase && hasLowerCase && hasNumber;
};

export function SetupForm({
  userEmail,
  userName,
  initialFirstName,
  initialLastName,
  serverAction,
  signOutAction,
  errorMessage,
}: SetupFormProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPasswordStatus, setNewPasswordStatus] = useState<PasswordStatus>("neutral");
  const [confirmPasswordStatus, setConfirmPasswordStatus] = useState<PasswordStatus>("neutral");
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    termsConsent: false,
    privacyConsent: false,
    marketingConsent: false,
  });

  useEffect(() => {
    if (newPassword.length > 0) {
      setNewPasswordStatus(checkPasswordStrength(newPassword) ? "valid" : "invalid");
    } else {
      setNewPasswordStatus("neutral");
    }
    if (confirmPassword.length > 0) {
      setConfirmPasswordStatus(newPassword === confirmPassword && newPassword.length > 0 ? "valid" : "invalid");
    } else {
      setConfirmPasswordStatus("neutral");
    }
  }, [newPassword, confirmPassword]);

  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPassword(e.target.value);
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const currentConfirmPassword = e.target.value;
    setConfirmPassword(currentConfirmPassword);
    if (currentConfirmPassword.length > 0 && newPassword.length > 0) {
      setConfirmPasswordStatus(newPassword === currentConfirmPassword ? "valid" : "invalid");
    } else if (currentConfirmPassword.length === 0 && newPassword.length > 0) {
      setConfirmPasswordStatus("neutral");
    } else {
      setConfirmPasswordStatus("neutral");
    }
  };
  
  const getInputBorderClassName = (status: PasswordStatus) => {
    if (status === "valid") {
      return "border-green-500 focus-visible:ring-green-500";
    }
    if (status === "invalid") {
      return "border-red-500 focus-visible:ring-red-500";
    }
    return "";
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const form = new FormData();
    form.append("email", userEmail);
    form.append("firstName", initialFirstName || "");
    form.append("lastName", initialLastName || "");
    form.append("newPassword", newPassword);
    form.append("confirmPassword", confirmPassword);
    form.append("termsConsent", formData.termsConsent.toString());
    form.append("privacyConsent", formData.privacyConsent.toString());
    form.append("marketingConsent", formData.marketingConsent.toString());

    try {
      await serverAction(form);
    } catch (error) {
      console.error("Erro ao criar conta:", error);
      // Handle error appropriately
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Bem-vindo, {initialFirstName || "usuário"}!</CardTitle>
        <CardDescription>Complete seu cadastro para começar.</CardDescription>
      </CardHeader>
      <CardContent>
        {errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Ocorreu um erro</AlertTitle>
            <AlertDescription>
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit}>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="email">E-mail cadastrado</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={userEmail}
                readOnly
                className="bg-muted"
              />
              <p className="text-sm text-muted-foreground">
                Este e-mail não pode ser alterado nesta etapa.
              </p>
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="firstName">Primeiro nome</Label>
              <Input
                id="firstName"
                name="firstName"
                placeholder="Seu primeiro nome"
                defaultValue={initialFirstName || ""}
                required
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="lastName">Sobrenome</Label>
              <Input
                id="lastName"
                name="lastName"
                placeholder="Seu sobrenome"
                defaultValue={initialLastName || ""}
                required
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="newPassword">Nova senha</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={handleNewPasswordChange}
                className={getInputBorderClassName(newPasswordStatus)}
                required 
              />
              <div className="text-sm text-muted-foreground mt-1">
                <p>A senha deve conter:</p>
                <ul className="list-disc list-inside mt-1">
                  <li className={newPassword.length > 0 && newPassword.length < 8 ? 'text-red-500' : (newPassword.length >= 8 ? 'text-green-500' : '')}>Mínimo 8 caracteres</li>
                  <li className={newPassword.length > 0 && !/[A-Z]/.test(newPassword) ? 'text-red-500' : (/[A-Z]/.test(newPassword) ? 'text-green-500' : '')}>Pelo menos uma letra maiúscula</li>
                  <li className={newPassword.length > 0 && !/\d/.test(newPassword) ? 'text-red-500' : (/\d/.test(newPassword) ? 'text-green-500' : '')}>Pelo menos um número</li>
                  <li className={newPassword.length > 0 && !/[a-z]/.test(newPassword) ? 'text-red-500' : (/[a-z]/.test(newPassword) ? 'text-green-500' : '')}>Pelo menos uma letra minúscula</li>
                </ul>
              </div>
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="confirmPassword">Confirme nova senha</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                className={getInputBorderClassName(confirmPasswordStatus)}
                required
              />
            </div>
            <div className="space-y-3 pt-4 border-t">
              <h3 className="text-sm font-medium">Consentimentos Obrigatórios</h3>
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="terms-consent" 
                    checked={formData.termsConsent}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, termsConsent: Boolean(checked) }))}
                    required
                  />
                  <label htmlFor="terms-consent" className="text-sm leading-relaxed">
                    Eu li e aceito os{' '}
                    <a href="/terms" target="_blank" className="text-primary hover:underline">
                      Termos de Uso
                    </a>
                    {' '}da plataforma
                  </label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="privacy-consent" 
                    checked={formData.privacyConsent}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, privacyConsent: Boolean(checked) }))}
                    required
                  />
                  <label htmlFor="privacy-consent" className="text-sm leading-relaxed">
                    Eu li e aceito a{' '}
                    <a href="/privacy" target="_blank" className="text-primary hover:underline">
                      Política de Privacidade
                    </a>
                    {' '}da plataforma
                  </label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="marketing-consent" 
                    checked={formData.marketingConsent}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, marketingConsent: Boolean(checked) }))}
                  />
                  <label htmlFor="marketing-consent" className="text-sm leading-relaxed">
                    Aceito receber comunicações de marketing e novidades sobre produtos (opcional)
                  </label>
                </div>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || !formData.termsConsent || !formData.privacyConsent}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                'Criar conta'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col">
            <button 
              type="button"
              onClick={async (e) => {
                e.preventDefault();
                await signOutAction();
              }}
              className={clsx(
                  buttonVariants({ variant: "link" }),
                  "p-0 h-auto w-full"
              )}
            >
              Voltar para o login (Sair)
            </button>
          </CardFooter>
    </Card>
  );
} 