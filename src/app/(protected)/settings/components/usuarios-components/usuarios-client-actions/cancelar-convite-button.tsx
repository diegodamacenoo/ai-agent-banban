"use client";
import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { XCircleIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DialogContent } from "@/components/ui/dialog";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

// Botão para cancelar convite de usuário
interface CancelarConviteButtonProps {
  inviteId: string; // ID do convite
  onSuccess?: () => void; // Callback após sucesso
}

export default function CancelarConviteButton({ inviteId, onSuccess }: CancelarConviteButtonProps) {
  // Estados para loading e controle do diálogo
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Função para cancelar o convite
  async function handleCancelar() {
    setLoading(true);
    
    try {
      // Chama a API Route para cancelar convite
      const result = await fetch('/api/user-management/invites/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ id: inviteId }),
      });

      const data = await result.json();

      if (result.ok && data.success) {
        toast({
          description: "O convite foi cancelado com sucesso.",
          variant: "default"
        });
        setOpen(false);
        if (onSuccess) onSuccess();
      } else {
        toast({
          description: data.error || "Erro ao cancelar convite",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        description: "Erro ao cancelar convite",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  // Estado para abrir/fechar o diálogo de confirmação
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Botão de cancelar com tooltip */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" onClick={() => setOpen(true)} disabled={loading}>
              <XCircleIcon className="w-4 h-4 text-red-500" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Cancelar convite</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Diálogo de confirmação */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar convite</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Tem certeza que deseja cancelar este convite?
          </DialogDescription>
          <DialogFooter>
            {/* Botão voltar */}
            <Button variant="outline" onClick={() => setOpen(false)}>Voltar</Button>
            {/* Botão cancelar convite */}
            <Button variant="destructive" onClick={handleCancelar} disabled={loading}>
              {loading ? "Cancelando..." : "Cancelar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 