'use client';

import { useEffect } from 'react';
import { Manrope } from "next/font/google";
import { AlertTriangle, RefreshCw } from 'lucide-react';

// Importação do CSS global


// Configuração da fonte Roboto
const manrope = Manrope({
  subsets: ["latin"],
  weight: ['400', '500', '700'],
  variable: "--font-manrope",
  display: "swap",
  preload: true,
  adjustFontFallback: true
});

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
    <html lang="pt-BR" className={`${manrope.variable} antialiased`}>
      <head>
        <title>Erro Crítico - Sistema Banban</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen bg-background font-sans">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-6 max-w-md mx-auto px-4">
            <div className="space-y-4">
              <div className="flex justify-center">
                <AlertTriangle className="h-16 w-16 text-destructive" />
              </div>
              
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-foreground">
                  Erro Crítico do Sistema
                </h1>
                <p className="text-muted-foreground">
                  Ocorreu um erro crítico que impediu o carregamento da aplicação. 
                  Nossa equipe foi notificada automaticamente.
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <button 
                onClick={reset}
                className="w-full inline-flex items-center justify-center bg-destructive text-destructive-foreground px-4 py-2 rounded-md hover:bg-destructive/90 transition-colors"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar novamente
              </button>
              
              <button 
                onClick={() => window.location.href = '/'}
                className="w-full bg-background text-foreground border border-input px-4 py-2 rounded-md hover:bg-accent transition-colors"
              >
                Voltar ao início
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && error.digest && (
              <div className="text-sm text-muted-foreground">
                <pre className="mt-2 font-mono text-xs whitespace-pre-wrap break-words">
                  {error.message}
                  {`\nID do erro: ${error.digest}`}
                </pre>
            </div>
            )}
          </div>
        </div>
      </body>
    </html>
  );
} 
