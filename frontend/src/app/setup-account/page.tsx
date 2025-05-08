'use client';
import * as React from "react"
import { Button } from "@/components/ui/button"
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

export default function SetupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Bem-vindo!</CardTitle>
          <CardDescription>Complete seu cadastro para começar.</CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email">E-mail cadastrado</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value="usuario@exemplo.com" 
                  readOnly 
                  className="bg-muted"
                />
                <p className="text-sm text-muted-foreground">
                  Você poderá alterar seu e-mail quando finalizar essa configuração inicial.
                </p>
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="firstName">Primeiro nome</Label>
                <Input id="firstName" placeholder="Seu primeiro nome" />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="lastName">Sobrenome</Label>
                <Input id="lastName" placeholder="Seu sobrenome" />
              </div>
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
        <CardFooter>
          <Button fullWidth>Continuar</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
