"use client";
import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SendIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TooltipProvider } from "@/components/ui/tooltip";

// Botão para reenviar convite de usuário
interface ReenviarConviteButtonProps {
  inviteId: string; // ID do convite
  onSuccess?: () => void; // Callback após sucesso
}

export default function ReenviarConviteButton({ inviteId, onSuccess }: ReenviarConviteButtonProps) {
  // Estados para loading
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Função para reenviar o convite
  async function handleReenviar() {
    if (!confirm("Tem certeza que deseja reenviar este convite?")) return;
    
    setLoading(true);
    
    try {
      // Chama a API Route para reenviar convite
      const result = await fetch('/api/user-management/invites/resend', {
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
          description: "Convite reenviado com sucesso.",
          variant: "default"
        });
        if (onSuccess) onSuccess();
      } else {
        toast({
          description: data.error || "Erro ao reenviar convite",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        description: "Erro ao reenviar convite",
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
          <p>Reenviar convite</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 