/**
 * ModuleNotFound - Página para módulos não encontrados
 * Fase 4 - Route Simplification
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { 
  Package, 
  Home, 
  Search,
  ExternalLink,
  Settings
} from 'lucide-react';
import Link from 'next/link';
import { Organization } from '../lib/route-helpers';

interface ModuleNotFoundProps {
  moduleSlug: string;
  organization: Organization;
  availableModules: Array<{
    slug: string;
    name: string;
    description?: string;
    icon?: string;
  }>;
}

/**
 * Página elegante para módulos não encontrados com sugestões
 */
export const ModuleNotFound: React.FC<ModuleNotFoundProps> = ({
  moduleSlug,
  organization,
  availableModules
}) => {
  // Sugerir módulos similares baseado no nome
  const getSimilarModules = () => {
    if (availableModules.length === 0) return [];
    
    return availableModules
      .filter(module => {
        const similarity = calculateSimilarity(moduleSlug, module.slug);
        return similarity > 0.3; // 30% de similaridade mínima
      })
      .sort((a, b) => {
        const simA = calculateSimilarity(moduleSlug, a.slug);
        const simB = calculateSimilarity(moduleSlug, b.slug);
        return simB - simA;
      })
      .slice(0, 4);
  };

  const similarModules = getSimilarModules();

  return (
    <div className="container max-w-4xl mx-auto p-6">
      <Card className="bg-orange-50 border-orange-200">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-orange-600" />
          </div>
          
          <CardTitle className="text-xl text-orange-800">
            Módulo não encontrado
          </CardTitle>
          
          <p className="text-muted-foreground">
            O módulo <Badge variant="outline" className="mx-1">{moduleSlug}</Badge> 
            não está disponível para sua organização.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Informações da organização */}
          <div className="bg-white rounded-lg p-4 border">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Informações da Organização
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Nome:</span>
                <p className="font-medium">{organization.name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Tipo de Cliente:</span>
                <p>
                  <Badge variant="secondary">{organization.client_type}</Badge>
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <p>
                  <Badge variant={organization.is_implementation_complete ? "default" : "secondary"}>
                    {organization.is_implementation_complete ? 'Completo' : 'Em Implementação'}
                  </Badge>
                </p>
              </div>
            </div>
          </div>

          {/* Módulos similares */}
          {similarModules.length > 0 && (
            <div className="bg-white rounded-lg p-4 border">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Search className="w-4 h-4" />
                Você quis dizer...
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {similarModules.map((module) => (
                  <Card key={module.slug} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium">{module.name}</h5>
                          {module.description && (
                            <p className="text-xs text-muted-foreground">
                              {module.description}
                            </p>
                          )}
                        </div>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/${organization.slug}/${module.slug}`}>
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Acessar
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Todos os módulos disponíveis */}
          {availableModules.length > 0 && (
            <div className="bg-white rounded-lg p-4 border">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Módulos Disponíveis ({availableModules.length})
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {availableModules.map((module) => (
                  <Button
                    key={module.slug}
                    variant="outline"
                    size="sm"
                    className="justify-start h-auto p-2"
                    asChild
                  >
                    <Link href={`/${organization.slug}/${module.slug}`}>
                      <div className="text-left">
                        <div className="font-medium text-xs">{module.name}</div>
                        <div className="text-xs text-muted-foreground">
                          /{module.slug}
                        </div>
                      </div>
                    </Link>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Caso não haja módulos */}
          {availableModules.length === 0 && (
            <div className="bg-white rounded-lg p-6 border text-center">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h4 className="font-semibold mb-2">Nenhum módulo configurado</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Sua organização ainda não possui módulos configurados. 
                Entre em contato com o administrador do sistema.
              </p>
              <Button variant="outline" asChild>
                <Link href={`/${organization.slug}/settings`}>
                  <Settings className="w-4 h-4 mr-2" />
                  Configurações
                </Link>
              </Button>
            </div>
          )}

          {/* Ações principais */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link href={`/${organization.slug}`}>
                <Home className="w-4 h-4 mr-2" />
                Voltar ao Dashboard
              </Link>
            </Button>
            
            <Button variant="outline" asChild>
              <Link href={`/${organization.slug}/settings`}>
                <Settings className="w-4 h-4 mr-2" />
                Configurações
              </Link>
            </Button>
          </div>

          {/* Debug info para desenvolvimento */}
          {process.env.NODE_ENV === 'development' && (
            <details className="bg-gray-100 rounded p-3">
              <summary className="cursor-pointer font-medium text-sm">
                Debug Info (desenvolvimento)
              </summary>
              <pre className="mt-2 text-xs overflow-auto">
                {JSON.stringify({
                  requestedModule: moduleSlug,
                  organization: {
                    id: organization.id,
                    slug: organization.slug,
                    client_type: organization.client_type
                  },
                  availableModulesCount: availableModules.length,
                  availableModules: availableModules.map(m => m.slug),
                  similarModules: similarModules.map(m => m.slug),
                  timestamp: new Date().toISOString()
                }, null, 2)}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Calcula similaridade entre duas strings usando algoritmo simples
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  // Verificar se uma string está contida na outra
  if (s1.includes(s2) || s2.includes(s1)) {
    return 0.8;
  }
  
  // Algoritmo de Levenshtein simplificado
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) {
    return 1.0;
  }
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

export default ModuleNotFound;