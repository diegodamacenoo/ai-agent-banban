'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ModuleAnalytics } from './ModuleAnalytics';

export default function AnalyticsPage() {
  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/admin/modules" className="hover:text-foreground">
              Módulos
            </Link>
            <span>/</span>
            <span>Analytics</span>
          </div>
          <h1 className="text-3xl font-bold">Analytics de Módulos</h1>
          <p className="text-muted-foreground">
            Analise métricas detalhadas de uso e performance dos módulos
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/modules">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Link>
        </Button>
      </div>

      {/* Informações sobre Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Analytics Avançado de Módulos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Sistema completo de analytics para monitorar o uso, performance e
            impacto dos módulos em tempo real, com insights acionáveis para otimização.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">📊 Métricas de Uso</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Adoção por organização e usuário</li>
                <li>• Frequência de uso e sessões</li>
                <li>• Caminhos de navegação</li>
                <li>• Tempo gasto por módulo</li>
                <li>• Taxa de abandono</li>
                <li>• Conversões e objetivos</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">⚡ Performance e Qualidade</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Tempo de carregamento</li>
                <li>• Erros e exceções</li>
                <li>• Satisfação do usuário (NPS)</li>
                <li>• Feedback e avaliações</li>
                <li>• Estabilidade e uptime</li>
                <li>• Comparação de versões</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Componente principal */}
      <ModuleAnalytics />
    </div>
  );
}