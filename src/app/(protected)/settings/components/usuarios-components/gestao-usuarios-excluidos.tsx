"use client";
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/shared/ui/table";
import RestoreUsuarioButton from "./usuarios-client-actions/restore-usuario-button";
import HardDeleteUsuarioButton from "./usuarios-client-actions/hard-delete-usuario-button";
import { Badge } from "@/shared/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { AlertTriangle, Calendar } from "lucide-react";

// Componente de gestÃ£o de usuÃ¡rios excluÃ­dos

interface GestaoUsuariosExcluidosProps {
  deletedUsers: any[];
  onUserUpdate?: () => void;
  onRestoreOptimistic?: (userId: string) => void;
  onHardDeleteOptimistic?: (userId: string) => void;
}

/**
 * Componente de gestÃ£o de usuÃ¡rios excluÃ­dos (Client Component)
 * Espera receber a lista de usuÃ¡rios excluÃ­dos via props
 */
export function GestaoUsuariosExcluidos({ 
  deletedUsers, 
  onUserUpdate, 
  onRestoreOptimistic, 
  onHardDeleteOptimistic 
}: GestaoUsuariosExcluidosProps) {
  const formatDeletedDate = (deletedAt: string) => {
    return new Date(deletedAt).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleRestoreWithOptimistic = (userId: string, userName: string) => {
    // Update otimista primeiro
    onRestoreOptimistic?.(userId);
    // Callback para sincronizaÃ§Ã£o se necessÃ¡rio
    onUserUpdate?.();
  };

  const handleHardDeleteWithOptimistic = (userId: string, userName: string) => {
    // Update otimista primeiro
    onHardDeleteOptimistic?.(userId);
    // Callback para sincronizaÃ§Ã£o se necessÃ¡rio
    onUserUpdate?.();
  };

  if (deletedUsers.length === 0) {
    return (
      <Card className="shadow-none">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground py-8">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>Nenhum usuÃ¡rio excluÃ­do encontrado.</p>
            <p className="text-sm mt-1">UsuÃ¡rios excluÃ­dos aparecerÃ£o aqui.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-none">
      <CardContent className="p-6">
        <div className="flex flex-col mb-4">
          <h4 className="font-medium">UsuÃ¡rios Desativados</h4>
          <p className="text-sm text-muted-foreground">
            UsuÃ¡rios que foram desativados e podem ser reativados ou
            removidos permanentemente
          </p>
        </div>
        {/* Tabela de usuÃ¡rios excluÃ­dos */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Status da Conta</TableHead>
              <TableHead>Data da ExclusÃ£o</TableHead>
              <TableHead className="text-right">AÃ§Ãµes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Renderiza cada usuÃ¡rio excluÃ­do */}
            {deletedUsers.map((user) => (
              <TableRow key={user.id} className="bg-red-50/30">
                <TableCell>
                  <div className="flex items-center gap-3">
                    {/* Avatar do usuÃ¡rio */}
                    <Avatar className="opacity-60">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback className="bg-gray-200">{`${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-gray-600">{user.nome}</span>
                  </div>
                </TableCell>
                <TableCell className="text-gray-600">{user.email}</TableCell>
                {/* Badge de perfil */}
                <TableCell>
                  <Badge variant='secondary' className="opacity-60">
                    {user.perfil === 'organization_admin' ? 'Administrador' : 
                     user.perfil === 'editor' ? 'Editor' : 
                     user.perfil === 'reader' ? 'Leitor' : 'Visitante'}
                  </Badge>
                </TableCell>
                {/* Status da conta de acesso */}
                <TableCell>
                  <Badge variant={user.has_auth_account ? 'outline' : 'destructive'} className="opacity-70">
                    {user.has_auth_account ? 'Conta Ativa' : 'Conta Removida'}
                  </Badge>
                </TableCell>
                {/* Data da exclusÃ£o */}
                <TableCell>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Calendar className="h-3 w-3" />
                    {formatDeletedDate(user.deleted_at)}
                  </div>
                </TableCell>
                {/* BotÃµes de aÃ§Ã£o */}
                <TableCell className="flex flex-row items-center justify-end min-w-[120px]">
                  <RestoreUsuarioButton 
                    userId={user.id} 
                    userName={user.nome} 
                    onSuccess={() => handleRestoreWithOptimistic(user.id, user.nome)} 
                  />
                  <HardDeleteUsuarioButton 
                    userId={user.id} 
                    userName={user.nome} 
                    onSuccess={() => handleHardDeleteWithOptimistic(user.id, user.nome)} 
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {/* Aviso sobre exclusÃ£o permanente */}
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-amber-800">Sobre usuÃ¡rios desativados:</p>
              <ul className="text-amber-700 mt-1 space-y-1 list-disc list-inside">
                <li><strong>Restaurar:</strong> O usuÃ¡rio volta para a lista ativa e pode acessar o sistema</li>
                <li><strong>Remover Permanentemente:</strong> Exclui todos os dados de forma irreversÃ­vel</li>
                <li>UsuÃ¡rios com "Removido Permanente" jÃ¡ tiveram seu acesso excluÃ­do permanentemente</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 
