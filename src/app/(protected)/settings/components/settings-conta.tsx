'use client';

import React from "react";
import { useRouter } from "next/navigation";
import ProfileData from "./conta-components/perfil/profile-data";
import Credenciais from "./conta-components/seguranca/credenciais";
import AutenticacaoDoisFatores from "./conta-components/seguranca/autenticacao-dois-fatores";
import GestaoConta from "./conta-components/gestao-conta";
import { RefreshProvider } from '@/app/(protected)/settings/contexts/refresh-context';
import { useUser } from "@/app/contexts/UserContext";
import { useToast } from "@/components/ui/use-toast";

export default function SettingsConta() {
  // Toast
  const { toast } = useToast();
  // Roteador
  const router = useRouter();
  // Contexto de usuário
  const { userData, fetchUserData, updateUserData } = useUser();
  // Função para recarregar os dados do usuário
  const handleRefresh = async () => {
    try {
      await fetchUserData();
    } catch (e: any) {
      console.error("Falha ao recarregar dados da conta via contexto: ", e.message);
      toast({
        description: "Não foi possível recarregar os dados da conta. Por favor, contate o administrador da sua organização.",
        variant: "destructive",
      });
    }
  }

  // Se os dados do usuário não estão carregados, exibe um spinner
  // if (!userData) {
  //   return (
  //     <div className="flex items-center justify-center h-full p-6">
  //       <Spinner className="w-8 h-8 animate-spin" variant="ring"/>
  //     </div>
  //   );
  // }

  // Se os dados do usuário estão carregados, exibe o conteúdo
  return (
    <RefreshProvider refreshFunction={handleRefresh}>
      <div className="space-y-6">
        <header className="flex h-16 shrink-0 items-center px-6">
          <h2 className="text-lg font-medium">Conta</h2>
        </header>
        
        <div className="px-6 pb-6 space-y-6">
          {/* Dados Pessoais */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Dados Pessoais</h3>
                <p className="text-sm text-muted-foreground">Informações básicas sobre você e sua conta</p>
              </div>
            </div>
            <ProfileData profile={userData} onProfileUpdate={updateUserData as any} />
          </div>
          
          {/* Credenciais */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Credenciais</h3>
                <p className="text-sm text-muted-foreground">Gerencie suas senhas e métodos de acesso</p>
              </div>
            </div>
            <Credenciais />
          </div>
          
          {/* Autenticação em Dois Fatores */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Autenticação em Dois Fatores (2FA)</h3>
                <p className="text-sm text-muted-foreground">Adicione uma camada extra de segurança à sua conta</p>
              </div>
            </div>
            <AutenticacaoDoisFatores />
          </div>
          
          {/* Preferências de Interface (manter comentado) */}
          {/* <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Preferências de Interface</h3>
                <p className="text-sm text-muted-foreground">Personalize a aparência do sistema</p>
              </div>
            </div>
            <PreferenciasInterface />
          </div>*/}
          
          {/* Gestão de Conta */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Desativação e Exclusão de Conta</h3>
                <p className="text-sm text-muted-foreground">Gerencie suas solicitações de desativação e exclusão de conta</p>
              </div>
            </div>
            <GestaoConta />
          </div>
        </div>
      </div>
    </RefreshProvider>
  );
}