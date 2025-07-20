"use client";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { useToast } from '@/shared/ui/toast';
import { verifyMFA, listMFAFactors } from "@/app/actions/auth/mfa";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { createSupabaseBrowserClient } from "@/core/supabase/client";

interface MFAVerificationProps {
  redirectUrl?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function MFAVerification({ redirectUrl = "/", onSuccess, onCancel }: MFAVerificationProps) {
  const [codigo, setCodigo] = useState("");
  const [verificando, setVerificando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    async function carregarFatores() {
      try {
        const { success, data, error } = await listMFAFactors();
        
        if (success && data && data.totp.length > 0) {
          // Encontra o fator TOTP ativo
          const fator = data.totp.find((f: any) => f.status === 'verified');
          
          if (fator) {
            setFactorId(fator.id);
          } else {
            setErro("Nenhum fator de autenticaÃ§Ã£o ativo encontrado.");
          }
        } else if (error) {
          setErro(error);
        } else {
          setErro("Nenhum fator de autenticaÃ§Ã£o configurado.");
        }
      } catch (error) {
        console.error("Erro ao carregar fatores MFA:", error);
        setErro("Ocorreu um erro ao verificar seus mÃ©todos de autenticaÃ§Ã£o.");
      } finally {
        setCarregando(false);
      }
    }
    
    carregarFatores();
  }, []);

  const handleVerificar = async () => {
    if (!factorId) {
      setErro("NÃ£o foi possÃ­vel identificar seu mÃ©todo de autenticaÃ§Ã£o.");
      return;
    }
    
    if (!codigo || codigo.length !== 6) {
      setErro("Por favor, insira um cÃ³digo de 6 dÃ­gitos.");
      return;
    }
    
    setVerificando(true);
    setErro(null);
    
    try {
      const { success, error } = await verifyMFA({ 
        factorId: factorId, 
        code: codigo 
      });
      
      if (success) {
        toast.success("VerificaÃ§Ã£o bem-sucedida", {
          description: "AutenticaÃ§Ã£o de dois fatores concluÃ­da.",
          duration: 3000,
        });
        
        if (onSuccess) {
          onSuccess();
        } else {
          router.push(redirectUrl);
        }
      } else if (error) {
        setErro(error);
      }
    } catch (error) {
      console.error("Erro ao verificar cÃ³digo MFA:", error);
      setErro("Ocorreu um erro ao verificar o cÃ³digo de autenticaÃ§Ã£o.");
    } finally {
      setVerificando(false);
    }
  };

  if (carregando) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold">VerificaÃ§Ã£o em Dois Fatores</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Digite o cÃ³digo de 6 dÃ­gitos do seu aplicativo autenticador
        </p>
      </div>

      {erro && (
        <Alert variant="destructive">
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <div className="flex justify-center">
          <Input
            type="text"
            placeholder="000000"
            maxLength={6}
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
            className="text-center font-mono text-lg tracking-wider max-w-[200px]"
          />
        </div>
        
        <div className="flex justify-center space-x-2 mt-4">
          {onCancel && (
            <Button variant="outline" onClick={onCancel} disabled={verificando}>
              Cancelar
            </Button>
          )}
          
          <Button onClick={handleVerificar} disabled={verificando || codigo.length !== 6}>
            {verificando ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Verificar
          </Button>
        </div>
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => {
            supabase.auth.signOut();
            router.push("/login");
          }}>
            Voltar para o login
          </Button>
        </div>
      </div>
    </div>
  );
} 
