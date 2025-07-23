'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { ArrowLeft, Monitor, Activity, TrendingUp, Zap } from 'lucide-react';
import { Layout } from '@/shared/components/Layout';
import Link from 'next/link';

// Componentes existentes de monitoramento
import { ModuleHealthCard } from '../../components/monitoring/ModuleHealthCard';
import { RealTimeMetrics } from '../../components/monitoring/RealTimeMetrics';
import { ModuleActivityLog } from '../../components/monitoring/ModuleActivityLog';
import { ModuleDetailedAnalysis } from '../../components/monitoring/ModuleDetailedAnalysis';

/**
 * Página de Monitoramento em Tempo Real
 * 
 * Responsabilidades:
 * - Health checks dos módulos
 * - Métricas de performance em tempo real
 * - Logs de atividade e eventos
 * - Análise detalhada de comportamento
 * 
 * Seções:
 * - Health: Status geral de saúde do sistema
 * - Métricas: Performance e indicadores em tempo real
 * - Atividade: Logs e eventos recentes
 * - Análise: Deep dive em comportamentos específicos
 * 
 * Focado em:
 * - Detecção precoce de problemas
 * - Monitoramento proativo
 * - Insights de performance
 * - Alertas automáticos
 */

export default function MonitoramentoPage() {
  return (
    <Layout>
      <Layout.Header>
        <Layout.Breadcrumbs items={[
          { title: 'Admin' },
          { title: 'Módulos', href: '/admin/modules' },
          { title: 'Desenvolvimento', href: '/admin/modules/desenvolvimento' },
          { title: 'Monitoramento' }
        ]} />
        <Layout.Actions>
          <Button variant="outline" asChild>
            <Link href="/admin/modules/desenvolvimento">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Desenvolvimento
            </Link>
          </Button>
        </Layout.Actions>
      </Layout.Header>

      <Layout.Body>
        <Layout.Content>
          {/* Header da Página */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <Monitor className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Monitoramento em Tempo Real</h1>
                <p className="text-muted-foreground">
                  Health checks, métricas de performance e análise de comportamento
                </p>
              </div>
            </div>
          </div>

          {/* Tabs de Monitoramento */}
          <Tabs defaultValue="health" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="health" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Health
              </TabsTrigger>
              <TabsTrigger value="metricas" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Métricas
              </TabsTrigger>
              <TabsTrigger value="atividade" className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                Atividade
              </TabsTrigger>
              <TabsTrigger value="analise" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Análise
              </TabsTrigger>
            </TabsList>

            {/* Aba: Health */}
            <TabsContent value="health" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Status de Saúde do Sistema
                  </CardTitle>
                  <CardDescription>
                    Indicadores gerais de saúde e status operacional dos módulos.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ModuleHealthCard />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba: Métricas */}
            <TabsContent value="metricas" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Métricas em Tempo Real
                  </CardTitle>
                  <CardDescription>
                    Performance, utilização e indicadores técnicos atualizados em tempo real.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RealTimeMetrics />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba: Atividade */}
            <TabsContent value="atividade" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    Log de Atividades
                  </CardTitle>
                  <CardDescription>
                    Histórico de eventos, operações e mudanças no sistema de módulos.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ModuleActivityLog />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba: Análise */}
            <TabsContent value="analise" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Análise Detalhada
                  </CardTitle>
                  <CardDescription>
                    Deep dive em comportamentos específicos e análise avançada de performance.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ModuleDetailedAnalysis />
                </CardContent>
              </Card>

              {/* Alertas e Recomendações */}
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="text-orange-800">Alertas Inteligentes</CardTitle>
                  <CardDescription className="text-orange-700">
                    O sistema monitora automaticamente e sugere otimizações.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-orange-700">
                    <p><strong>Detecção de Anomalias:</strong> Padrões incomuns de uso ou performance</p>
                    <p><strong>Recomendações:</strong> Sugestões automáticas de melhoria</p>
                    <p><strong>Alertas Proativos:</strong> Notificações antes de problemas críticos</p>
                    <p><strong>Insights de Otimização:</strong> Oportunidades de melhoria de performance</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Painel de Controle Rápido */}
          <Card className="mt-8 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800">Controles Rápidos</CardTitle>
              <CardDescription className="text-green-700">
                Ações rápidas para monitoramento e manutenção.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Atualizar Métricas
                </Button>
                <Button variant="outline" size="sm">
                  Executar Health Check
                </Button>
                <Button variant="outline" size="sm">
                  Limpar Logs Antigos
                </Button>
                <Button variant="outline" size="sm">
                  Exportar Relatório
                </Button>
              </div>
            </CardContent>
          </Card>
        </Layout.Content>
      </Layout.Body>
    </Layout>
  );
}