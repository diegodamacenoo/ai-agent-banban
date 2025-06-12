'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bell,
  AlertTriangle,
  Info,
  AlertCircle,
  ExternalLink,
  Clock,
  TrendingUp,
  Eye,
  Zap,
  AlertOctagon,
  Package,
  TrendingDown
} from 'lucide-react';
import Link from 'next/link';
import { Separator } from "@/components/ui/separator";

interface AlertItem {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  alert_ts: string;
  resolved: boolean;
}

interface AlertasDashboardProps {
  alerts: AlertItem[];
}

// Dados mock para fallback
const MOCK_ALERTS: AlertItem[] = [
  {
    id: '1',
    severity: 'critical',
    title: 'Estoque Crítico - Tênis Running',
    description: 'Produto com menos de 5 unidades em todas as lojas',
    alert_ts: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2h atrás
    resolved: false
  },
  {
    id: '2',
    severity: 'high',
    title: 'Pico de Devoluções Detectado',
    description: 'Aumento de 300% nas devoluções nas últimas 4 horas',
    alert_ts: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4h atrás
    resolved: false
  },
  {
    id: '3',
    severity: 'low',
    title: 'Reposição Recomendada - Categoria Roupas',
    description: 'Produtos com estoque baixo em 2 lojas',
    alert_ts: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6h atrás
    resolved: false
  },
  {
    id: '4',
    severity: 'medium',
    title: 'Meta de Vendas - Atenção',
    description: 'Vendas 15% abaixo da meta diária projetada',
    alert_ts: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8h atrás
    resolved: false
  },
  {
    id: '5',
    severity: 'low',
    title: 'Produto Sem Movimento',
    description: 'Produto sem vendas há mais de 7 dias',
    alert_ts: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12h atrás
    resolved: false
  }
];

const getSeverityConfig = (severity: string, alertTitle?: string) => {
  // Função auxiliar para escolher ícone baseado no contexto do alerta
  const getContextualIcon = (severity: string, title: string) => {
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('estoque') || titleLower.includes('reposição')) {
      switch (severity) {
        case 'critical': return <AlertOctagon className="w-5 h-5" />;
        case 'high': return <AlertTriangle className="w-5 h-5" />;
        case 'medium': return <Package className="w-5 h-5" />;
        case 'low': return <Package className="w-5 h-5" />;
      }
    }
    
    if (titleLower.includes('devolução') || titleLower.includes('pico')) {
      return <TrendingUp className="w-5 h-5" />;
    }
    
    if (titleLower.includes('vendas') || titleLower.includes('meta')) {
      return <TrendingDown className="w-5 h-5" />;
    }
    
    if (titleLower.includes('movimento') || titleLower.includes('parado')) {
      return <Clock className="w-5 h-5" />;
    }
    
    if (titleLower.includes('sistema') || titleLower.includes('pagamento')) {
      return <Zap className="w-5 h-5" />;
    }
    
    // Ícones padrão por severidade
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-5 h-5" />;
      case 'high': return <AlertCircle className="w-5 h-5" />;
      case 'medium': return <Info className="w-5 h-5" />;
      case 'low': return <Bell className="w-5 h-5" />;
      default: return <Info className="w-5 h-5" />;
    }
  };

  switch (severity) {
    case 'critical':
      return {
        badge: 'default' as const,
        icon: getContextualIcon(severity, alertTitle || ''),
        badgeClass: 'bg-red-100 text-red-800 shadow-none',
        iconClass: 'text-red-600 dark:text-red-400'
      };
    case 'high':
      return {
        badge: 'default' as const,
        icon: getContextualIcon(severity, alertTitle || ''),
        badgeClass: 'bg-orange-100 text-orange-800 shadow-none',
        iconClass: 'text-orange-600 dark:text-orange-400'
      };
    case 'medium':
      return {
        badge: 'default' as const,
        icon: getContextualIcon(severity, alertTitle || ''),
        badgeClass: 'bg-yellow-100 text-yellow-800 shadow-none',
        iconClass: 'text-amber-600 dark:text-amber-400'
      };
    case 'low':
      return {
        badge: 'default' as const,
        icon: getContextualIcon(severity, alertTitle || ''),
        badgeClass: 'bg-slate-100 text-slate-800 shadow-none border-none',
        iconClass: 'text-slate-600 dark:text-slate-400'
      };
    default:
      return {
        badge: 'default' as const,
        icon: getContextualIcon(severity, alertTitle || ''),
        badgeClass: 'bg-gray-100 text-gray-800 shadow-none',
        iconClass: 'text-gray-600 dark:text-gray-400'
      };
  }
};

