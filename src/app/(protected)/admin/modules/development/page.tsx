'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import {
  Code2,
  Wrench,
  Monitor,
  FileCode,
  ArrowRight,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap
} from 'lucide-react';
import { Layout } from '@/shared/components/Layout';

/**
 * Dashboard da Área de Desenvolvimento de Módulos
 * 
 * Responsabilidades:
 * - Ferramentas de desenvolvimento e debug
 * - Templates e scaffolding de novos módulos
 * - Monitoramento de saúde e performance
 * - Métricas de qualidade de código
 * 
 * Sub-áreas:
 * - Ferramentas: Debug, análise de qualidade, logs
 * - Templates: Scaffolding e geração de código
 * - Monitoramento: Health checks e métricas em tempo real
 * 
 * Focado em:
 * - Produtividade dos desenvolvedores
 * - Qualidade do código
 * - Detecção precoce de problemas
 * - Automação de tarefas repetitivas
 */

interface DevToolCard {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<any>;
  color: string;
  status?: 'healthy' | 'warning' | 'error';
  metrics?: {
    label: string;
    value: string | number;
    trend?: 'up' | 'down' | 'stable';
  }[];
}

export default function DesenvolvimentoAreaDashboard() {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Carregar dados de saúde e métricas
  useEffect(() => {
    const loadHealthData = async () => {
      try {
        const { getBaseModuleStats } = await import('@/app/actions/admin/modules/base-modules');
        const result = await getBaseModuleStats();
        
        if (result.success) {
          setHealthData(result.data);
        }
      } catch (error) {
        console.error('Erro ao carregar dados de saúde:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHealthData();
  }, []);

  const devTools: DevToolCard[] = [
    {
      title: 'Ferramentas de Debug',
      description: 'Análise de qualidade, logs de desenvolvimento e ferramentas de diagnóstico',
      href: '/admin/modules/development/tools',
      icon: Wrench,
      color: 'blue',
      status: healthData?.overview?.healthScore > 80 ? 'healthy' : 'warning',
      metrics: [
        { 
          label: 'Saúde Geral', 
          value: `${healthData?.overview?.healthScore || 0}%`,
          trend: 'stable'
        },
        { 
          label: 'Módulos Órfãos', 
          value: healthData?.orphanModules?.length || 0,
          trend: healthData?.orphanModules?.length > 0 ? 'up' : 'stable'
        }
      ]
    },
    {
      title: 'Templates e Scaffolding',
      description: 'Geração automática de código, templates e estruturas de novos módulos',
      href: '/admin/modules/development/templates',
      icon: FileCode,
      color: 'green',
      status: 'healthy',
      metrics: [
        { 
          label: 'Templates Disponíveis', 
          value: 5
        },
        { 
          label: 'Módulos Gerados', 
          value: healthData?.overview?.totalBaseModules || 0
        }
      ]
    },
    {
      title: 'Monitoramento em Tempo Real',
      description: 'Health checks, métricas de performance e status operacional',
      href: '/admin/modules/development/monitoring',
      icon: Monitor,
      color: 'purple',
      status: 'healthy',
      metrics: [
        { 
          label: 'Uptime', 
          value: '99.9%',
          trend: 'stable'
        },
        { 
          label: 'Implementações Ativas', 
          value: healthData?.overview?.totalImplementations || 0
        }
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return CheckCircle2;
      case 'warning': return AlertTriangle;
      case 'error': return AlertTriangle;
      default: return Activity;
    }
  };

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
          { title: 'Desenvolvimento' }
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
              <h3 className="font-medium text-lg mb-4">Status de Desenvolvimento</h3>
              
              {/* Status Cards */}
              <div className="space-y-3">
                <Card size="sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Sistema Operacional</span>
                      </div>
                      <Badge variant="default">OK</Badge>
                    </div>
                  </CardContent>
                </Card>
                
                <Card size="sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">Performance</span>
                      </div>
                      <Badge variant="outline">Boa</Badge>
                    </div>
                  </CardContent>
                </Card>
                
                <Card size="sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-500" />
                        <span className="text-sm">Última Build</span>
                      </div>
                      <Badge variant="secondary">2min</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Ações Rápidas */}
            <Card size="sm">
              <CardHeader>
                <CardTitle className="text-sm">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start"
                  asChild
                >
                  <Link href="/admin/modules/development/tools">
                    <Wrench className="mr-2 h-4 w-4" />
                    Abrir Debug Tools
                  </Link>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start"
                  asChild
                >
                  <Link href="/admin/modules/development/templates">
                    <FileCode className="mr-2 h-4 w-4" />
                    Gerar Template
                  </Link>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start"
                  asChild
                >
                  <Link href="/admin/modules/development/monitoring">
                    <Monitor className="mr-2 h-4 w-4" />
                    Ver Métricas
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </Layout.Sidebar>

        <Layout.Content>
          {/* Header da Área */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <Code2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Área de Desenvolvimento</h1>
                <p className="text-muted-foreground">
                  Ferramentas, templates e monitoramento para desenvolvedores
                </p>
              </div>
            </div>

            {/* Métricas de Desenvolvimento */}
            {healthData && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card size="sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-8 w-8 text-green-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">Saúde Geral</p>
                        <p className="text-2xl font-bold">{healthData.overview.healthScore}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card size="sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-8 w-8 text-orange-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">Módulos Órfãos</p>
                        <p className="text-2xl font-bold">{healthData.orphanModules?.length || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card size="sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Activity className="h-8 w-8 text-blue-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">Cobertura</p>
                        <p className="text-2xl font-bold">{healthData.implementationCoverage || 0}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card size="sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Zap className="h-8 w-8 text-purple-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">Performance</p>
                        <p className="text-2xl font-bold">A+</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Cards de Ferramentas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {devTools.map((tool) => {
              const colorClasses = getColorClasses(tool.color);
              const StatusIcon = getStatusIcon(tool.status || 'healthy');
              
              return (
                <Card 
                  key={tool.title} 
                  className={`relative overflow-hidden group hover:shadow-lg transition-all duration-200 ${colorClasses.border} ${colorClasses.bg}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-white shadow-sm flex items-center justify-center">
                          <tool.icon className={`h-6 w-6 ${colorClasses.icon}`} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{tool.title}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <StatusIcon className={`h-4 w-4 ${getStatusColor(tool.status || 'healthy')}`} />
                            <Badge variant="outline" size="sm">
                              {tool.status === 'healthy' ? 'Operacional' : 
                               tool.status === 'warning' ? 'Atenção' : 'Erro'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                    <CardDescription className="mt-2">
                      {tool.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Métricas da Ferramenta */}
                    {tool.metrics && (
                      <div className="grid grid-cols-1 gap-3">
                        {tool.metrics.map((metric, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-white/50 rounded-md">
                            <span className="text-sm text-muted-foreground">{metric.label}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{metric.value}</span>
                              {metric.trend && (
                                <Badge variant={metric.trend === 'up' ? 'destructive' : 'secondary'} size="sm">
                                  {metric.trend === 'up' ? '↗' : metric.trend === 'down' ? '↘' : '→'}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Botão Principal */}
                    <Button 
                      className={`w-full bg-gradient-to-r ${colorClasses.button} hover:shadow-lg`}
                      asChild
                    >
                      <Link href={tool.href}>
                        Acessar {tool.title}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Logs de Atividade Recente */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Atividade de Desenvolvimento</CardTitle>
              <CardDescription>
                Últimas operações e eventos relacionados ao desenvolvimento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Sistema de logging em tempo real será implementado em breve</p>
              </div>
            </CardContent>
          </Card>
        </Layout.Content>
      </Layout.Body>
    </Layout>
  );
}