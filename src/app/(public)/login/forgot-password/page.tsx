'use client';
import * as React from "react"
import { usePathname } from 'next/navigation';
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
import { createBrowserClient } from '@supabase/ssr'
import { useState, useEffect } from 'react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/shared/ui/alert"
import { CheckCircle, AlertTriangle } from "lucide-react"

export default function ForgotPasswordPage() {
  const pathname = usePathname();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        { redirectTo: `${window.location.origin}${pathname}/reset` }
      );

      if (resetError) {
        setError(resetError.message);
      } else {
        setMessage('Se houver uma conta relacionada a este email, um link de recuperação será enviado!');
        setCountdown(60);
      }
    } catch (err) {
      console.error('Erro ao processar recuperação de senha:', err);
      setError('Ocorreu um erro ao processar sua solicitação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const isButtonDisabled = loading || countdown > 0;

  return (
    <div className="flex flex-col space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Esqueceu sua senha?</CardTitle>
          <CardDescription>Informe seu email para receber um link de recuperação de senha.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
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
                  disabled={isButtonDisabled}
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {message && (
              <Alert className="mt-4">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Sucesso</AlertTitle>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="mt-4 w-full"
              disabled={isButtonDisabled}
            >
              {loading 
                ? 'Enviando...' 
                : countdown > 0 
                ? `Aguarde ${countdown}s para um novo link` 
                : 'Enviar link de recuperação'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="text-center">
        <Link 
          href="/login" 
          className={clsx(
            "text-sm text-muted-foreground hover:text-primary",
            "transition-colors duration-200"
          )}
        >
          Voltar para o login
        </Link>
      </div>
    </div>
  )
}
