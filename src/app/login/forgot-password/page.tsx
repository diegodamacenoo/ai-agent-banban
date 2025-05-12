'use client';
import * as React from "react"
import { usePathname } from 'next/navigation';
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
import { useState, useEffect } from 'react';

export default function ForgotPasswordPage() {
  const pathname = usePathname();
  const supabase = createClient();
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
    return () => clearTimeout(timer);
  }, [countdown]);

  const handlePasswordReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(
      email, 
      {
        redirectTo: `${window.location.origin}/login/account-recovery`,
      }
    );

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setMessage('Se houver uma conta relacionada a este email, um link de recuperação será enviado!');
      setCountdown(60);
    }
  };

  const isButtonDisabled = loading || countdown > 0;

  return (
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Esqueceu sua senha?</CardTitle>
          <CardDescription>Informe seu email para receber um link de recuperação de senha.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordReset}>
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
            {message && <p className="text-sm text-green-500 mt-2">{message}</p>}
            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
            <Button fullWidth type="submit" disabled={isButtonDisabled} className="mt-4">
              {loading 
                ? 'Enviando...' 
                : countdown > 0 
                ? `Aguarde ${countdown}s para um novo link` 
                : 'Enviar link de recuperação'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
            <Link 
            href="/login" 
            className={clsx(buttonVariants({ variant: "link" }), 
            pathname === "/login", "p-0 h-auto w-full")}>
              Sabe sua senha? Volte para o login.
            </Link>
        </CardFooter>
      </Card>
  )
}
