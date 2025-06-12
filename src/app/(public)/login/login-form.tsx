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
import { createBrowserClient } from '@supabase/ssr';

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
  // Hooks do Next.js para navegação e manipulação de rota
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  // Instancia o cliente do Supabase para autenticação
  const [supabase] = React.useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );

  // Estados para formulário de login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Efeito para tratar erros vindos de callbacks de autenticação
  React.useEffect(() => {
    const callbackError = searchParams.get('error');
    const message = searchParams.get('message');
    if (callbackError) {
      setError(message || 'Ocorreu um erro durante a autenticação.');
    }
  }, [searchParams]);

  // Função para lidar com o submit do formulário de login
  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Tenta autenticar com Supabase
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // Trata mensagens de erro conhecidas
        console.log('Erro no login:', signInError);
        let errorMessage = 'Credenciais inválidas ou erro ao tentar fazer login.';
        if (signInError.message.includes('Invalid login credentials')) {
          errorMessage = 'Email ou senha inválidos.';
        } else if (signInError.message.includes('Email not confirmed')) {
          errorMessage = 'Por favor, confirme seu email antes de fazer login.';
        }
        setError(errorMessage);
      } else if (data.user) {
        // Login bem-sucedido - processar detecção de dispositivo
        try {
          const deviceFingerprint = generateClientDeviceFingerprint();
          
          // Chamar API para verificar/registrar dispositivo
          const response = await fetch('/api/security/device-check', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${data.session?.access_token}`
            },
            body: JSON.stringify({
              user_id: data.user.id,
              user_email: data.user.email,
              device_fingerprint: deviceFingerprint
            })
          });
          
          if (!response.ok) {
            console.warn('Falha ao processar detecção de dispositivo:', await response.text());
          } else {
            console.log('Detecção de dispositivo processada com sucesso');
          }
        } catch (deviceError) {
          console.warn('Erro na detecção de dispositivo:', deviceError);
          // Não bloquear o login por erro de detecção
        }
        
        // Redireciona para home em caso de sucesso
        router.push('/');
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
        {/* Formulário de login */}
        <form onSubmit={handleLogin}>
          {/* Exibe erro, se houver */}
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
            {/* Botão de submit */}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-2">
        {/* Link para recuperação de senha */}
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