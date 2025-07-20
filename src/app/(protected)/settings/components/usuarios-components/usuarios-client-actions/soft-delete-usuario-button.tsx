'use client';

import { XIcon } from "lucide-react";
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

interface SoftDeleteUsuarioButtonProps {
  userId: string;
  userName: string;
  onSuccess?: () => void;
}

export default function SoftDeleteUsuarioButton({
  const { toast } = useToast();
 userId, userName, onSuccess }: SoftDeleteUsuarioButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSoftDelete = async () => {
    setIsLoading(true);
    try {
      // Chama a API Route para soft delete
      const result = await fetch('/api/user-management/users/soft-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ id: userId }),
      });

      const data = await result.json();

      if (result.ok && data.success) {
        toast.success(`${userName} foi movido para usuÃ¡rios desativados.`);
        onSuccess?.();
      } else {
        toast.error("Erro ao desativar usuÃ¡rio", {
          description: data.error || "Ocorreu um erro inesperado.",
        });
      }
    } catch (error) {
      toast.error("Erro ao desativar usuÃ¡rio", {
        description: "Ocorreu um erro inesperado ao desativar o usuÃ¡rio.",
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
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                disabled={isLoading}
              >
                <XIcon className="h-4 w-4" />
                <span className="sr-only">Excluir usuÃ¡rio {userName}</span>
              </Button>
            </AlertDialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Desativar usuÃ¡rio</p>
          </TooltipContent>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Tem certeza de que deseja desativar {userName}?</AlertDialogTitle>
              <AlertDialogDescription>
                O usuÃ¡rio serÃ¡ movido para a Ã¡rea de <span className="font-semibold">UsuÃ¡rios Desativados</span> e poderÃ¡ ser reativado posteriormente. <span className="font-semibold">Esta aÃ§Ã£o pode ser desfeita.</span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleSoftDelete}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {isLoading ? "Desativando..." : "Desativar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Tooltip>
    </TooltipProvider>
  );
} 
