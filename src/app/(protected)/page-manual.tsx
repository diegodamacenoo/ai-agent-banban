import Link from 'next/link';
import { Button } from '@/shared/ui/button';

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-3xl font-bold">Bem-vindo!</h1>
        <p className="text-muted-foreground text-lg">
          Escolha onde deseja ir:
        </p>
        
        <div className="space-y-4">
          <Link href="/admin">
            <Button size="lg" className="w-full">
              Acessar Admin Panel
            </Button>
          </Link>
          
          <Link href="/admin-test">
            <Button variant="outline" size="lg" className="w-full">
              Página de Teste
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}