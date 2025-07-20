'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ABTestingManager } from '../components/analytics/ABTestingManager';

export default function ABTestingPage() {
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
            <span>A/B Testing</span>
          </div>
          <h1 className="text-3xl font-bold">A/B Testing de Módulos</h1>
          <p className="text-muted-foreground">
            Configure e monitore testes A/B para diferentes configurações de módulos
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/modules">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Link>
        </Button>
      </div>

      {/* Informações sobre A/B Testing */}
      <Card>
        <CardHeader>
          <CardTitle>Sobre A/B Testing de Módulos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            O sistema de A/B Testing permite testar diferentes configurações de módulos
            com grupos específicos de usuários para otimizar a experiência e performance.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">✨ Funcionalidades</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Testes de diferentes layouts de módulos</li>
                <li>• Configurações de navegação alternativas</li>
                <li>• Métricas de engajamento por variação</li>
                <li>• Segmentação de usuários por critérios</li>
                <li>• Análise estatística de resultados</li>
                <li>• Rollout gradual de mudanças</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">📊 Métricas Monitoradas</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Taxa de cliques em módulos</li>
                <li>• Tempo de permanência</li>
                <li>• Conversão de tarefas</li>
                <li>• Satisfação do usuário</li>
                <li>• Performance de carregamento</li>
                <li>• Abandono de sessão</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Componente principal */}
      <ABTestingManager />
    </div>
  );
}