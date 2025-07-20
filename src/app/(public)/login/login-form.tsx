'use client';
import * as React from "react"
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, buttonVariants } from "@/shared/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import Link from "next/link"
import clsx from 'clsx';
import { createBrowserClient } from '@supabase/ssr';
import { safeLogger } from '@/features/security/safe-logger';
import { signInWithPassword } from '@/app/actions/auth/login';

// Função client-side para gerar fingerprint do dispositivo
function generateClientDeviceFingerprint(): string {
  const userAgent = navigator.userAgent || '';
  const language = navigator.language || '';
  const platform = navigator.platform || '';
  const cookieEnabled = navigator.cookieEnabled ? 'true' : 'false';
  const screenResolution = `${screen.width}x${screen.height}`;
  const timezoneOffset = new Date().getTimezoneOffset().toString();

  // Combinar dados do cliente para criar fingerprint
  const fingerprintData = [
    userAgent,
    language,
    platform,
    cookieEnabled,
    screenResolution,
    timezoneOffset
  ].join('|');

  // Usar uma função de hash simples (em produção, use crypto.subtle.digest se disponível)
  let hash = 0;
  for (let i = 0; i < fingerprintData.length; i++) {
    const char = fingerprintData.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

// Página de login do sistema
export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const { success, error, redirect } = await signInWithPassword({
        email,
        password
      });

      if (!success) {
        setError(error || 'Erro ao realizar login');
        return;
      }

      // Redirecionar para a rota apropriada
      if (redirect) {
        router.push(redirect);
        router.refresh();
      }
    } catch (err) {
      setError('Ocorreu um erro ao tentar fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>Entre com suas credenciais para acessar o sistema.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="********"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-2 pt-2">
        {/* Link para recuperação de senha */}
        <Link
          href="/login/forgot-password"
          className={clsx(
            buttonVariants({ variant: "link" }),
            "p-0 h-auto w-full"
          )}
        >
          Esqueci minha senha
        </Link>
      </CardFooter>
    </Card>
  )
} 
