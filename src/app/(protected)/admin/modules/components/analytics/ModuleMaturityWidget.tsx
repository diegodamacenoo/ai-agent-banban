'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Progress } from '@/shared/ui/progress';
import { TrendingUp, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface MaturityMetrics {
  currentStage: string;
  stageProgress: number;
  nextMilestone: string;
  timeInCurrentStage: number; // days
  completedStages: string[];
  blockers: string[];
}

interface ModuleMaturityWidgetProps {
  moduleId: string;
}

const MATURITY_STAGES = [
  'PLANNED',
  'IN_DEVELOPMENT', 
  'ALPHA',
  'BETA',
  'RC',
  'GA',
  'MAINTENANCE'
];

const STAGE_LABELS: Record<string, string> = {
  'PLANNED': 'Planejamento',
  'IN_DEVELOPMENT': 'Desenvolvimento',
  'ALPHA': 'Alpha',
  'BETA': 'Beta',
  'RC': 'Release Candidate',
  'GA': 'Produção',
  'MAINTENANCE': 'Manutenção'
};

export function ModuleMaturityWidget({ moduleId }: ModuleMaturityWidgetProps) {
  const [metrics, setMetrics] = useState<MaturityMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMaturityMetrics();
    
    // Auto-refresh every 10 minutes
    const interval = setInterval(fetchMaturityMetrics, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [moduleId]);

  const fetchMaturityMetrics = async () => {
    try {
      // TODO: Replace with actual API call
      const mockMetrics: MaturityMetrics = {
        currentStage: 'BETA',
        stageProgress: 75,
        nextMilestone: 'Release Candidate',
        timeInCurrentStage: 45,
        completedStages: ['PLANNED', 'IN_DEVELOPMENT', 'ALPHA'],
        blockers: ['Testes de performance pendentes', 'Documentação incompleta']
      };
      
      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Failed to fetch maturity metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStageIndex = () => {
    return metrics ? MATURITY_STAGES.indexOf(metrics.currentStage) : 0;
  };

  const getOverallProgress = () => {
    if (!metrics) return 0;
    const currentIndex = getCurrentStageIndex();
    const baseProgress = (currentIndex / MATURITY_STAGES.length) * 100;
    const stageProgress = (metrics.stageProgress / 100) * (100 / MATURITY_STAGES.length);
    return Math.min(baseProgress + stageProgress, 100);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Maturidade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-zinc-200 rounded w-3/4"></div>
            <div className="h-2 bg-zinc-200 rounded w-full"></div>
            <div className="h-4 bg-zinc-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-zinc-600" />
          Maturidade
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Stage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Estágio Atual</span>
            <Badge variant="secondary">
              {STAGE_LABELS[metrics.currentStage]}
            </Badge>
          </div>
          
          <Progress value={metrics.stageProgress} className="h-2" />
          
          <div className="text-xs text-zinc-500 text-center">
            {metrics.stageProgress}% completo
          </div>
        </div>

        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Progresso Geral</div>
          <Progress value={getOverallProgress()} className="h-2" />
          <div className="text-xs text-zinc-500 text-center">
            {getOverallProgress().toFixed(0)}% até GA
          </div>
        </div>

        {/* Next Milestone */}
        <div className="pt-3 border-t">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">Próximo Marco</span>
          </div>
          <div className="text-sm text-zinc-600">{metrics.nextMilestone}</div>
        </div>

        {/* Time in Stage */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-zinc-500" />
            <span>Tempo no estágio</span>
          </div>
          <span className="font-medium">{metrics.timeInCurrentStage} dias</span>
        </div>

        {/* Blockers */}
        {metrics.blockers.length > 0 && (
          <div className="pt-3 border-t">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium">Bloqueadores</span>
              <Badge variant="warning" className="text-xs">
                {metrics.blockers.length}
              </Badge>
            </div>
            <div className="space-y-1">
              {metrics.blockers.slice(0, 2).map((blocker, index) => (
                <div key={index} className="text-xs text-zinc-600 bg-amber-50 p-2 rounded">
                  {blocker}
                </div>
              ))}
              {metrics.blockers.length > 2 && (
                <div className="text-xs text-zinc-500 text-center">
                  +{metrics.blockers.length - 2} mais
                </div>
              )}
            </div>
          </div>
        )}

        {/* Completed Stages */}
        <div className="pt-3 border-t">
          <div className="text-xs font-medium text-zinc-700 mb-2">Estágios Concluídos</div>
          <div className="flex flex-wrap gap-1">
            {metrics.completedStages.map((stage) => (
              <Badge key={stage} variant="outline" className="text-xs">
                {STAGE_LABELS[stage]}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}