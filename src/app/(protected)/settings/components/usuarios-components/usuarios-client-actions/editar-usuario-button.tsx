"use client";
import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EditIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { userRoleOptions } from "@/app/(protected)/settings/types/user-settings-types";
import { useRouter } from "next/navigation";
import { TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Tooltip, TooltipTrigger } from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

// Botão para editar o perfil do usuário
interface EditarUsuarioButtonProps {
  user: any; // Objeto do usuário a ser editado
  onSuccess?: () => void; // Callback após sucesso
}

export default function EditarUsuarioButton({ user, onSuccess }: EditarUsuarioButtonProps) {
  // Estados para controlar o diálogo, perfil selecionado e loading
  const [open, setOpen] = useState(false);
  const [perfil, setPerfil] = useState(user.perfil);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Função para submeter a edição do perfil
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Chama a API Route para atualizar usuário
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
        toast({
          description: "O perfil do usuário foi atualizado com sucesso.",
          variant: "default"
        });
      } else {
        toast({
          description: data.error || "Erro ao atualizar usuário",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        description: "Erro inesperado ao atualizar usuário",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Botão de edição com tooltip */}
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
      {/* Diálogo de edição */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Perfil de Usuário</DialogTitle>
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
            {/* Seleção de perfil */}
            <div className="space-y-2">
              <Label htmlFor="perfil">Perfil</Label>
              <Select value={perfil} onValueChange={setPerfil}>
                <SelectTrigger id="perfil">
                <SelectValue placeholder="Perfil" />
              </SelectTrigger>
              <SelectContent>
                {userRoleOptions.map(role => (
                  <SelectItem key={role} value={role}>{role === 'organization_admin' ? 'Administrador' : role === 'editor' ? 'Editor' : role === 'reader' ? 'Leitor' : 'Visitante'}</SelectItem>
                ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              {/* Botão de salvar */}
              <Button type="submit" onClick={handleSubmit} disabled={loading}>{loading ? "Salvando..." : "Salvar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
} 