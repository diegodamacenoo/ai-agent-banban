"use client";
import * as React from "react";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { MailIcon, ShieldAlertIcon } from "lucide-react";
import { UsuariosInviteDialog } from "./usuarios-components/usuarios-invite-dialog";
import {
  GestaoUsuarios,
  ConvitesUsuario,
} from "./usuarios-components/gestao-usuarios";
import { GestaoUsuariosExcluidos } from "./usuarios-components/gestao-usuarios-excluidos";
import { useUser } from "@/app/contexts/UserContext";
import { SkeletonSimple } from "@/components/ui/skeleton-loader";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";

/**
 * Componente para gerenciar usuários e convites
 * 
 * Este componente permite:
 * - Gerenciar usuários ativos
 * - Excluir usuários
 */
export default function SettingsUsuarios() {
  const { userData } = useUser();
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [deletedUsers, setDeletedUsers] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCheckingPermissions, setIsCheckingPermissions] = useState(true);

  // Log para depuração de role
  console.log("DEBUG - userData em SettingsUsuarios:", userData);
  console.log("DEBUG - Role do usuário:", userData?.role);
  console.log("DEBUG - Tipo da role:", typeof userData?.role);
  console.log(
    "DEBUG - Verificação de admin:",
    userData?.role === "organization_admin",
    "Valor esperado: 'organization_admin', Valor atual:",
    userData?.role
  );

  // Log adicional para debug
  if (userData?.role) {
    console.log("DEBUG - Comparação de strings:", {
      "role === 'organization_admin'": userData.role === "organization_admin",
      "role.trim() === 'organization_admin'":
        userData.role.trim() === "organization_admin",
      "role.length": userData.role.length,
      "role === 'admin'": userData.role === "admin",
      "organization_admin.length": "organization_admin".length,
    });
  }

  // Função para buscar usuários via API Route
  const fetchUsers = async () => {
    try {
      const result = await fetch("/api/user-management/users", {
        method: "GET",
        credentials: "include",
      });

      const response = await result.json();

      if (result.ok && response.data) {
        return { data: response.data, error: null };
      } else {
        return {
          data: null,
          error: response.error || "Erro ao buscar usuários",
        };
      }
    } catch (error) {
      return { data: null, error: "Erro ao buscar usuários" };
    }
  };

  // Função para buscar usuários excluídos via API Route
  const fetchDeletedUsers = async () => {
    try {
      const result = await fetch("/api/user-management/users/deleted", {
        method: "GET",
        credentials: "include",
      });

      const response = await result.json();

      if (result.ok && response.data) {
        return { data: response.data, error: null };
      } else {
        return {
          data: null,
          error: response.error || "Erro ao buscar usuários excluídos",
        };
      }
    } catch (error) {
      return { data: null, error: "Erro ao buscar usuários excluídos" };
    }
  };

  // Função para buscar convites via API Route
  const fetchInvites = async () => {
    try {
      const result = await fetch("/api/user-management/invites", {
        method: "GET",
        credentials: "include",
      });

      const response = await result.json();

      if (result.ok && response.data) {
        return { data: response.data, error: null };
      } else {
        return {
          data: null,
          error: response.error || "Erro ao buscar convites",
        };
      }
    } catch (error) {
      return { data: null, error: "Erro ao buscar convites" };
    }
  };

  /**
   * Efeito para buscar dados dos usuários, convites e excluídos
   * 
   * Este efeito é executado quando o usuário está autenticado e a função
   * userData não é nula. Ele verifica se o usuário tem permissão para
   * gerenciar usuários e busca os dados necessários.
   */
  useEffect(() => {
    // Verifica se o usuário está autenticado e tem permissão para gerenciar usuários
    if (userData !== null) {
      // Define o estado de verificação de permissões como false
      setIsCheckingPermissions(false);

      // Verifica se o usuário é um administrador da organização
      if (userData.role === "organization_admin") {
        // Função para buscar dados dos usuários, convites e excluídos
        const fetchData = async () => {
          // Define o estado de loading como true
          setIsLoading(true);
          // Define o estado de erro como null
          setError(null);

          // Tenta buscar os dados dos usuários, convites e excluídos
          try {
            // Busca os dados dos usuários, convites e excluídos
            const [usersResult, deletedUsersResult, invitesResult] =
              await Promise.all([
                fetchUsers(),
                fetchDeletedUsers(),
                fetchInvites(),
              ]);

            // Verifica se houve erro ao buscar os dados dos usuários
            if (usersResult.error) {
              setError(usersResult.error);
            } else {
              // Define o estado de usuários ativos
              setUsers(usersResult.data || []);
            }

            // Verifica se houve erro ao buscar os dados dos usuários excluídos
            if (deletedUsersResult.error) {
              setError((prev) =>
                prev
                  ? `${prev}; ${deletedUsersResult.error}`
                  : deletedUsersResult.error || null
              );
            } else {
              setDeletedUsers(deletedUsersResult.data || []);
            }

            // Verifica se houve erro ao buscar os dados dos convites
            if (invitesResult.error) {
              setError((prev) =>
                prev
                  ? `${prev}; ${invitesResult.error}`
                  : invitesResult.error || null
              );
            } else {
              setInvites(invitesResult.data || []);
            }
          } catch (err) {
            // Define o estado de erro com a mensagem de erro
            setError((err as Error).message || "Erro ao carregar dados");
          } finally {
            // Define o estado de loading como false
            setIsLoading(false);
          }
        };

        fetchData();
      } else {
        setIsLoading(false);
        setUsers([]);
        setDeletedUsers([]);
        setInvites([]);
      }
    }
  }, [userData]);

  /**
   * Função para tratar o soft delete otimista
   * 
   * Esta função é chamada quando o usuário solicita um soft delete.
   * Ela remove o usuário da lista de ativos e adiciona na lista de excluídos.
   * 
   */
  const handleSoftDeleteOptimistic = useCallback(
    (userId: string) => {
      const userToDelete = users.find((user) => user.id === userId);
      if (userToDelete) {
        // Remove da lista de ativos
        setUsers((prev) => prev.filter((user) => user.id !== userId));
        // Adiciona na lista de excluídos
        setDeletedUsers((prev) => [
          ...prev,
          {
            ...userToDelete,
            deleted_at: new Date().toISOString(),
            status: "inactive",
            has_auth_account: true,
          },
        ]);
      }
    },
    [users]
  );

  /**
   * Função para tratar o restore otimista
   * 
   * Esta função é chamada quando o usuário solicita um restore.
   * Ela remove o usuário da lista de excluídos e adiciona na lista de ativos.
   * 
   */
  const handleRestoreOptimistic = useCallback(
    (userId: string) => {
      const userToRestore = deletedUsers.find((user) => user.id === userId);
      if (userToRestore) {
        // Remove da lista de excluídos
        setDeletedUsers((prev) => prev.filter((user) => user.id !== userId));
        // Adiciona na lista de ativos
        const restoredUser = {
          ...userToRestore,
          deleted_at: null,
          status: "active",
        };
        delete restoredUser.deleted_at;
        delete restoredUser.has_auth_account;
        setUsers((prev) => [...prev, restoredUser]);
      }
    },
    [deletedUsers]
  );

  /**
   * Função para tratar o hard delete otimista
   * 
   * Esta função é chamada quando o usuário solicita um hard delete.
   * Ela remove o usuário da lista de excluídos.
   * 
   */
  const handleHardDeleteOptimistic = useCallback((userId: string) => {
    setDeletedUsers((prev) => prev.filter((user) => user.id !== userId));
  }, []);

  /**
   * Função para tratar o update otimista
   * 
   * Esta função é chamada quando o usuário solicita um update.
   * Ela atualiza o usuário na lista de ativos.
   * 
   */
  const handleUserUpdateOptimistic = useCallback(
    (userId: string, updates: any) => {
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, ...updates } : user
        )
      );
    },
    []
  );

  /**
   * Função para atualizar os usuários
   * 
   * Esta função é chamada quando o usuário solicita um update.
   * Ela atualiza o usuário na lista de ativos.
   * 
   */
  const handleUserUpdate = async () => {
    if (userData?.role !== "organization_admin") return;
    // Não mostrar loading para não interromper a fluidez
    try {
      const [usersResult, deletedUsersResult] = await Promise.all([
        fetchUsers(),
        fetchDeletedUsers(),
      ]);

      if (usersResult.error) {
        setError(usersResult.error);
        toast({
          title: "Erro ao atualizar usuários",
          description: usersResult.error,
          variant: "destructive",
        });
      } else {
        // Atualizar apenas se necessário (para casos de erro)
        setUsers(usersResult.data || []);
      }

      if (deletedUsersResult.error) {
        setError((prev) =>
          prev
            ? `${prev}; ${deletedUsersResult.error}`
            : deletedUsersResult.error || null
        );
      } else {
        setDeletedUsers(deletedUsersResult.data || []);
      }
    } catch (err) {
      const errorMessage =
        (err as Error).message || "Erro ao atualizar usuários";
      setError(errorMessage);
      toast({
        title: "Erro ao atualizar usuários",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  /**
   * Função para atualizar os convites
   * 
   * Esta função é chamada quando o usuário solicita um update.
   * Ela atualiza o usuário na lista de ativos.
   * 
   */
  const handleInviteUpdate = async () => {
    if (userData?.role !== "organization_admin") return;
    try {
      const result = await fetchInvites();
      if (result.error) {
        setError(result.error);
        toast({
          title: "Erro ao atualizar convites",
          description: result.error,
          variant: "destructive",
        });
      } else {
        setInvites(result.data || []);
      }
    } catch (err) {
      const errorMessage =
        (err as Error).message || "Erro ao atualizar convites";
      setError(errorMessage);
      toast({
        title: "Erro ao atualizar convites",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Renderização condicional para verificar permissões e exibir loading ou erro
  if (isCheckingPermissions || userData === null) {
    return (
      <div className="p-6">
        <SkeletonSimple height="h-full" />
      </div>
    );
  }

  // Renderização condicional para verificar permissões e exibir loading ou erro
  if (userData.role !== "organization_admin") {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full text-center">
        <ShieldAlertIcon className="w-16 h-16 text-destructive mb-4" />
        <h3 className="text-xl font-semibold">Acesso Negado</h3>
        <p className="text-muted-foreground">
          Você não tem permissão para gerenciar usuários.
        </p>
      </div>
    );
  }

  // Renderização condicional para verificar permissões e exibir loading ou erro
  if (error)
    return (
      <div className="p-6 text-red-500">Erro ao carregar dados: {error}</div>
    );

  return (
    <div className="space-y-8">
      <header className="flex h-16 shrink-0 items-center px-6">
        <h2 className="text-lg font-medium">Gestão de Usuários</h2>
      </header>

      <div className="px-6 space-y-6">
        {/* Seção: Usuários Ativos */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h3 className="text-lg font-medium">Usuários Ativos</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Gerencie usuários ativos da organização
                  </span>
                  <Badge variant="secondary">{users.length}</Badge>
                </div>
              </div>
            </div>
            <UsuariosInviteDialog
              trigger={
                <Button variant="outline" className="flex items-center gap-2">
                  <MailIcon className="w-4 h-4" />
                  Convidar por Email
                </Button>
              }
              onSuccess={handleInviteUpdate}
            />
          </div>
          <GestaoUsuarios
            users={users}
            onUserUpdate={handleUserUpdate}
            onSoftDeleteOptimistic={handleSoftDeleteOptimistic}
            onUserUpdateOptimistic={handleUserUpdateOptimistic}
            isLoading={isLoading}
          />

          {/* Seção: Usuários Desativados */}
          {!isLoading && deletedUsers.length > 0 && (
              <GestaoUsuariosExcluidos
                deletedUsers={deletedUsers}
                onUserUpdate={handleUserUpdate}
                onRestoreOptimistic={handleRestoreOptimistic}
                onHardDeleteOptimistic={handleHardDeleteOptimistic}
              />
          )}
        </section>

        {/* Seção: Convites */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-lg font-medium">Convites</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Gerencie convites enviados para novos usuários
                </span>
                <Badge variant="secondary">{invites.length}</Badge>
              </div>
            </div>
          </div>
          <ConvitesUsuario
            invites={invites}
            onInviteUpdate={handleInviteUpdate}
            isLoading={isLoading}
          />
        </section>
      </div>
    </div>
  );
}
