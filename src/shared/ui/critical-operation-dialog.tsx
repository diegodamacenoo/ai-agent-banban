import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Loader2 } from 'lucide-react';
import { Input } from '@/shared/ui/input';
import { verifyMFA, listMFAFactors } from '@/app/actions/auth/mfa';
import { registerMFAVerification, type CriticalOperation } from '@/core/auth/critical-operations';
import { useToast } from '@/shared/ui/toast';

interface CriticalOperationDialogProps {
  open: boolean;
  onClose: () => void;
  onVerified: () => void;
  operation: CriticalOperation;
  userId: string;
  title?: string;
  description?: string;
}

export function CriticalOperationDialog({
  open,
  onClose,
  onVerified,
  operation,
  userId,
  title = 'VerificaÃ§Ã£o de SeguranÃ§a',
  description = 'Esta operaÃ§Ã£o requer verificaÃ§Ã£o adicional de seguranÃ§a.'
}: CriticalOperationDialogProps) {
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const { toast } = useToast();

  // Carregar fator MFA ao abrir o diÃ¡logo
  const loadMFAFactor = async () => {
    try {
      const { success, data, error } = await listMFAFactors();
      
      if (success && data?.totp?.length > 0) {
        const factor = data.totp.find((f: any) => f.status === 'verified');
        if (factor) {
          setFactorId(factor.id);
          setError(null);
        } else {
          setError('Nenhum mÃ©todo de autenticaÃ§Ã£o ativo encontrado.');
        }
      } else if (error) {
        setError(error);
      }
    } catch (error) {
      console.error('Erro ao carregar fatores MFA:', error);
      setError('Erro ao verificar mÃ©todos de autenticaÃ§Ã£o.');
    }
  };

  // Verificar cÃ³digo MFA
  const handleVerify = async () => {
    if (!factorId) {
      setError('MÃ©todo de autenticaÃ§Ã£o nÃ£o encontrado.');
      return;
    }

    if (!code || code.length !== 6) {
      setError('Por favor, insira um cÃ³digo de 6 dÃ­gitos.');
      return;
    }

    setVerifying(true);
    setError(null);

    try {
      const { success, error } = await verifyMFA({
        factorId,
        code
      });

      if (success) {
        // Registrar verificaÃ§Ã£o bem-sucedida
        registerMFAVerification(userId, operation);
        
        toast.success('VerificaÃ§Ã£o concluÃ­da', {
          description: 'VocÃª pode prosseguir com a operaÃ§Ã£o.',
          duration: 3000,
        });

        onVerified();
        onClose();
      } else if (error) {
        setError(error);
      }
    } catch (error) {
      console.error('Erro ao verificar cÃ³digo:', error);
      setError('Ocorreu um erro ao verificar o cÃ³digo.');
    } finally {
      setVerifying(false);
    }
  };

  // Resetar estado ao fechar
  const handleClose = () => {
    setCode('');
    setError(null);
    setVerifying(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Digite o cÃ³digo de 6 dÃ­gitos do seu aplicativo autenticador
            </p>
            
            <div className="flex justify-center">
              <Input
                type="text"
                placeholder="000000"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                className="text-center font-mono text-lg tracking-wider max-w-[200px]"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleClose} disabled={verifying}>
              Cancelar
            </Button>
            <Button onClick={handleVerify} disabled={verifying || code.length !== 6}>
              {verifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Verificar'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 