const getRelativeTime = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 60) {
    return `há ${diffInMinutes}min`;
  } else if (diffInMinutes < 1440) { // 24 horas
    const hours = Math.floor(diffInMinutes / 60);
    return `há ${hours}h`;
  } else {
    const days = Math.floor(diffInMinutes / 1440);
    return `há ${days}d`;
  }
};

export function AlertasDashboard({ alerts = MOCK_ALERTS }: AlertasDashboardProps) {
  // Corrigir severidade para alertas específicos
  const correctedAlerts = alerts.map(alert => {
    if (alert.title === 'Reposição Recomendada - Categoria Roupas') {
      return { ...alert, severity: 'low' as const };
    }
    return alert;
  });
  
  const alertsToShow = correctedAlerts.filter(alert => !alert.resolved).slice(0, 6);
  const unreadCount = alertsToShow.length;

  return (
    <Card className="h-full flex flex-col @container/card">
      <CardHeader className="pb-4 space-y-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div>
              <CardTitle className="text-lg font-semibold">
                Insights
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Alertas e análises em tempo real
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <div className="flex items-center gap-3">
              <Badge
                className="h-6 px-2 text-xs font-medium shadow-none bg-green-200 text-green-800 hover:bg-green-300"
              >
                {unreadCount} novos
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 px-0">
        <ScrollArea className="h-[380px]">
          {alertsToShow.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 mx-6">
              <div className="p-4 rounded-full bg-muted/50 mb-3">
                <Bell className="w-5 h-5 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Tudo funcionando bem
              </p>
              <p className="text-xs text-muted-foreground/70 text-center">
                Nenhum insight crítico no momento
              </p>
            </div>
          ) : (
            <div className="space-y-1 px-6 pb-4">
              {alertsToShow.map((alert, index) => {
                const config = getSeverityConfig(alert.severity, alert.title);

                return (
                  <React.Fragment key={alert.id}>
                    <div className="group relative overflow-hidden">
                      <div className="py-3 px-2 transition-all duration-100 rounded-lg hover:bg-primary/5">
                        <div className="flex items-start gap-3">
                          <div className={`flex-shrink-0 mt-0.5 p-2 bg-primary/5 rounded-full`}>
                            {config.icon}
                          </div>

                          <div className="flex-1 flex-col min-w-0 gap-1">
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                {alert.title}
                              </p>
                            </div>

                            <p className="text-sm text-muted-foreground mb-1">
                              {alert.description}
                            </p>

                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <span className="font-medium">
                                {getRelativeTime(alert.alert_ts)}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end h-full justify-between">
                            <Badge
                              variant={config.badge}
                              className={`text-xs px-2 py-0.5 font-semibold text-xs flex-shrink-0 ${config.badgeClass}`}
                            >
                              {alert.severity === 'critical' ? 'CRÍTICO' :
                                alert.severity === 'high' ? 'ALTO' :
                                  alert.severity === 'medium' ? 'MÉDIO' : 'BAIXO'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    {index < alertsToShow.length - 1 && <Separator className="my-2 bg-primary/5" />}
                  </React.Fragment>
                );
              })}
              
            </div>
          )}
        </ScrollArea>

        {alertsToShow.length > 0 && (
          <div className="px-6 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              className="w-full h-9 font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
              asChild
            >
              <Link href="/alertas" className="flex items-center gap-2">
                Ver todos os insights ({alerts.length})
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 