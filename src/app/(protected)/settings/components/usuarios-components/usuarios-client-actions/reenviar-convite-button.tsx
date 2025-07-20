"use client";
import * as React from "react";
import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { SendIcon } from "lucide-react";
import { useToast } from "@/shared/ui/toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { createSupabaseBrowserClient } from '@/core/supabase/client';

// BotÃ£o para reenviar convite de usuÃ¡rio
interface ReenviarConviteButtonProps {
  inviteId: string; // ID do convite
  onSuccess?: () => void; // Callback apÃ³s sucesso
}

export default function ReenviarConviteButton({ inviteId, onSuccess }: ReenviarConviteButtonProps) {
  // Estados para loading
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const supabase = createSupabaseBrowserClient();

  // Função para reenviar o convite usando Edge Function
  async function handleReenviar() {
    if (!confirm("Tem certeza que deseja reenviar este convite?")) return;
    
    setLoading(true);
    
    try {
      console.debug('🚀 CHAMANDO EDGE FUNCTION resend-invite');
      console.debug('Dados:', { invite_id: inviteId });

      // Chamar a edge function para reenviar convite
      const { data, error } = await supabase.functions.invoke('resend-invite', {
        body: {
          invite_id: inviteId,
        },
      });

      console.debug('📥 RESPOSTA DA EDGE FUNCTION:', { data, error });

      if (error) {
        console.error('Erro da edge function:', error);
        toast.show({
          title: "Erro ao reenviar convite",
          description: error.message || "Erro interno da função",
          variant: "destructive"
        });
        return;
      }

      if (data?.success) {
        toast.show({
          title: "Convite reenviado",
          description: data.message || "Convite reenviado com sucesso.",
          variant: "default"
        });
        if (onSuccess) onSuccess();
      } else {
        toast.show({
          title: "Erro ao reenviar convite",
          description: data?.error || "Erro desconhecido",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error('Erro inesperado:', err);
      toast.show({
        title: "Erro ao reenviar convite",
        description: "Erro inesperado ao reenviar convite",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" onClick={handleReenviar} disabled={loading}>
            <SendIcon className="w-4 h-4" />
            {loading && "..."}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Reenviar convite (Edge Function)</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 
