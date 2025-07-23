'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import {
  Database,
  Settings,
  Users,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Search,
  FolderSearch,
  Bot,
  Lightbulb,
  AlertCircle,
  Info,
  RefreshCcw,
  HelpCircle
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip';

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
  // Dados mock para o assistente
  const assistantAlerts = useMemo(() => [
    {
      id: 1,
      type: 'critical',
      icon: AlertCircle,
      title: 'Módulo com baixa performance',
      message: 'O módulo "banban-sales-flow" está com tempo de resposta acima de 2s',
      priority: 'high'
    },
    {
      id: 2,
      type: 'warning',
      icon: AlertTriangle,
      title: 'Inconsistência detectada',
      message: '3 implementações não possuem módulo base ativo',
      priority: 'medium'
    },
    {
      id: 3,
      type: 'tip',
      icon: Lightbulb,
      title: 'Dica de otimização',
      message: 'Considere arquivar módulos não utilizados há mais de 30 dias',
      priority: 'low'
    },
    {
      id: 4,
      type: 'info',
      icon: Info,
      title: 'Atualização disponível',
      message: 'Nova versão do sistema de módulos disponível (v2.1.3)',
      priority: 'medium'
    }
  ], []);

  // Memoizar estatísticas derivadas para evitar recálculos desnecessários
  const derivedStats = useMemo(() => {
    if (!stats) return null;

    const { overview, implementationsByType, adoptionByModule, orphanModules } = stats;

    // Calcular estatísticas derivadas
    const avgAdoptionRate = adoptionByModule.length > 0
      ? adoptionByModule.reduce((sum, module) => sum + module.adoptionRate, 0) / adoptionByModule.length
      : 0;

    const topAdoptedModule = adoptionByModule.reduce((max, module) =>
      module.adoptionRate > max.adoptionRate ? module : max,
      { adoptionRate: 0, moduleName: 'N/A' }
    );

    return {
      overview,
      implementationsByType,
      adoptionByModule,
      orphanModules,
      avgAdoptionRate,
      topAdoptedModule
    };
  }, [stats]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  // Não fazer return early - renderizar widgets estáticos mesmo sem dados dinâmicos

  return (
    <div className="grid grid-cols-2 gap-4 inline-flex items-start">
      {/* Card de Overview - DINÂMICO com dados reais */}
      <Card size="sm" variant="rounded">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Overview Geral
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {derivedStats ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 bg-[hsl(var(--secondary))] py-2 px-3 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Módulos Base</p>
                  <p className="text-lg font-semibold">{derivedStats.overview.totalBaseModules}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-[hsl(var(--secondary))] py-2 px-3 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Implementações</p>
                  <p className="text-lg font-semibold">{derivedStats.overview.totalImplementations}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-[hsl(var(--secondary))] py-2 px-3 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Atribuições</p>
                  <p className="text-lg font-semibold">{derivedStats.overview.totalActiveAssignments}</p>
                </div>
              </div>

              <div className={`flex items-center gap-2 py-2 px-3 rounded-lg ${derivedStats.overview.healthScore > 90 ? 'bg-[hsl(var(--light-success))]' : 'bg-[hsl(var(--light-warning))]'}`}>
                <div>
                  <p className="text-xs text-muted-foreground">Saúde</p>
                  <div className="flex items-center gap-1">
                    <p className="text-lg font-semibold">{derivedStats.overview.healthScore}%</p>
                    {derivedStats.overview.healthScore > 90 ? (
                      <CheckCircle2 className="w-3 h-3 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-3 h-3 text-yellow-600" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                {loading ? "Carregando dados..." : "Não foi possível carregar as estatísticas."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card de Alertas - DINÂMICO (apenas se há módulos órfãos reais) */}
      {/* {derivedStats && derivedStats.orphanModules.length > 0 && (
        <Card className="border-orange-200 bg-orange-50" size="sm" variant="rounded">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2 text-orange-700">
              <AlertTriangle className="w-4 h-4" />
              Módulos Órfãos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {derivedStats.orphanModules.slice(0, 3).map(module => (
                <div key={module.id} className="flex justify-between items-center">
                  <span className="text-sm">{module.name}</span>
                  <Badge variant="outline" className="text-orange-600 border-orange-300">
                    {module.category}
                  </Badge>
                </div>
              ))}
              {derivedStats.orphanModules.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  +{derivedStats.orphanModules.length - 3} outros módulos órfãos
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )} */}

      {/* Card de Scan de Módulos - ESTÁTICO (dados mock) */}
      <Card size="sm" variant="rounded">
        <CardHeader>
          <CardTitle className="flex items-center">
            Scanner de Módulos
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Varredura para detectar novos módulos no projeto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Última varredura:</span>
              <span className="font-medium">Nunca executada</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Novos encontrados:</span>
              <Badge variant="secondary" className="text-xs">0</Badge>
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            className="w-full mt-3 text-xs"
            leftIcon={<FolderSearch className="w-3 h-3" />}
            onClick={() => {
              // Placeholder - função será implementada futuramente
              console.log('Scan de módulos iniciado...');
            }}
          >
            Iniciar Varredura
          </Button>
        </CardContent>
      </Card>

      {/* Card do Assistente - ESTÁTICO (dados mock) */}
      <Card size="sm" variant="rounded">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Assistente</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => console.log('Abrir assistente...')}>
                    <RefreshCcw className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Atualizar insights</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Alertas, dicas e recomendações inteligentes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {assistantAlerts.map((alert) => {
              const IconComponent = alert.icon;
              const getAlertColor = (type: string) => {
                switch (type) {
                  case 'critical': return 'text-red-600';
                  case 'warning': return 'text-yellow-600';
                  case 'tip': return 'text-blue-600';
                  case 'info': return 'text-gray-600';
                  default: return 'text-gray-600';
                }
              };

              const getBadgeVariant = (priority: string) => {
                switch (priority) {
                  case 'high': return 'destructive';
                  case 'medium': return 'secondary';
                  case 'low': return 'outline';
                  default: return 'secondary';
                }
              };

              const getPriorityLabel = (priority: string) => {
                switch (priority) {
                  case 'high': return 'Alta';
                  case 'medium': return 'Média';
                  case 'low': return 'Baixa';
                  default: return priority;
                }
              };

              return (
                <div
                  key={alert.id}
                  className="flex items-start gap-2 p-2 rounded-md bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--accent))] transition-colors cursor-pointer"
                >
                  <span
                    className={`
                    w-2 h-2 mt-1 rounded-full inline-block
                    ${alert.type === 'critical' ? 'bg-[hsl(var(--destructive))]' : ''}
                    ${alert.type === 'warning' ? 'bg-[hsl(var(--warning))]' : ''}
                    ${alert.type === 'tip' ? 'bg-[hsl(var(--info))]' : ''}
                    ${alert.type === 'info' ? 'bg-[hsl(var(--muted-foreground))]' : ''}
                  `}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium truncate">{alert.title}</p>
                      <Badge
                        variant={getBadgeVariant(alert.priority)}
                        className="text-xs h-4 px-1"
                      >
                        {getPriorityLabel(alert.priority)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {alert.message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-border/40">
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>{assistantAlerts.length} alertas ativos</span>
              <Button
                className="text-blue-600 hover:text-blue-700 font-medium"
                variant="link"
                size="sm"
                onClick={() => {
                  console.log('Ver todos os alertas...');
                }}
              >
                Ver todos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}