'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import {
  BarChart3,
  TrendingUp,
  Users,
  FileText,
  ArrowRight,
  Activity,
  PieChart,
  LineChart
} from 'lucide-react';
import { Layout } from '@/shared/components/Layout';
import { ModuleStatsWidget } from '../components/analytics/ModuleStatsWidget';

/**
 * Dashboard da Área de Estatísticas
 * 
 * Responsabilidades:
 * - Analytics avançadas de uso de módulos
 * - Relatórios de performance e adoção
 * - Métricas de negócio e insights
 * - Dashboards executivos
 * 
 * Sub-áreas:
 * - Performance: Métricas técnicas e otimização
 * - Uso: Analytics de adoção e comportamento
 * - Relatórios: Dashboards executivos e exports
 */

interface StatsCard {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<any>;
  color: string;
  primaryMetric?: {
    label: string;
    value: string | number;
    trend?: 'up' | 'down' | 'stable';
  };
  secondaryMetrics?: {
    label: string;
    value: string | number;
  }[];
}

export default function EstatisticasAreaDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Carregar estatísticas
  useEffect(() => {
    const loadStats = async () => {
      try {
        const { getBaseModuleStats } = await import('@/app/actions/admin/modules/base-modules');
        const result = await getBaseModuleStats();
        
        if (result.success) {
          setStats(result.data);
        }
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const statsCards: StatsCard[] = [
    {
      title: 'Análise de Performance',
      description: 'Métricas técnicas, tempos de carregamento e otimizações de performance',
      href: '/admin/modules/statistics/performance',
      icon: LineChart,
      color: 'blue',
      primaryMetric: {
        label: 'Score de Performance',
        value: `${stats?.overview?.healthScore || 0}%`,
        trend: 'stable'
      },
      secondaryMetrics: [
        { label: 'Cobertura', value: `${stats?.implementationCoverage || 0}%` },
        { label: 'Tempo Médio', value: '120ms' }
      ]
    },
    {
      title: 'Analytics de Uso',
      description: 'Padrões de adoção, usuários ativos e comportamento de uso dos módulos',
      href: '/admin/modules/statistics/usage',
      icon: Users,
      color: 'green',
      primaryMetric: {
        label: 'Taxa de Adoção',
        value: stats?.adoptionByModule ? 
          `${Math.round(stats.adoptionByModule.reduce((sum, m) => sum + m.adoptionRate, 0) / stats.adoptionByModule.length)}%` : 
          '0%',
        trend: 'up'
      },
      secondaryMetrics: [
        { label: 'Organizações Ativas', value: stats?.overview?.totalOrganizations || 0 },
        { label: 'Módulos Populares', value: stats?.adoptionByModule?.filter(m => m.adoptionRate > 50).length || 0 }
      ]
    },
    {
      title: 'Relatórios Executivos',
      description: 'Dashboards de alto nível, exports e insights para tomada de decisão',
      href: '/admin/modules/statistics/reports',
      icon: FileText,
      color: 'purple',
      primaryMetric: {
        label: 'Módulos Ativos',
        value: stats?.overview?.totalBaseModules || 0,
        trend: 'stable'
      },
      secondaryMetrics: [
        { label: 'Implementações', value: stats?.overview?.totalImplementations || 0 },
        { label: 'Atribuições', value: stats?.overview?.totalActiveAssignments || 0 }
      ]
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: {
        icon: 'text-blue-500',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        button: 'from-blue-500 to-blue-600'
      },
      green: {
        icon: 'text-green-500',
        bg: 'bg-green-50',
        border: 'border-green-200',
        button: 'from-green-500 to-green-600'
      },
      purple: {
        icon: 'text-purple-500',
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        button: 'from-purple-500 to-purple-600'
      }
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <Layout loading={loading}>
      <Layout.Header>
        <Layout.Breadcrumbs items={[
          { title: 'Admin' },
          { title: 'Módulos', href: '/admin/modules' },
          { title: 'Estatísticas' }
        ]} />
        <Layout.Actions>
          <Button variant="outline" asChild>
            <Link href="/admin/modules">
              Voltar à Overview
            </Link>
          </Button>
        </Layout.Actions>
      </Layout.Header>

      <Layout.Body>
        <Layout.Sidebar width="w-80">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-lg mb-4">Resumo Executivo</h3>
              <ModuleStatsWidget
                stats={stats}
                loading={loading}
              />
            </div>

            {/* KPIs Principais */}
            {stats && (
              <Card size="sm">
                <CardHeader>
                  <CardTitle className="text-sm">KPIs Principais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Saúde Geral</span>
                    <Badge variant={stats.overview.healthScore > 80 ? 'default' : 'destructive'}>
                      {stats.overview.healthScore}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cobertura</span>
                    <Badge variant="outline">
                      {stats.implementationCoverage || 0}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Órfãos</span>
                    <Badge variant={stats.orphanModules?.length > 0 ? 'destructive' : 'default'}>
                      {stats.orphanModules?.length || 0}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </Layout.Sidebar>

        <Layout.Content>
          {/* Header da Área */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Área de Estatísticas</h1>
                <p className="text-muted-foreground">
                  Analytics avançadas, relatórios e métricas de negócio
                </p>
              </div>
            </div>

            {/* Overview de Métricas */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card size="sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <PieChart className="h-8 w-8 text-blue-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">Taxa Adoção</p>
                        <p className="text-2xl font-bold">
                          {stats.adoptionByModule ? 
                            `${Math.round(stats.adoptionByModule.reduce((sum, m) => sum + m.adoptionRate, 0) / stats.adoptionByModule.length)}%` : 
                            '0%'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card size="sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-8 w-8 text-green-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">Performance</p>
                        <p className="text-2xl font-bold">{stats.overview.healthScore}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card size="sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Users className="h-8 w-8 text-purple-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">Organizações</p>
                        <p className="text-2xl font-bold">{stats.overview.totalOrganizations}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card size="sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Activity className="h-8 w-8 text-orange-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">Cobertura</p>
                        <p className="text-2xl font-bold">{stats.implementationCoverage || 0}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Cards de Navegação */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {statsCards.map((card) => {
              const colorClasses = getColorClasses(card.color);
              
              return (
                <Card 
                  key={card.title} 
                  className={`relative overflow-hidden group hover:shadow-lg transition-all duration-200 ${colorClasses.border} ${colorClasses.bg}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-white shadow-sm flex items-center justify-center">
                          <card.icon className={`h-6 w-6 ${colorClasses.icon}`} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{card.title}</CardTitle>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                    <CardDescription className="mt-2">
                      {card.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Métrica Principal */}
                    {card.primaryMetric && (
                      <div className="p-3 bg-white/50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{card.primaryMetric.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold">{card.primaryMetric.value}</span>
                            {card.primaryMetric.trend && (
                              <Badge variant={card.primaryMetric.trend === 'up' ? 'default' : 'secondary'} size="sm">
                                {card.primaryMetric.trend === 'up' ? '↗' : card.primaryMetric.trend === 'down' ? '↘' : '→'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Métricas Secundárias */}
                    {card.secondaryMetrics && (
                      <div className="grid grid-cols-2 gap-2">
                        {card.secondaryMetrics.map((metric, index) => (
                          <div key={index} className="text-center p-2 bg-white/30 rounded">
                            <p className="text-xs text-muted-foreground">{metric.label}</p>
                            <p className="text-sm font-semibold">{metric.value}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Botão Principal */}
                    <Button 
                      className={`w-full bg-gradient-to-r ${colorClasses.button} hover:shadow-lg`}
                      asChild
                    >
                      <Link href={card.href}>
                        Ver {card.title}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Insights Automáticos */}
          <Card className="mt-8 border-indigo-200 bg-indigo-50">
            <CardHeader>
              <CardTitle className="text-indigo-800">Insights Automáticos</CardTitle>
              <CardDescription className="text-indigo-700">
                Análises e recomendações baseadas nos dados coletados.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-indigo-700">
                <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Sistema de insights inteligentes em desenvolvimento</p>
              </div>
            </CardContent>
          </Card>
        </Layout.Content>
      </Layout.Body>
    </Layout>
  );
}