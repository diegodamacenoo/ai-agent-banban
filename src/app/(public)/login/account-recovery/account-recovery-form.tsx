'use client';
import * as React from "react"
import { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Button, buttonVariants } from "@/components/ui/button"
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
import Link from "next/link"
import clsx from 'clsx';
import { createSupabaseClient } from '@/lib/supabase/client';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from 'lucide-react';

type PasswordStatus = "neutral" | "valid" | "invalid";

const checkPasswordStrength = (password: string): boolean => {
  if (password.length === 0) return true;
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  return hasMinLength && hasUpperCase && hasLowerCase && hasNumber;
};

export default function AccountRecoveryForm() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = createSupabaseClient();
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPasswordStatus, setNewPasswordStatus] = useState<PasswordStatus>("neutral");
  const [confirmPasswordStatus, setConfirmPasswordStatus] = useState<PasswordStatus>("neutral");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        setIsVerifying(true);
        const token_hash = searchParams.get('token_hash');
        const type = searchParams.get('type');

        if (!token_hash || !type || type !== 'recovery') {
          setError("Link de recuperação inválido ou expirado.");
          return;
        }

        // Verifica o token usando verifyOtp
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash,
          type: 'recovery'
        });

        if (verifyError) {
          throw verifyError;
        }

        setIsVerified(true);
      } catch (err: any) {
        console.error('Erro ao verificar token:', err);
        setError(err.message || "Link de recuperação inválido ou expirado. Por favor, solicite um novo link.");
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [searchParams, supabase.auth]);

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
    setError(null);
    setLoading(true);

    if (!isVerified) {
      setError("Sessão de recuperação inválida. Por favor, solicite um novo link.");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      setLoading(false);
      return;
    }

    if (!checkPasswordStrength(newPassword)) {
      setError("A senha não atende aos requisitos mínimos de segurança.");
      setLoading(false);
      return;
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        throw updateError;
      }

      // Redireciona para o login com mensagem de sucesso
      router.push('/login?message=Senha alterada com sucesso!');
    } catch (err: any) {
      console.error('Erro ao atualizar senha:', err);
      setError(err.message || 'Ocorreu um erro ao tentar alterar sua senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle>Recuperar senha</CardTitle>
        <CardDescription>
          {isVerifying 
            ? "Verificando link de recuperação..."
            : isVerified 
              ? "Digite sua nova senha abaixo."
              : "Link de recuperação inválido"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>
              {error}
              {error.includes("expirado") && (
                <div className="mt-2">
                  <Link 
                    href="/login/forgot-password"
                    className={clsx(buttonVariants({ variant: "secondary" }), "p-0 h-auto block m-0")}
                  >
                    Solicitar novo link
                  </Link>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
        {isVerifying ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : isVerified ? (
          <form onSubmit={handleSubmit}>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="newPassword">Nova senha</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={handleNewPasswordChange}
                  className={getInputBorderClassName(newPasswordStatus)}
                  required
                  disabled={loading}
                />
                <div className="text-sm text-muted-foreground mt-1">
                  <p>A senha deve conter:</p>
                  <ul className="list-disc list-inside mt-1">
                    <li className={newPassword.length > 0 && newPassword.length < 8 ? 'text-red-500' : (newPassword.length >= 8 ? 'text-green-500' : '')}>
                      Mínimo 8 caracteres
                    </li>
                    <li className={newPassword.length > 0 && !/[A-Z]/.test(newPassword) ? 'text-red-500' : (/[A-Z]/.test(newPassword) ? 'text-green-500' : '')}>
                      Pelo menos uma letra maiúscula
                    </li>
                    <li className={newPassword.length > 0 && !/\d/.test(newPassword) ? 'text-red-500' : (/\d/.test(newPassword) ? 'text-green-500' : '')}>
                      Pelo menos um número
                    </li>
                    <li className={newPassword.length > 0 && !/[a-z]/.test(newPassword) ? 'text-red-500' : (/[a-z]/.test(newPassword) ? 'text-green-500' : '')}>
                      Pelo menos uma letra minúscula
                    </li>
                  </ul>
                </div>
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="confirmPassword">Confirme nova senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  className={getInputBorderClassName(confirmPasswordStatus)}
                  required
                  disabled={loading}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || newPasswordStatus !== "valid" || confirmPasswordStatus !== "valid"}
              >
                {loading ? "Alterando senha..." : "Alterar senha"}
              </Button>
            </div>
          </form>
        ) : null}
      </CardContent>
      <CardFooter className="flex flex-col">
          <button 
            type="button"
            onClick={() => router.push('/login')}
            className={clsx(buttonVariants({ variant: "link" }), 
            pathname === "/login", "p-0 h-auto w-full")}
          >
            Voltar para o login
          </button>
      </CardFooter>
    </Card>
  );
} 