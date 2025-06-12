'use client';

import { RotateCcwIcon } from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";

interface RestoreUsuarioButtonProps {
  userId: string;
  userName: string;
  onSuccess?: () => void;
}

export default function RestoreUsuarioButton({ userId, userName, onSuccess }: RestoreUsuarioButtonProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleRestore = async () => {
    setIsLoading(true);
    try {
      // Chama a API Route para restaurar usuário
      const result = await fetch('/api/user-management/users/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ id: userId }),
      });

      const data = await result.json();

      if (result.ok && data.success) {
        toast({ 
          title: "Usuário restaurado", 
          description: `${userName} foi restaurado com sucesso.`,
        });
        onSuccess?.();
      } else {
        toast({
          title: "Erro ao restaurar usuário",
          description: data.error || "Ocorreu um erro inesperado.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao restaurar usuário",
        description: "Ocorreu um erro inesperado ao restaurar o usuário.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <AlertDialog>
          <TooltipTrigger asChild>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                disabled={isLoading}
              >
                <RotateCcwIcon className="h-4 w-4" />
                <span className="sr-only">Restaurar usuário {userName}</span>
              </Button>
            </AlertDialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Restaurar usuário</p>
          </TooltipContent>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Restaurar usuário</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza de que deseja restaurar <strong>{userName}</strong>?
                <br />
                <br />
                O usuário será movido de volta para a lista de usuários ativos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRestore}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? "Restaurando..." : "Restaurar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Tooltip>
    </TooltipProvider>
  );
} 