'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { AlertTriangle, Lightbulb, TrendingUp, Target } from 'lucide-react';
import { BaseWidget, type WidgetProps } from '@/shared/components/widgets/BaseWidget';

interface Insight {
  id: string;
  type: 'opportunity' | 'risk' | 'trend' | 'recommendation';
  title: string;
  description: string;
  confidence_score: number;
  impact_score: 'low' | 'medium' | 'high' | 'critical';
  metrics: Record<string, string>;
  created_at: string;
}

interface InsightsSummary {
  total_insights: number;
  high_priority: number;
  categories: {
    opportunity: number;
    risk: number;
    trend: number;
    recommendation: number;
  };
}

interface InsightsData {
  insights: Insight[];
  summary: InsightsSummary;
}

function InsightTypeIcon({ type }: { type: Insight['type'] }) {
  switch (type) {
    case 'opportunity':
      return <Lightbulb className="h-4 w-4 text-green-500" />;
    case 'risk':
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case 'trend':
      return <TrendingUp className="h-4 w-4 text-blue-500" />;
    case 'recommendation':
      return <Target className="h-4 w-4 text-purple-500" />;
  }
}

function ImpactBadge({ score }: { score: Insight['impact_score'] }) {
  const variants: Record<Insight['impact_score'], string> = {
    low: 'secondary',
    medium: 'warning',
    high: 'destructive',
    critical: 'destructive'
  };

  return (
    <Badge variant={variants[score]} className="ml-2">
      {score.charAt(0).toUpperCase() + score.slice(1)}
    </Badge>
  );
}

function ConfidenceScore({ score }: { score: number }) {
  let color = 'text-red-500';
  if (score >= 90) color = 'text-green-500';
  else if (score >= 70) color = 'text-yellow-500';

  return (
    <div className={`text-sm font-medium ${color}`}>
      {score}% confiança
    </div>
  );
}

function InsightMetrics({ metrics }: { metrics: Record<string, string> }) {
  return (
    <div className="grid grid-cols-2 gap-2 mt-2">
      {Object.entries(metrics).map(([key, value]) => (
        <div key={key} className="text-sm">
          <span className="text-muted-foreground">{key}:</span>{' '}
          <span className="font-medium">{value}</span>
        </div>
      ))}
    </div>
  );
}

function InsightsBoardWidget({ data, loading, error }: WidgetProps<InsightsData>) {
  if (loading) {
    return <div>Carregando...</div>;
  }

  if (error) {
    return <div>Erro ao carregar dados: {error}</div>;
  }

  if (!data) {
    return <div>Nenhum dado disponível</div>;
  }

  return (
    <div className="grid gap-4">
      {/* Sumário */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Resumo de Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total de Insights</p>
              <p className="text-2xl font-bold">{data.summary.total_insights}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Alta Prioridade</p>
              <p className="text-2xl font-bold text-red-500">{data.summary.high_priority}</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-4">
            {Object.entries(data.summary.categories).map(([category, count]) => (
              <div key={category} className="text-center">
                <Badge variant="secondary" className="mb-1">
                  {count}
                </Badge>
                <p className="text-xs text-muted-foreground capitalize">{category}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Insights */}
      <div className="space-y-4">
        {data.insights.map((insight) => (
          <Card key={insight.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <InsightTypeIcon type={insight.type} />
                  <CardTitle className="text-sm font-medium">{insight.title}</CardTitle>
                </div>
                <ImpactBadge score={insight.impact_score} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{insight.description}</p>
              <InsightMetrics metrics={insight.metrics} />
              <div className="flex justify-between items-center mt-4">
                <ConfidenceScore score={insight.confidence_score} />
                <span className="text-xs text-muted-foreground">
                  {new Date(insight.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default BaseWidget(InsightsBoardWidget); 