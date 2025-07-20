import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { ShieldX } from 'lucide-react';
import Link from 'next/link';

export default function AccessDeniedPage() {
  return (
    <div className="container flex items-center justify-center min-h-screen py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <ShieldX className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Acesso Negado</CardTitle>
          <CardDescription>
            VocÃª nÃ£o tem permissÃ£o para acessar esta pÃ¡gina.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground text-center">
            Se vocÃª acredita que deveria ter acesso a esta pÃ¡gina, entre em contato com o administrador da sua organizaÃ§Ã£o.
          </p>
          <div className="flex justify-center">
            <Button asChild>
              <Link href="/">Voltar para Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
