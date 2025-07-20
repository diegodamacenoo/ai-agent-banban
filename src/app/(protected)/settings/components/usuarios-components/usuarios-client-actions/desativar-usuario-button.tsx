"use client";
import * as React from "react";
import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Trash } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/shared/ui/dialog";
import { useRouter } from "next/navigation";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { useToast } from "@/shared/ui/toast";

// BotÃ£o para desativar usuÃ¡rio
interface DesativarUsuarioButtonProps {
  userId: string; // ID do usuÃ¡rio
  userName?: string; // Nome do usuÃ¡rio (opcional)
  onSuccess?: () => void; // Callback apÃ³s sucesso
}

export default function DesativarUsuarioButton({ userId, userName, onSuccess }: DesativarUsuarioButtonProps) {
  // Estados para controlar o diÃ¡logo, loading e erro
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  // FunÃ§Ã£o para desativar o usuÃ¡rio
  async function handleDesativar() {
    setLoading(true);
    setError(null);
    
    try {
      // Chama a API Route para desativar usuÃ¡rio
      const result = await fetch('/api/user-management/users/deactivate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ id: userId }),
      });

      const data = await result.json();

      if (result.ok && data.success) {
        setOpen(false);
        router.refresh();
        if (onSuccess) onSuccess();
        toast.show({
          title: "UsuÃ¡rio desativado",
          description: `${userName || "UsuÃ¡rio"} foi desativado com sucesso.`,
          variant: "default"
        });
      } else {
        setError(data.error || "Erro ao desativar usuÃ¡rio");
        toast.show({
          description: data.error || "Erro ao desativar usuÃ¡rio",
          variant: "destructive"
        });
      }
    } catch (error) {
      setError("Erro inesperado ao desativar usuÃ¡rio");
      toast.show({
        description: "Erro inesperado ao desativar usuÃ¡rio",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* BotÃ£o de desativar com tooltip */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 text-red-500 hover:text-red-600" onClick={() => setOpen(true)}>
              <Trash className="w-4 h-4 text-red-500" />
              {loading && "..."}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Desativar usuÃ¡rio</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {/* DiÃ¡logo de confirmaÃ§Ã£o */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desativar UsuÃ¡rio</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja desativar o usuÃ¡rio {userName || "selecionado"}? Esta aÃ§Ã£o impedirÃ¡ o acesso do usuÃ¡rio ao sistema.
            </DialogDescription>
          </DialogHeader>
          {/* Exibe erro, se houver */}
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <DialogFooter>
            {/* BotÃ£o cancelar */}
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            {/* BotÃ£o desativar */}
            <Button variant="destructive" onClick={handleDesativar} disabled={loading}>
              {loading ? "Desativando..." : "Desativar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 
