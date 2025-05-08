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

export default function LoginPage() {
  const pathname = usePathname();
  return (
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Recuperar senha</CardTitle>
          <CardDescription>Digite sua nova senha abaixo.</CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="newPassword">Nova senha</Label>
                <Input id="newPassword" type="password" placeholder="••••••••" />
                <div className="text-sm text-muted-foreground mt-1">
                  <p>A senha deve conter:</p>
                  <ul className="list-disc list-inside mt-1">
                    <li>No mínimo 8 caracteres</li>
                    <li>Pelo menos uma letra maiúscula</li>
                    <li>Pelo menos um número</li>
                    <li>Pelo menos uma letra minúscula</li>
                  </ul>
                </div>
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="confirmPassword">Confirme nova senha</Label>
                <Input id="confirmPassword" type="password" placeholder="••••••••" />
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
            <Button fullWidth>Alterar senha</Button>
            <Link 
            href="/login" 
            className={clsx(buttonVariants({ variant: "ghost" }), 
            pathname === "/login")}>
              Sabe sua senha? Volte para o login.
            </Link>
        </CardFooter>
      </Card>
  )
}
