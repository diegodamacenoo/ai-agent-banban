'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { NotificationManager } from '../components/configurations/NotificationManager';

export default function NotificationsPage() {
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
            <span>Notificações</span>
          </div>
          <h1 className="text-3xl font-bold">Gerenciamento de Notificações</h1>
          <p className="text-muted-foreground">
            Configure notificações e alertas do sistema de módulos
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/modules">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Link>
        </Button>
      </div>

      {/* Informações sobre Notificações */}
      <Card>
        <CardHeader>
          <CardTitle>Sistema de Notificações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Gerencie todas as notificações relacionadas ao sistema de módulos,
            incluindo alertas de status, mudanças de configuração e eventos importantes.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">🔔 Tipos de Notificação</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Mudanças de status de módulos</li>
                <li>• Novos módulos disponíveis</li>
                <li>• Atualizações de configuração</li>
                <li>• Alertas de performance</li>
                <li>• Falhas de carregamento</li>
                <li>• Manutenções programadas</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">📨 Canais de Entrega</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Notificações in-app</li>
                <li>• E-mail automático</li>
                <li>• Webhooks para integrações</li>
                <li>• Slack/Teams integração</li>
                <li>• SMS para alertas críticos</li>
                <li>• Dashboard centralizado</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Componente principal */}
      <NotificationManager />
    </div>
  );
}