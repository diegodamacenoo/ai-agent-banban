'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log crítico do erro
    console.error('Erro crítico capturado pela Global Error Boundary:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-red-50">
          <div className="text-center space-y-6 max-w-md mx-auto px-4">
            <div className="space-y-4">
              <div className="text-6xl">⚠️</div>
              
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-red-900">
                  Erro Crítico do Sistema
                </h1>
                <p className="text-red-700">
                  Ocorreu um erro crítico que impediu o carregamento da aplicação. 
                  Nossa equipe foi notificada automaticamente.
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <button 
                onClick={reset}
                className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                🔄 Tentar novamente
              </button>
              
              <button 
                onClick={() => window.location.href = '/'}
                className="w-full bg-white text-red-600 border border-red-600 px-4 py-2 rounded-md hover:bg-red-50 transition-colors"
              >
                🏠 Recarregar aplicação
              </button>
            </div>
            
            <div className="text-sm text-red-600">
              <p>
                Se o problema persistir, entre em contato com o suporte técnico.
              </p>
              {error.digest && (
                <p className="mt-2 font-mono text-xs">
                  ID do erro: {error.digest}
                </p>
              )}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
} 