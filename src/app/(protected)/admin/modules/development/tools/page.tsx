'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Tabs, TabsContent } from '@/shared/ui/tabs';
import { ArrowLeft, Wrench, Bug, BarChart3, FileText } from 'lucide-react';
import { Layout } from '@/shared/components/Layout';
import Link from 'next/link';

// Componentes existentes de diagnóstico e monitoramento
import QualityAnalysis from '../../components/monitoring/QualityAnalysis';
import { DevelopmentLogs } from '../../components/monitoring/DevelopmentLogs';
import { OrphanModulesCard } from '../../components/diagnostics/OrphanModulesCard';

/**
 * Página de Ferramentas de Desenvolvimento
 * 
 * Responsabilidades:
 * - Consolidar ferramentas de debug e diagnóstico
 * - Análise de qualidade de código
 * - Logs de desenvolvimento
 * - Detecção de problemas e inconsistências
 * 
 * Seções:
 * - Debug: Ferramentas de depuração e análise
 * - Qualidade: Análise de código e métricas
 * - Logs: Histórico de operações e erros
 * - Diagnóstico: Detecção de problemas estruturais
 * 
 * Focado em:
 * - Identificação rápida de problemas
 * - Melhoria da qualidade do código
 * - Monitoramento em tempo real
 * - Automação de verificações
 */

export default function FerramentasPage() {
  const [activeTab, setActiveTab] = useState('debug');

  return (
    <Layout>
      <Layout.Header>
        <Layout.Breadcrumbs items={[
          { title: 'Admin' },
          { title: 'Módulos', href: '/admin/modules' },
          { title: 'Desenvolvimento', href: '/admin/modules/desenvolvimento' },
          { title: 'Ferramentas' }
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
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Wrench className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Ferramentas de Desenvolvimento</h1>
                <p className="text-muted-foreground">
                  Debug, análise de qualidade e ferramentas de diagnóstico
                </p>
              </div>
            </div>
          </div>

          {/* Tabs de Ferramentas */}
          <Tabs 
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
            items={[
              { id: 'debug', label: 'Debug', icon: <Bug className="h-4 w-4" /> },
              { id: 'qualidade', label: 'Qualidade', icon: <BarChart3 className="h-4 w-4" /> },
              { id: 'logs', label: 'Logs', icon: <FileText className="h-4 w-4" /> },
              { id: 'diagnostico', label: 'Diagnóstico', icon: <Wrench className="h-4 w-4" /> }
            ]}
          />

          <div className="mt-6 space-y-6">

            {/* Aba: Debug */}
            <TabsContent value="debug" activeValue={activeTab} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bug className="h-5 w-5" />
                    Ferramentas de Debug
                  </CardTitle>
                  <CardDescription>
                    Utilitários para depuração, teste e análise de comportamento dos módulos.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    Ferramentas de debug disponíveis apenas na página de detalhes do módulo.
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba: Qualidade */}
            <TabsContent value="qualidade" activeValue={activeTab} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Análise de Qualidade
                  </CardTitle>
                  <CardDescription>
                    Métricas de qualidade, cobertura de testes e análise de código.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <QualityAnalysis />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba: Logs */}
            <TabsContent value="logs" activeValue={activeTab} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Logs de Desenvolvimento
                  </CardTitle>
                  <CardDescription>
                    Histórico de operações, erros e eventos do sistema de módulos.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DevelopmentLogs />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba: Diagnóstico */}
            <TabsContent value="diagnostico" activeValue={activeTab} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    Diagnóstico de Sistema
                  </CardTitle>
                  <CardDescription>
                    Detecção automática de problemas, inconsistências e módulos órfãos.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <OrphanModulesCard />
                </CardContent>
              </Card>

              {/* Informações sobre Diagnóstico */}
              <Card className="border-amber-200 bg-amber-50">
                <CardHeader>
                  <CardTitle className="text-amber-800">Sobre o Diagnóstico</CardTitle>
                  <CardDescription className="text-amber-700">
                    O sistema de diagnóstico identifica automaticamente problemas comuns.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-amber-700">
                    <p><strong>Módulos Órfãos:</strong> Módulos sem implementações ou atribuições</p>
                    <p><strong>Dependências Quebradas:</strong> Referências a módulos inexistentes</p>
                    <p><strong>Configurações Inválidas:</strong> Schemas ou configurações malformadas</p>
                    <p><strong>Performance:</strong> Módulos com problemas de carregamento</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>

          {/* Ações Globais */}
          <Card className="mt-8 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800">Ações de Manutenção</CardTitle>
              <CardDescription className="text-green-700">
                Operações de limpeza e otimização do sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Limpar Cache
                </Button>
                <Button variant="outline" size="sm">
                  Revalidar Módulos
                </Button>
                <Button variant="outline" size="sm">
                  Sincronizar Dados
                </Button>
                <Button variant="outline" size="sm">
                  Gerar Relatório
                </Button>
              </div>
            </CardContent>
          </Card>
        </Layout.Content>
      </Layout.Body>
    </Layout>
  );
}