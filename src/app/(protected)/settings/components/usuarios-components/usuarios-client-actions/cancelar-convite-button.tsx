"use client";
import * as React from "react";
import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { XCircleIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { DialogContent } from "@/shared/ui/dialog";
import { Dialog } from "@/shared/ui/dialog";
import { useToast } from "@/shared/ui/toast";
import { createSupabaseBrowserClient } from '@/core/supabase/client';

// BotÃ£o para cancelar convite de usuÃ¡rio
interface CancelarConviteButtonProps {
  inviteId: string; // ID do convite
  onSuccess?: () => void; // Callback apÃ³s sucesso
}

export default function CancelarConviteButton({ inviteId, onSuccess }: CancelarConviteButtonProps) {
  // Estados para loading e controle do diÃ¡logo
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const supabase = createSupabaseBrowserClient();

  // Função para cancelar o convite usando Edge Function
  async function handleCancelar() {
    setLoading(true);
    
    try {
      console.debug('🚀 CHAMANDO EDGE FUNCTION cancel-invite');
      console.debug('Dados:', { invite_id: inviteId });

      // Chamar a edge function para cancelar convite
      const { data, error } = await supabase.functions.invoke('cancel-invite', {
        body: {
          invite_id: inviteId,
        },
      });

      console.debug('📥 RESPOSTA DA EDGE FUNCTION:', { data, error });

      if (error) {
        console.error('Erro da edge function:', error);
        toast.show({
          description: error.message || "Erro interno da função",
          variant: "destructive"
        });
        return;
      }

      if (data?.success) {
        toast.show({
          description: data.message || "O convite foi cancelado com sucesso.",
          variant: "default"
        });
        setOpen(false);
        if (onSuccess) onSuccess();
      } else {
        toast.show({
          description: data?.error || "Erro desconhecido",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error('Erro inesperado:', err);
      toast.show({
        description: "Erro inesperado ao cancelar convite",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  // Estado para abrir/fechar o diÃ¡logo de confirmaÃ§Ã£o
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* BotÃ£o de cancelar com tooltip */}
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

      {/* DiÃ¡logo de confirmaÃ§Ã£o */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar convite</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Tem certeza que deseja cancelar este convite?
          </DialogDescription>
          <DialogFooter>
            {/* BotÃ£o voltar */}
            <Button variant="outline" onClick={() => setOpen(false)}>Voltar</Button>
            {/* BotÃ£o cancelar convite */}
            <Button variant="destructive" onClick={handleCancelar} disabled={loading}>
              {loading ? "Cancelando..." : "Cancelar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 
