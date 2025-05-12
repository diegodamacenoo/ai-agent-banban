'use client';
import * as React from "react"
import { useState } from 'react';
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
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    const callbackError = searchParams.get('error');
    const message = searchParams.get('message');
    if (callbackError) {
      setError(message || 'Ocorreu um erro durante a autenticação.');
    }
  }, [searchParams]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('Erro no login:', signInError);
        let errorMessage = 'Credenciais inválidas ou erro ao tentar fazer login.';
        if (signInError.message.includes('Invalid login credentials')) {
          errorMessage = 'Email ou senha inválidos.';
        } else if (signInError.message.includes('Email not confirmed')) {
          errorMessage = 'Por favor, confirme seu email antes de fazer login.';
        }
        setError(errorMessage);
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (e: any) {
      console.error('Erro inesperado no login:', e);
      setError('Ocorreu um erro inesperado. Tente novamente.');
    }
    setLoading(false);
  };

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>Entre com suas credenciais para acessar o sistema.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin}>
          {error && (
            <p className="mb-3 text-sm text-red-600 bg-red-100 p-2 rounded-md">
              {error}
            </p>
          )}
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="seu@email.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-2">
        <Link 
          href="/login/forgot-password" 
          className={clsx(
            buttonVariants({ variant: "link" }), 
            "p-0 h-auto w-full",
            pathname === "/login/forgot-password"
          )}
        >
          Esqueci minha senha
        </Link>
      </CardFooter>
    </Card>
  )
}
