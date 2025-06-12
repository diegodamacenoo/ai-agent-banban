'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetErrorBoundary: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback && this.state.error) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} resetErrorBoundary={this.resetErrorBoundary} />;
      }

      return (
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Algo deu errado
            </CardTitle>
            <CardDescription>
              Ocorreu um erro inesperado. Tente recarregar a página.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="p-3 bg-muted rounded text-sm font-mono">
                  {this.state.error.message}
                </div>
              )}
              <Button onClick={this.resetErrorBoundary} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Page Error Boundary específico
export function PageErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={({ error, resetErrorBoundary }) => (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                Erro na Página
              </CardTitle>
              <CardDescription>
                Não foi possível carregar esta página. Verifique sua conexão e tente novamente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {process.env.NODE_ENV === 'development' && (
                  <div className="p-3 bg-muted rounded text-sm font-mono max-h-32 overflow-auto">
                    {error.message}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button onClick={resetErrorBoundary} className="flex-1">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Tentar Novamente
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.href = '/'}
                    className="flex-1"
                  >
                    Ir ao Home
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      onError={(error, errorInfo) => {
        // Log error for monitoring
        console.error('Page Error:', { error, errorInfo });
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

// Error Boundary específico para seções/componentes
export function SectionErrorBoundary({ 
  children,
  sectionName 
}: { 
  children: React.ReactNode;
  sectionName: string;
}) {
  return (
    <ErrorBoundary
      fallback={({ error, resetErrorBoundary }) => (
        <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <span className="text-sm font-medium text-destructive">
              Erro em {sectionName}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Esta seção não pôde ser carregada
          </p>
          <Button 
            onClick={resetErrorBoundary}
            size="sm"
            variant="outline"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Tentar novamente
          </Button>
        </div>
      )}
      onError={(error, errorInfo) => {
        console.error(`Error in ${sectionName}:`, { error, errorInfo });
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

export default ErrorBoundary; 