"use client";
import * as React from "react";
import { Button } from "@/shared/ui/button";
import { MailIcon } from "lucide-react";
import { UsuariosInviteDialog } from "./usuarios-components/usuarios-invite-dialog";
import { GestaoUsuarios } from "./usuarios-components/gestao-usuarios";
import { GestaoUsuariosExcluidos } from "./usuarios-components/gestao-usuarios-excluidos";
import { usePerfilUsuario } from "@/app/(protected)/settings/contexts/perfis-context";
import { SkeletonSimple } from "@/shared/ui/skeleton-loader";
import { useToast } from "@/shared/ui/toast";

/**
 * Componente para gerenciar usuÃ¡rios
 */
export default function SettingsUsuarios() {
  const { toast } = useToast();
  const {
    perfis: users,
    isLoading,
    error,
    removerPerfil,
    carregarPerfis,
  } = usePerfilUsuario();

  const handleUpdate = () => {
    toast.show({ title: "Sucesso!",
      description: "A lista de usuÃ¡rios foi atualizada.",
      duration: 3000,
    });
    carregarPerfis();
  };
  
  const activeUsers = users.filter((u: any) => !u.deleted_at);
  const deletedUsers = users.filter((u: any) => u.deleted_at);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <SkeletonSimple className="h-10 w-48" />
        <SkeletonSimple className="h-32 w-full" />
        <SkeletonSimple className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500">Erro ao carregar usuÃ¡rios: {error}</p>;
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Gerenciamento de UsuÃ¡rios</h2>
          <p className="text-sm text-muted-foreground">
            Adicione, edite ou remova usuÃ¡rios da sua organizaÃ§Ã£o.
          </p>
        </div>
        <UsuariosInviteDialog
          trigger={
            <Button>
              <MailIcon className="mr-2 h-4 w-4" />
              Convidar UsuÃ¡rio
            </Button>
          }
          onSuccess={handleUpdate}
        />
      </header>

      <GestaoUsuarios users={activeUsers} onUserUpdate={handleUpdate} isLoading={isLoading} />

      {deletedUsers.length > 0 && (
        <GestaoUsuariosExcluidos
          deletedUsers={deletedUsers}
          onUserUpdate={handleUpdate}
        />
      )}
    </div>
  );
}
