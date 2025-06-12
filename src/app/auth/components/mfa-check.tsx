"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthLevel } from "@/app/actions/auth/mfa";
import MFAVerification from "./mfa-verification";

interface MFACheckProps {
  children: React.ReactNode;
  redirectUrl?: string;
}

export default function MFACheck({ children, redirectUrl = "/auth/mfa-verify" }: MFACheckProps) {
  const [loading, setLoading] = useState(true);
  const [requiresMFA, setRequiresMFA] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkMFAStatus() {
      try {
        const { success, data, error } = await getAuthLevel();
        
        if (success && data) {
          // Se currentLevel for diferente de nextLevel e nextLevel for aal2, 
          // isso significa que o usuário precisa completar o 2FA
          if (data.currentLevel !== data.nextLevel && data.nextLevel === 'aal2') {
            setRequiresMFA(true);
          } else {
            setRequiresMFA(false);
          }
        } else if (error) {
          console.error("Erro ao verificar nível de autenticação:", error);
          // Em caso de erro, não bloqueamos o acesso
          setRequiresMFA(false);
        }
      } catch (error) {
        console.error("Erro inesperado ao verificar MFA:", error);
        setRequiresMFA(false);
      } finally {
        setLoading(false);
      }
    }
    
    checkMFAStatus();
  }, []);

  if (loading) {
    // Enquanto verificamos, mostramos um estado de carregamento ou nada
    return null;
  }

  // Se o usuário precisa completar o 2FA, mostramos a tela de verificação
  if (requiresMFA) {
    return (
      <div className="container max-w-md mx-auto p-4">
        <MFAVerification 
          redirectUrl={window.location.pathname}
          onSuccess={() => setRequiresMFA(false)}
        />
      </div>
    );
  }

  // Se não precisa de 2FA ou já completou, mostramos o conteúdo normal
  return <>{children}</>;
} 