"use client";
import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";

// Botão para desativar usuário
interface DesativarUsuarioButtonProps {
  userId: string; // ID do usuário
  userName?: string; // Nome do usuário (opcional)
  onSuccess?: () => void; // Callback após sucesso
}

export default function DesativarUsuarioButton({ userId, userName, onSuccess }: DesativarUsuarioButtonProps) {
  // Estados para controlar o diálogo, loading e erro
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  // Função para desativar o usuário
  async function handleDesativar() {
    setLoading(true);
    setError(null);
    
    try {
      // Chama a API Route para desativar usuário
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
        toast({
          description: `${userName || "Usuário"} foi desativado com sucesso.`,
          variant: "default"
        });
      } else {
        setError(data.error || "Erro ao desativar usuário");
        toast({
          description: data.error || "Erro ao desativar usuário",
          variant: "destructive"
        });
      }
    } catch (error) {
      setError("Erro inesperado ao desativar usuário");
      toast({
        description: "Erro inesperado ao desativar usuário",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Botão de desativar com tooltip */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 text-red-500 hover:text-red-600" onClick={() => setOpen(true)}>
              <Trash className="w-4 h-4 text-red-500" />
              {loading && "..."}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Desativar usuário</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {/* Diálogo de confirmação */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desativar Usuário</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja desativar o usuário {userName || "selecionado"}? Esta ação impedirá o acesso do usuário ao sistema.
            </DialogDescription>
          </DialogHeader>
          {/* Exibe erro, se houver */}
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <DialogFooter>
            {/* Botão cancelar */}
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            {/* Botão desativar */}
            <Button variant="destructive" onClick={handleDesativar} disabled={loading}>
              {loading ? "Desativando..." : "Desativar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 