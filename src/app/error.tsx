'use client';

import { useEffect } from 'react';
import { Button } from '@/shared/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log do erro para monitoramento
    console.error('Erro capturado pela Error Boundary:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 max-w-md mx-auto px-4">
        <div className="space-y-4">
          <div className="flex justify-center">
            <AlertTriangle className="h-16 w-16 text-destructive" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              Algo deu errado!
            </h1>
            <p className="text-muted-foreground">
              Ocorreu um erro inesperado. Nossa equipe foi notificada e está trabalhando para resolver o problema.
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          <Button 
            onClick={reset}
            variant="destructive"
            className="w-full"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar novamente
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/'}
            className="w-full"
          >
            Voltar ao início
          </Button>
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="text-left bg-muted p-4 rounded-lg">
            <summary className="cursor-pointer text-sm font-medium">
              Detalhes do erro (desenvolvimento)
            </summary>
            <pre className="mt-2 text-xs overflow-auto whitespace-pre-wrap break-words">
              {error.message}
              {error.digest && `\nDigest: ${error.digest}`}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
} 
