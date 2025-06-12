"use client";
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { userRoleOptions } from "@/app/(protected)/settings/types/user-settings-types";
import { useToast } from "@/components/ui/use-toast";

// Componente de diálogo para convidar usuários por e-mail
export function UsuariosInviteDialog({
  trigger,
  onSuccess,
}: {
  trigger: React.ReactNode; // Elemento que dispara a abertura do diálogo
  onSuccess?: () => void; // Callback após sucesso
}) {
  // Estados para controlar o formulário e o diálogo
  const [email, setEmail] = React.useState("");
  const [perfil, setPerfil] = React.useState("reader");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();

  // Função para lidar com o envio do convite
  async function handleInvite() {
    if (!email) {
      toast({
        title: "E-mail obrigatório",
        description: "Por favor, preencha o e-mail para convidar.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Chama a API Route para enviar convite
      const result = await fetch("/api/user-management/invites/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email,
          role: perfil,
          expiresIn: 7, // Padrão de 7 dias
        }),
      });

      const data = await result.json();

      if (result.ok && data.success) {
        setEmail("");
        setPerfil("reader");
        setOpen(false);
        toast({
          description: "O convite foi enviado com sucesso.",
          variant: "default",
        });
        if (onSuccess) onSuccess();
      } else {
        toast({
          description: data.error || "Erro ao enviar convite",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        description: "Erro ao enviar convite",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Botão ou elemento que abre o diálogo */}
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convidar usuário por e-mail</DialogTitle>
          <DialogDescription>
            Informe o e-mail do usuário e selecione o perfil para enviar o
            convite.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Campo de e-mail */}
          <div className="space-y-2">
            <Label htmlFor="invite-email">E-mail</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="usuario@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {/* Seleção de perfil */}
          <div className="space-y-2">
            <Label htmlFor="invite-perfil">Perfil</Label>
            <Select value={perfil} onValueChange={setPerfil}>
              <SelectTrigger id="invite-perfil">
                <SelectValue placeholder="Selecione o perfil" />
              </SelectTrigger>
              <SelectContent>
                {userRoleOptions.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role === "organization_admin"
                      ? "Administrador"
                      : role === "editor"
                        ? "Editor"
                        : role === "reader"
                          ? "Leitor"
                          : "Visitante"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          {/* Botão de envio do convite */}
          <Button type="submit" onClick={handleInvite} disabled={isSubmitting}>
            {isSubmitting ? "Enviando..." : "Enviar convite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
