"use client";
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { userRoleOptions } from "@/app/(protected)/settings/types/user-settings-types";
import { useToast } from "@/shared/ui/toast";
import { createSupabaseBrowserClient } from '@/core/supabase/client';

// Componente de diÃ¡logo para convidar usuÃ¡rios por e-mail
export function UsuariosInviteDialog({
  trigger,
  onSuccess,
}: {
  trigger: React.ReactNode; // Elemento que dispara a abertura do diÃ¡logo
  onSuccess?: () => void; // Callback apÃ³s sucesso
}) {
  // Estados para controlar o formulÃ¡rio e o diÃ¡logo
  const [email, setEmail] = React.useState("");
  const [perfil, setPerfil] = React.useState("user");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [organizationId, setOrganizationId] = React.useState<string | null>(null);
  const { toast } = useToast();
  const supabase = createSupabaseBrowserClient();

  // Buscar organizaÃ§Ã£o do usuÃ¡rio logado quando o componente monta
  React.useEffect(() => {
    async function fetchUserOrganization() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', user.id)
          .single();

        if (profile?.organization_id) {
          setOrganizationId(profile.organization_id);
        }
      } catch (error) {
        console.error('Erro ao buscar organizaÃ§Ã£o do usuÃ¡rio:', error);
      }
    }

    fetchUserOrganization();
  }, []);

  // FunÃ§Ã£o para lidar com o envio do convite via Edge Function
  async function handleInvite() {
    if (!email) {
      toast.show({ title: "E-mail obrigatÃ³rio",
        description: "Por favor, preencha o e-mail para convidar.",
        variant: "destructive",
      });
      return;
    }

    if (!organizationId) {
      toast.show({ title: "Erro de configuraÃ§Ã£o",
        description: "NÃ£o foi possÃ­vel identificar sua organizaÃ§Ã£o.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.debug('ðŸš€ CHAMANDO EDGE FUNCTION invite-new-user');
      console.debug('Dados:', { email, organization_id: organizationId, role: perfil });

      // Chamar a edge function diretamente
      const { data, error } = await supabase.functions.invoke('invite-new-user', {
        body: {
          email,
          organization_id: organizationId,
          role: perfil,
        },
      });

      console.debug('ðŸ“¥ RESPOSTA DA EDGE FUNCTION:', { data, error });

      if (error) {
        console.error('Erro da edge function:', error);
        toast.show({ title: "Erro ao enviar convite",
          description: error.message || "Erro interno da funÃ§Ã£o",
          variant: "destructive",
        });
        return;
      }

      if (data?.success) {
        setEmail("");
        setPerfil("user");
        setOpen(false);
        toast.show({ title: "Convite enviado!",
          description: data.message || "O convite foi enviado com sucesso.",
          variant: "default",
        });
        if (onSuccess) onSuccess();
      } else {
        toast.show({ title: "Erro ao enviar convite",
          description: data?.error || "Erro desconhecido",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('Erro inesperado:', err);
      toast.show({ title: "Erro ao enviar convite",
        description: "Erro inesperado ao processar o convite",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* BotÃ£o ou elemento que abre o diÃ¡logo */}
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convidar usuÃ¡rio por e-mail</DialogTitle>
          <DialogDescription>
            Informe o e-mail do usuÃ¡rio e selecione o perfil para enviar o
            convite via Edge Function.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Campo de e-mail */}
          <div className="space-y-2">
            <Label htmlFor="invite-email">E-mail</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="usuario@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {/* SeleÃ§Ã£o de perfil */}
          <div className="space-y-2">
            <Label htmlFor="invite-perfil">Perfil</Label>
            <Select value={perfil} onValueChange={setPerfil}>
              <SelectTrigger id="invite-perfil">
                <SelectValue placeholder="Selecione o perfil" />
              </SelectTrigger>
              <SelectContent>
                {userRoleOptions.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role === "master_admin"
                      ? "Master Admin"
                      : role === "organization_admin"
                        ? "Administrador"
                        : role === "user"
                          ? "Usuário"
                          : role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Debug info */}
          {organizationId && (
            <div className="text-xs text-muted-foreground">
              OrganizaÃ§Ã£o: {organizationId.slice(0, 8)}...
            </div>
          )}
        </div>
        <DialogFooter>
          {/* BotÃ£o de envio do convite */}
          <Button 
            type="submit" 
            onClick={handleInvite} 
            disabled={isSubmitting || !organizationId}
          >
            {isSubmitting ? "Enviando..." : "Enviar convite (Edge Function)"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
