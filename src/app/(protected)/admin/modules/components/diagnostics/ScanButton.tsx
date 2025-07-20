'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { RefreshCw, Play, CheckCircle } from 'lucide-react';
import { performModuleScan } from '@/app/actions/admin/scan-modules';
import { useRouter } from 'next/navigation';
import { useToast } from '@/shared/ui/toast';

export function ScanButton() {
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanStatus, setLastScanStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const router = useRouter();
  const { toast } = useToast();

  const handleScan = async () => {
    try {
      setIsScanning(true);
      setLastScanStatus('idle');
      
      console.debug('🚀 Iniciando escaneamento de módulos...');
      const result = await performModuleScan();
      
      if (result.success) {
        setLastScanStatus('success');
        console.debug('✅ Escaneamento concluído com sucesso!');
        
        toast.success("Os módulos foram escaneados com sucesso.", {
          title: "Escaneamento concluído",
        });

        // Aguardar um pouco e depois recarregar a página para mostrar os resultados
        setTimeout(() => {
          router.refresh();
        }, 1000);
      } else {
        setLastScanStatus('error');
        console.error('❌ Erro no escaneamento:', result.error);
        
        toast.error(result.error || "Ocorreu um erro ao escanear os módulos.", {
          title: "Erro no escaneamento",
        });
      }
    } catch (error) {
      setLastScanStatus('error');
      console.error('❌ Erro ao executar escaneamento:', error);
      
      toast.error("Ocorreu um erro ao escanear os módulos.", {
        title: "Erro no escaneamento",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const getButtonContent = () => {
    if (isScanning) {
      return (
        <>
          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          Escaneando...
        </>
      );
    }

    if (lastScanStatus === 'success') {
      return (
        <>
          <CheckCircle className="h-4 w-4 mr-2" />
          Escaneamento Concluído
        </>
      );
    }

    return (
      <>
        <Play className="h-4 w-4 mr-2" />
        Executar Escaneamento
      </>
    );
  };

  return (
    <Button
      onClick={handleScan}
      disabled={isScanning}
      variant={lastScanStatus === 'success' ? 'outline' : 'default'}
    >
      {getButtonContent()}
    </Button>
  );
} 