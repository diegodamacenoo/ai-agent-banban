import Link from 'next/link';
import { Button } from '@/shared/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 max-w-md mx-auto px-4">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-primary">404</h1>
          <h2 className="text-2xl font-semibold text-foreground">
            Página não encontrada
          </h2>
          <p className="text-muted-foreground">
            A página que você está procurando não existe ou foi movida.
          </p>
        </div>
        
        <div className="space-y-4">
          <Button asChild className="w-full">
            <Link href="/">
              Voltar ao início
            </Link>
          </Button>
          
          <Button variant="outline" asChild className="w-full">
            <Link href="/settings">
              Ir para configurações
            </Link>
          </Button>
        </div>
        
        <div className="text-sm text-muted-foreground">
          <p>
            Se você acredita que isso é um erro, entre em contato com o suporte.
          </p>
        </div>
      </div>
    </div>
  );
} 
