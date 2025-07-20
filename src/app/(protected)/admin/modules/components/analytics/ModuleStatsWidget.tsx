'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Skeleton } from '@/shared/ui/skeleton';
import { 
  Database, 
  Settings, 
  Users, 
  Activity, 
  TrendingUp,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

interface ModuleStatsV2 {
  overview: {
    totalBaseModules: number;
    totalImplementations: number;
    totalActiveAssignments: number;
    totalOrganizations: number;
    healthScore: number;
  };
  implementationsByType: Record<string, number>;
  adoptionByModule: Array<{
    moduleId: string;
    moduleName: string;
    category: string;
    totalTenants: number;
    adoptionRate: number;
    assignments: number;
  }>;
  orphanModules: Array<{
    id: string;
    name: string;
    category: string;
  }>;
  implementationCoverage: number;
}

interface ModuleStatsWidgetProps {
  stats: ModuleStatsV2 | null;
  loading: boolean;
}

export function ModuleStatsWidget({ stats, loading }: ModuleStatsWidgetProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            Não foi possível carregar as estatísticas.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { overview, implementationsByType, adoptionByModule, orphanModules } = stats;

  // Calcular estatísticas derivadas
  const avgAdoptionRate = adoptionByModule.length > 0 
    ? adoptionByModule.reduce((sum, module) => sum + module.adoptionRate, 0) / adoptionByModule.length 
    : 0;

  const topAdoptedModule = adoptionByModule.reduce((max, module) => 
    module.adoptionRate > max.adoptionRate ? module : max, 
    { adoptionRate: 0, moduleName: 'N/A' }
  );

  return (
    <div className="space-y-4">
      {/* Card de Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Overview Geral
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">Módulos Base</p>
                <p className="text-lg font-semibold">{overview.totalBaseModules}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-purple-500" />
              <div>
                <p className="text-xs text-muted-foreground">Implementações</p>
                <p className="text-lg font-semibold">{overview.totalImplementations}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">Assignments</p>
                <p className="text-lg font-semibold">{overview.totalActiveAssignments}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              <div>
                <p className="text-xs text-muted-foreground">Saúde</p>
                <p className="text-lg font-semibold text-green-600">{overview.healthScore}%</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card de Implementações por Tipo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Implementações por Tipo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(implementationsByType).map(([type, count]) => (
              <div key={type} className="flex justify-between items-center">
                <span className="text-sm capitalize">{type}</span>
                <Badge variant="secondary">{count}</Badge>
              </div>
            ))}
            {Object.keys(implementationsByType).length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma implementação encontrada</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Card de Adoção */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Taxa de Adoção</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm">Média Geral:</span>
            <Badge variant={avgAdoptionRate > 50 ? "default" : "secondary"}>
              {Math.round(avgAdoptionRate)}%
            </Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm">Mais Adotado:</span>
            <div className="text-right">
              <p className="text-sm font-medium">{topAdoptedModule.moduleName}</p>
              <p className="text-xs text-muted-foreground">{Math.round(topAdoptedModule.adoptionRate)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card de Alertas */}
      {orphanModules.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2 text-orange-700">
              <AlertTriangle className="w-4 h-4" />
              Módulos Órfãos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {orphanModules.slice(0, 3).map(module => (
                <div key={module.id} className="flex justify-between items-center">
                  <span className="text-sm">{module.name}</span>
                  <Badge variant="outline" className="text-orange-600 border-orange-300">
                    {module.category}
                  </Badge>
                </div>
              ))}
              {orphanModules.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  +{orphanModules.length - 3} outros módulos órfãos
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Card de Status Geral */}
      <Card className={`border-2 ${overview.healthScore > 90 ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            {overview.healthScore > 90 ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            )}
            <div>
              <p className="text-sm font-medium">
                {overview.healthScore > 90 ? 'Sistema Saudável' : 'Atenção Necessária'}
              </p>
              <p className="text-xs text-muted-foreground">
                {overview.healthScore > 90 
                  ? 'Todos os módulos estão funcionando corretamente'
                  : 'Alguns módulos precisam de atenção'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}