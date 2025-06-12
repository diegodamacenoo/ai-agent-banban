'use client';

import { TrashIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useState } from "react";

interface HardDeleteUsuarioButtonProps {
  userId: string;
  userName: string;
  onSuccess?: () => void;
}

export default function HardDeleteUsuarioButton({ userId, userName, onSuccess }: HardDeleteUsuarioButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleHardDelete = async () => {
    setIsLoading(true);
    try {
      // Chama a API Route para hard delete
      const result = await fetch('/api/user-management/users/hard-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ id: userId }),
      });

      const data = await result.json();

      if (result.ok && data.success) {
        toast.success("Usuário removido permanentemente", {
          description: `${userName} foi removido permanentemente do sistema.`,
        });
        onSuccess?.();
      } else {
        toast.error("Erro ao remover usuário", {
          description: data.error || "Ocorreu um erro inesperado.",
        });
      }
    } catch (error) {
      toast.error("Erro ao remover usuário", {
        description: "Ocorreu um erro inesperado ao remover o usuário.",
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-red-800 hover:text-red-900 hover:bg-red-100"
          disabled={isLoading}
        >
          <TrashIcon className="h-4 w-4" />
          <span className="sr-only">Remover permanentemente {userName}</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-red-600">Tem certeza que deseja excluir este usuário permanentemente?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação é irreversível e irá excluir permanentemente todos os dados do usuário, remover a conta de acesso do sistema e tornar impossível a recuperação dos dados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-3">
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-800 font-medium text-sm">
              Esta ação é IRREVERSÍVEL e irá:
            </p>
            <ul className="text-red-700 text-sm mt-2 space-y-1 list-disc list-inside">
              <li>Excluir permanentemente todos os dados do usuário</li>
              <li>Remover a conta de acesso do sistema</li>
              <li>Tornar impossível a recuperação dos dados</li>
            </ul>
          </div>
          <p className="text-sm text-muted-foreground">
            Esta ação não pode ser desfeita.
          </p>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleHardDelete}
            disabled={isLoading}
            className="bg-red-700 hover:bg-red-800"
          >
            {isLoading ? "Removendo..." : "Remover Permanentemente"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 