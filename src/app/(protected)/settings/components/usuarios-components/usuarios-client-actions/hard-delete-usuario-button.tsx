'use client';

import { TrashIcon } from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { useToast } from '@/shared/ui/toast';
import { useState } from "react";

interface HardDeleteUsuarioButtonProps {
  userId: string;
  userName: string;
  onSuccess?: () => void;
}

export default function HardDeleteUsuarioButton({
  const { toast } = useToast();
 userId, userName, onSuccess }: HardDeleteUsuarioButtonProps) {
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
        toast.success("UsuÃ¡rio removido permanentemente", {
          description: `${userName} foi removido permanentemente do sistema.`,
        });
        onSuccess?.();
      } else {
        toast.error("Erro ao remover usuÃ¡rio", {
          description: data.error || "Ocorreu um erro inesperado.",
        });
      }
    } catch (error) {
      toast.error("Erro ao remover usuÃ¡rio", {
        description: "Ocorreu um erro inesperado ao remover o usuÃ¡rio.",
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-red-800 hover:text-red-900 hover:bg-red-100"
          disabled={isLoading}
        >
          <TrashIcon className="h-4 w-4" />
          <span className="sr-only">Remover permanentemente {userName}</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-red-600">Tem certeza que deseja excluir este usuÃ¡rio permanentemente?</DialogTitle>
          <DialogDescription>
            Esta aÃ§Ã£o Ã© irreversÃ­vel e irÃ¡ excluir permanentemente todos os dados do usuÃ¡rio, remover a conta de acesso do sistema e tornar impossÃ­vel a recuperaÃ§Ã£o dos dados.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-800 font-medium text-sm">
              Esta aÃ§Ã£o Ã© IRREVERSÃVEL e irÃ¡:
            </p>
            <ul className="text-red-700 text-sm mt-2 space-y-1 list-disc list-inside">
              <li>Excluir permanentemente todos os dados do usuÃ¡rio</li>
              <li>Remover a conta de acesso do sistema</li>
              <li>Tornar impossÃ­vel a recuperaÃ§Ã£o dos dados</li>
            </ul>
          </div>
          <p className="text-sm text-muted-foreground">
            Esta aÃ§Ã£o nÃ£o pode ser desfeita.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline">Cancelar</Button>
          <Button
            onClick={handleHardDelete}
            disabled={isLoading}
            variant="destructive"
          >
            {isLoading ? "Removendo..." : "Remover Permanentemente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
