'use client';

import { RotateCcwIcon } from "lucide-react";
import { Button } from "@/shared/ui/button";
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
} from "@/shared/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";
import { useToast } from "@/shared/ui/toast";
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
      // Chama a API Route para restaurar usuÃ¡rio
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
        toast.show({ 
          title: "UsuÃ¡rio restaurado", 
          description: `${userName} foi restaurado com sucesso.`,
        });
        onSuccess?.();
      } else {
        toast.show({ title: "Erro ao restaurar usuÃ¡rio",
          description: data.error || "Ocorreu um erro inesperado.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast.show({ title: "Erro ao restaurar usuÃ¡rio",
        description: "Ocorreu um erro inesperado ao restaurar o usuÃ¡rio.",
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
                <span className="sr-only">Restaurar usuÃ¡rio {userName}</span>
              </Button>
            </AlertDialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Restaurar usuÃ¡rio</p>
          </TooltipContent>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Restaurar usuÃ¡rio</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza de que deseja restaurar <strong>{userName}</strong>?
                <br />
                <br />
                O usuÃ¡rio serÃ¡ movido de volta para a lista de usuÃ¡rios ativos.
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
