'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Progress } from '@/shared/ui/progress';
import { 
  Activity, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Package,
  FileX,
  Archive,
  Scan,
  TrendingUp,
  Play,
  Info
} from 'lucide-react';
import { useToast } from '@/shared/ui/toast';
import { getAllModulesWithOrganizationAssignments, ModuleWithOrganizations } from '@/app/actions/admin/modules/module-organization-data';
import { ModuleHealthStats } from '@/shared/types/module-lifecycle';
import { Tooltip, TooltipTrigger, TooltipProvider, TooltipContent } from '@/shared/ui/tooltip';

interface ModuleHealthCardProps {
  onHealthUpdate?: (stats: ModuleHealthStats) => void;
}

export function ModuleHealthCard({ onHealthUpdate }: ModuleHealthCardProps) {
  const { toast } = useToast();
  const [stats, setStats] = useState<ModuleHealthStats>({
    discovered: 0,
    implemented: 0,
    active: 0,
    planned: 0,
    missing: 0,
    orphaned: 0,
    archived: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<string | null>(null);

  // Carregar estatísticas usando dados existentes
  const loadHealthStats = async () => {
    try {
      setLoading(true);
      const response = await getAllModulesWithOrganizationAssignments();
      
      if (response.success && response.data) {
        const allModulesWithOrgs = response.data;

        let discoveredCount = allModulesWithOrgs.length;
        let implementedCount = 0;
        let activeCount = 0;
        let plannedCount = 0;
        let archivedCount = 0;

        allModulesWithOrgs.forEach(module => {
          const hasAssignments = module.organizations && module.organizations.length > 0;
          
          if (hasAssignments) {
            let isImplemented = false;
            let isActive = false;
            let isArchived = false;

            module.organizations.forEach(org => {
              if (org.status === 'ENABLED' || org.status === 'PROVISIONING') {
                isImplemented = true;
              }
              if (org.status === 'ENABLED') {
                isActive = true;
              }
              if (org.status === 'ARCHIVED') {
                isArchived = true;
              }
            });

            if (isImplemented) implementedCount++;
            if (isActive) activeCount++;
            if (isArchived) archivedCount++;

          } else {
            plannedCount++;
          }
        });

        const newStats: ModuleHealthStats = {
          discovered: discoveredCount,
          implemented: implementedCount,
          active: activeCount,
          planned: plannedCount,
          missing: 0, // Lógica para 'missing' e 'orphaned' requer mais contexto (ex: verificação de arquivos no sistema de arquivos vs. DB)
          orphaned: 0, // Manter como 0 por enquanto
          archived: archivedCount,
          total: discoveredCount
        };
        
        setStats(newStats);
        onHealthUpdate?.(newStats);
        
        // Atualizar timestamp do último scan
        const now = new Date();
        setLastScan(now.toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }));
      } else {
        console.warn('Erro ao carregar estatísticas:', response.error);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas de health:', error);
    } finally {
      setLoading(false);
    }
  };

  // Executar escaneamento real de módulos
  const handleFullScan = async () => {
    try {
      setScanning(true);
      
      toast.info("Analisando e registrando módulos descobertos...", {
        title: "Escaneamento iniciado",
      });

      // Chamar scanner real usando fetch para a API
      const response = await fetch('/api/admin/modules/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Recarregar estatísticas após scanner
        await loadHealthStats();
        
        toast.success(`Scanner processou ${result.data?.discovered || 0} módulos com sucesso.`, {
          title: "Escaneamento concluído",
        });
      } else {
        throw new Error(result.error || 'Erro no escaneamento');
      }
    } catch (error) {
      console.error('Erro durante escaneamento:', error);
      toast.error(error instanceof Error ? error.message : "Não foi possível completar o escaneamento.", {
        title: "Erro no escaneamento",
      });
    } finally {
      setScanning(false);
    }
  };

  // Carregar dados ao montar
  useEffect(() => {
    loadHealthStats();
    
    // Auto-refresh a cada 5 minutos
    const interval = setInterval(loadHealthStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Calcular porcentagens
  const healthyCount = stats.active + stats.implemented;
  const problematicCount = stats.missing + stats.orphaned;
  const healthPercentage = stats.total > 0 ? Math.round((healthyCount / stats.total) * 100) : 0;

  const statusItems = [
    {
      label: 'Descobertos',
      count: stats.discovered,
      icon: Package,
      color: 'bg-blue-100 text-blue-800',
      description: 'Novos módulos encontrados'
    },
    {
      label: 'Implementados', 
      count: stats.implemented,
      icon: CheckCircle,
      color: 'bg-green-100 text-green-800',
      description: 'Funcionando corretamente'
    },
    {
      label: 'Ativos',
      count: stats.active, 
      icon: Play,
      color: 'bg-emerald-100 text-emerald-800',
      description: 'Em produção'
    },
    {
      label: 'Planejados',
      count: stats.planned, 
      icon: Package,
      color: 'bg-yellow-100 text-yellow-800',
      description: 'Aguardando implementação'
    },
    {
      label: 'Ausentes',
      count: stats.missing,
      icon: FileX,
      color: 'bg-red-100 text-red-800',
      description: 'Arquivos não encontrados'
    },
    {
      label: 'Órfãos',
      count: stats.orphaned,
      icon: AlertTriangle,
      color: 'bg-orange-100 text-orange-800',
      description: 'Registrados mas sem arquivos'
    },
    {
      label: 'Arquivados',
      count: stats.archived,
      icon: Archive,
      color: 'bg-gray-100 text-gray-800',
      description: 'Desabilitados'
    }
  ];

  return (
    <Card variant="default" size="sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Scanner de Módulos
              <TooltipProvider>
                <Tooltip >
                  <TooltipTrigger>
                    <Info className="h-4 w-4" />
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium" >
                        Sistema de Ciclo de Vida dos Módulos
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Escaneamento automático e monitoria em tempo real serão ativados nas próximas versões.
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
            {lastScan && (
              <p className="text-sm text-muted-foreground mt-1">
                Última verificação: {lastScan}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadHealthStats}
              disabled={loading || scanning}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleFullScan}
              disabled={loading || scanning}
              className="flex items-center gap-2"
            >
              <Scan className={`h-4 w-4 ${scanning ? 'animate-spin' : ''}`} />
              {scanning ? 'Escaneando...' : 'Escanear'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {loading ? (
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Resumo Geral */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Saúde Geral</span>
                <div className="flex items-center gap-2">
                  <TrendingUp className={`h-4 w-4 ${healthPercentage >= 80 ? 'text-green-600' : 'text-orange-600'}`} />
                  <span className="text-lg font-bold">{healthPercentage}%</span>
                </div>
              </div>
              
              <Progress 
                value={healthPercentage} 
                className="h-2"
              />
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{healthyCount} saudáveis</span>
                <span>{stats.total} total</span>
                <span>{problematicCount} com problemas</span>
              </div>
            </div>

            {/* Grid de Status */}
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              {statusItems.map((item) => (
                <Card variant="ghost" size="sm"
                  key={item.label}
                  className='border border-zinc-200'
                  >
                  <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <item.icon className="h-5 w-5 text-gray-600" />
                    <Badge variant="outline" className={item.color}>
                      {item.count}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                  </CardContent>
                </Card>
              ))}
            </div>

          </>
        )}
      </CardContent>
    </Card>
  );
} 