'use client';

import { useClientType } from '@/shared/hooks/useClientType';
import { Button } from '@/shared/ui/button';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import { 
  Shirt, 
  Sparkles, 
  ArrowRight,
  Crown
} from 'lucide-react';
import Link from 'next/link';

export function PerformanceHeader() {
  const { 
    isCustom, 
    isLoading, 
    organizationName,
    isImplementationComplete 
  } = useClientType();

  if (isLoading) {
    return null; // NÃ£o mostrar nada enquanto carrega
  }

  // Mostrar opÃ§Ã£o BanBan apenas para clientes customizados com implementaÃ§Ã£o completa
  if (isCustom && isImplementationComplete) {
    return (
      <Alert className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Shirt className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-purple-800">
                  Dashboard BanBan Fashion DisponÃ­vel
                </span>
                <Badge variant="outline" className="border-purple-300 text-purple-700">
                  <Crown className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
              </div>
              <AlertDescription className="text-purple-700">
                Acesse o dashboard especializado para {organizationName} com mÃ©tricas 
                especÃ­ficas de moda, anÃ¡lises sazonais e tendÃªncias de estilo.
              </AlertDescription>
            </div>
          </div>
          <Link href="/banban-performance">
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <Sparkles className="h-4 w-4 mr-2" />
              Acessar BanBan Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </Alert>
    );
  }

  // Mostrar teaser para clientes customizados com implementaÃ§Ã£o pendente
  if (isCustom && !isImplementationComplete) {
    return (
      <Alert className="border-orange-200 bg-orange-50 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <Shirt className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <div className="font-semibold text-orange-800 mb-1">
                Dashboard BanBan Fashion - ImplementaÃ§Ã£o Pendente
              </div>
              <AlertDescription className="text-orange-700">
                Sua implementaÃ§Ã£o customizada estÃ¡ sendo finalizada. 
                Em breve vocÃª terÃ¡ acesso ao dashboard especializado para moda.
              </AlertDescription>
            </div>
          </div>
          <Link href="/settings">
            <Button variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-100">
              Ver Status
            </Button>
          </Link>
        </div>
      </Alert>
    );
  }

  // Para clientes padrÃ£o, nÃ£o mostrar nada (retorna null)
  return null;
} 
