"use client";
import * as React from "react";
import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { EditIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { userRoleOptions } from "@/app/(protected)/settings/types/user-settings-types";
import { useRouter } from "next/navigation";
import { TooltipContent, TooltipProvider } from "@/shared/ui/tooltip";
import { Tooltip, TooltipTrigger } from "@/shared/ui/tooltip";
import { Label } from "@/shared/ui/label";
import { useToast } from "@/shared/ui/toast";

// BotÃ£o para editar o perfil do usuÃ¡rio
interface EditarUsuarioButtonProps {
  user: any; // Objeto do usuÃ¡rio a ser editado
  onSuccess?: () => void; // Callback apÃ³s sucesso
}

export default function EditarUsuarioButton({ user, onSuccess }: EditarUsuarioButtonProps) {
  // Estados para controlar o diÃ¡logo, perfil selecionado e loading
  const [open, setOpen] = useState(false);
  const [perfil, setPerfil] = useState(user.perfil);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // FunÃ§Ã£o para submeter a ediÃ§Ã£o do perfil
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Chama a API Route para atualizar usuÃ¡rio
      const result = await fetch('/api/user-management/users/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ id: user.id, perfil }),
      });

      const data = await result.json();

      if (result.ok && data.success) {
        setOpen(false);
        router.refresh();
        if (onSuccess) onSuccess();
        toast.show({
          title: "Perfil atualizado",
          description: "O perfil do usuÃ¡rio foi atualizado com sucesso.",
          variant: "default"
        });
      } else {
        toast.show({
          title: "Erro ao atualizar",
          description: data.error || "Erro ao atualizar usuÃ¡rio",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast.show({
        title: "Erro ao atualizar",
        description: "Erro inesperado ao atualizar usuÃ¡rio",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* BotÃ£o de ediÃ§Ã£o com tooltip */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2" onClick={() => setOpen(true)}>
              <EditIcon className="w-4 h-4" />
              {loading && "..."}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Editar</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {/* DiÃ¡logo de ediÃ§Ã£o */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Perfil de UsuÃ¡rio</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo nome (apenas leitura) */}
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" value={user.first_name} placeholder="Nome" required disabled/>
            </div>
            {/* Campo e-mail (apenas leitura) */}
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" value={user.email} placeholder="E-mail" type="email" required disabled />
            </div>
            {/* SeleÃ§Ã£o de perfil */}
            <div className="space-y-2">
              <Label htmlFor="perfil">Perfil</Label>
              <Select value={perfil} onValueChange={setPerfil}>
                <SelectTrigger id="perfil">
                <SelectValue placeholder="Perfil" />
              </SelectTrigger>
              <SelectContent>
                {userRoleOptions.map(role => (
                  <SelectItem key={role} value={role}>
                    {role === 'master_admin' ? 'Master Admin' : 
                     role === 'organization_admin' ? 'Administrador' : 
                     role === 'user' ? 'Usuário' : role}
                  </SelectItem>
                ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              {/* BotÃ£o de salvar */}
              <Button type="submit" onClick={handleSubmit} disabled={loading}>{loading ? "Salvando..." : "Salvar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
} 
