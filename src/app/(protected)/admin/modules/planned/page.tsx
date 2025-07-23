'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Layout } from '@/shared/components/Layout';
import { Lightbulb, Calendar, Target, TrendingUp } from 'lucide-react';

export default function PlannedModulesPage() {
  const plannedModules = [
    {
      id: 1,
      name: 'Sistema de BI Avançado',
      description: 'Análise preditiva e dashboards customizáveis com IA',
      status: 'Em Análise',
      priority: 'Alta',
      estimatedQuarter: 'Q2 2025',
      icon: TrendingUp
    },
    {
      id: 2,
      name: 'Automação de Marketing',
      description: 'Campanhas automatizadas e personalização em tempo real',
      status: 'Planejado',
      priority: 'Média',
      estimatedQuarter: 'Q3 2025',
      icon: Target
    },
    {
      id: 3,
      name: 'Gestão de Contratos',
      description: 'Ciclo completo de contratos com assinatura digital',
      status: 'Em Análise',
      priority: 'Alta',
      estimatedQuarter: 'Q1 2025',
      icon: Calendar
    }
  ];

  return (
    <Layout>
      <Layout.Header>
        <Layout.Breadcrumbs items={[
          { title: 'Admin' },
          { title: 'Módulos' },
          { title: 'Módulos Planejados' }
        ]} />
      </Layout.Header>

      <Layout.Body>
        <Layout.Content>
          <div className="space-y-6">
            {/* Cabeçalho */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Lightbulb className="h-8 w-8 text-yellow-500" />
                  <div>
                    <CardTitle className="text-2xl">Módulos Planejados</CardTitle>
                    <CardDescription>
                      Roadmap de novos módulos e funcionalidades em desenvolvimento
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Lista de Módulos Planejados */}
            <div className="grid gap-4">
              {plannedModules.map((module) => (
                <Card key={module.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <module.icon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-semibold text-lg">{module.name}</h3>
                          <p className="text-sm text-muted-foreground">{module.description}</p>
                          <div className="flex gap-4 mt-2">
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {module.status}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              module.priority === 'Alta' 
                                ? 'bg-red-100 text-red-700' 
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              Prioridade: {module.priority}
                            </span>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {module.estimatedQuarter}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Ver Detalhes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Informações Adicionais */}
            <Card>
              <CardHeader>
                <CardTitle>Como Funciona o Roadmap</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <p className="text-sm text-muted-foreground">
                  Os módulos listados aqui estão em diferentes estágios de planejamento e desenvolvimento:
                </p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li><strong>Em Análise:</strong> Validando viabilidade técnica e requisitos</li>
                  <li><strong>Planejado:</strong> Aprovado para desenvolvimento futuro</li>
                  <li><strong>Em Desenvolvimento:</strong> Ativamente sendo construído</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-4">
                  As datas são estimativas e podem mudar conforme o progresso do desenvolvimento.
                </p>
              </CardContent>
            </Card>
          </div>
        </Layout.Content>
      </Layout.Body>
    </Layout>
  );
}