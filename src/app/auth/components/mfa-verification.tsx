"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { verifyMFA, listMFAFactors } from "@/app/actions/auth/mfa";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createSupabaseClient } from "@/lib/supabase/client";

interface MFAVerificationProps {
  redirectUrl?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function MFAVerification({ redirectUrl = "/dashboard", onSuccess, onCancel }: MFAVerificationProps) {
  const [codigo, setCodigo] = useState("");
  const [verificando, setVerificando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

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
            setErro("Nenhum fator de autenticação ativo encontrado.");
          }
        } else if (error) {
          setErro(error);
        } else {
          setErro("Nenhum fator de autenticação configurado.");
        }
      } catch (error) {
        console.error("Erro ao carregar fatores MFA:", error);
        setErro("Ocorreu um erro ao verificar seus métodos de autenticação.");
      } finally {
        setCarregando(false);
      }
    }
    
    carregarFatores();
  }, []);

  const handleVerificar = async () => {
    if (!factorId) {
      setErro("Não foi possível identificar seu método de autenticação.");
      return;
    }
    
    if (!codigo || codigo.length !== 6) {
      setErro("Por favor, insira um código de 6 dígitos.");
      return;
    }
    
    setVerificando(true);
    setErro(null);
    
    try {
      const { success, error } = await verifyMFA(factorId, codigo);
      
      if (success) {
        toast({
          title: "Verificação bem-sucedida",
          description: "Autenticação de dois fatores concluída.",
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
      console.error("Erro ao verificar código MFA:", error);
      setErro("Ocorreu um erro ao verificar o código de autenticação.");
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
        <h2 className="text-xl font-semibold">Verificação em Dois Fatores</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Digite o código de 6 dígitos do seu aplicativo autenticador
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
            const supabase = createSupabaseClient();
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