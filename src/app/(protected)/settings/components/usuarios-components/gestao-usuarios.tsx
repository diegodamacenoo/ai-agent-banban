"use client";
import * as React from "react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import EditarUsuarioButton from "./usuarios-client-actions/editar-usuario-button";
import DesativarUsuarioButton from "./usuarios-client-actions/desativar-usuario-button";
import SoftDeleteUsuarioButton from "./usuarios-client-actions/soft-delete-usuario-button";
import ReenviarConviteButton from "./usuarios-client-actions/reenviar-convite-button";
import CancelarConviteButton from "./usuarios-client-actions/cancelar-convite-button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SkeletonUserTable, SkeletonInviteTable } from "@/components/ui/skeleton-loader";

// Componente de gestão de usuários e convites

interface GestaoUsuariosProps {
  users: any[];
  onUserUpdate?: () => void;
  onSoftDeleteOptimistic?: (userId: string) => void;
  onUserUpdateOptimistic?: (userId: string, updates: any) => void;
  isLoading: boolean;
}

/**
 * Componente de gestão de usuários (Client Component)
 * Espera receber a lista de usuários via props
 */
export function GestaoUsuarios({ users, onUserUpdate, onSoftDeleteOptimistic, onUserUpdateOptimistic, isLoading }: GestaoUsuariosProps) {
  
   /**
   * Função para tratar o soft delete otimista
   * 
   * Esta função é chamada quando o usuário solicita um soft delete.
   * Ela remove o usuário da lista de ativos e adiciona na lista de excluídos.
   * 
   */
  const handleSoftDeleteWithOptimistic = (userId: string, userName: string) => {
    // Update otimista primeiro
    onSoftDeleteOptimistic?.(userId);
    // Callback para sincronização se necessário
    onUserUpdate?.();
  };

  /**
   * Função para tratar o update otimista
   * 
   * Esta função é chamada quando o usuário solicita um update.
   * Ela atualiza o usuário na lista de ativos.
   */ 
  const handleUserUpdateWithOptimistic = (userId: string, updates: any) => {
    // Update otimista primeiro
    onUserUpdateOptimistic?.(userId, updates);
    // Callback para sincronização se necessário
    onUserUpdate?.();
  };

  return (
    <Card className="shadow-none">
      <CardContent className="p-6">
        {/* Tabela de usuários */}
        {isLoading ? (
          <SkeletonUserTable rows={5} />
        ) : (
          <Table>
            <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Renderiza cada usuário */}
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {/* Avatar do usuário */}
                    <Avatar>
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback>{`${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{user.first_name}</span>
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                {/* Badge de perfil */}
                <TableCell>
                  <Badge variant="outline">
                    {user.perfil === "organization_admin"
                      ? "Administrador"
                      : user.perfil === "editor"
                        ? "Editor"
                        : user.perfil === "reader"
                          ? "Leitor"
                          : "Visitante"}
                  </Badge>
                </TableCell>
                {/* Badge de status */}
                <TableCell>
                  <Badge
                    variant={user.status === "active" ? "outline" : "secondary"}
                  >
                    {user.status === "active" ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                {/* Botões de ação */}
                <TableCell className="flex flex-row items-center justify-end min-w-[120px]">
                  <EditarUsuarioButton
                    user={user}
                    onSuccess={() =>
                      handleUserUpdateWithOptimistic(user.id, {
                        perfil: user.perfil,
                      })
                    }
                  />
                  <SoftDeleteUsuarioButton
                    userId={user.id}
                    userName={user.first_name}
                    onSuccess={() =>
                      handleSoftDeleteWithOptimistic(user.id, user.first_name)
                    }
                  />
                </TableCell>
              </TableRow>
            ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Componente de gestão de convites (Client Component)
 * Espera receber a lista de convites via props
 */
export function ConvitesUsuario({ invites, onInviteUpdate, isLoading }: { invites: any[], onInviteUpdate?: () => void, isLoading: boolean }) {
  return (
    <Card className="shadow-none">
      <CardContent className="p-6">
        {/* Exibe mensagem se não houver convites */}
        {invites.length === 0 && !isLoading && (
          <div className="text-center text-muted-foreground py-8">
            Nenhum convite encontrado.
          </div>
        )}
        {!isLoading && invites.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Data de Envio</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expiração</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Renderiza cada convite */}
              {invites.map((invite) => (
                <TableRow key={invite.id}>
                  <TableCell>{invite.email}</TableCell>
                  <TableCell>
                    {new Date(invite.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        invite.status === "pending" ? "outline" : "secondary"
                      }
                    >
                      {invite.status === "pending"
                        ? "Pendente"
                        : invite.status === "accepted"
                          ? "Aceito"
                          : invite.status === "rejected"
                            ? "Rejeitado"
                            : "Cancelado"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(invite.expires_at).toLocaleDateString()}
                  </TableCell>
                  {/* Botões de ação para convite */}
                  <TableCell className="flex flex-row items-center justify-end min-w-[120px]">
                    <ReenviarConviteButton
                      inviteId={invite.id}
                      onSuccess={onInviteUpdate}
                    />
                    <CancelarConviteButton
                      inviteId={invite.id}
                      onSuccess={onInviteUpdate}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {isLoading && (
          <SkeletonInviteTable rows={3} />
        )}
      </CardContent>
    </Card>
  );
}
