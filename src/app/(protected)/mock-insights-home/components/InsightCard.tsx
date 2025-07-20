'use client';

import { useState } from 'react';
import { MoreHorizontal, Link2, Flame, Clock } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/utils/utils';
import { Insight } from '../types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/ui/dropdown-menu';

interface InsightCardProps {
  insight: Insight;
  onClick: () => void;
  delay?: number;
}

const getInsightColors = (type: string) => {
  switch (type) {
    case 'critical':
      return {
        badge: 'destructive',
        border: 'border-red-200',
        bg: 'bg-red-50',
        text: 'text-red-800',
        label: 'CRÍTICO'
      };
    case 'attention':
      return {
        badge: 'light_destructive',
        border: 'border-amber-200',
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        label: 'ATENÇÃO'
      };
    case 'moderate':
      return {
        badge: 'light_warning',
        border: 'border-blue-200',
        bg: 'bg-blue-50',
        text: 'text-blue-800',
        label: 'MODERADO'
      };
    case 'opportunity':
      return {
        badge: 'light_success',
        border: 'border-green-200',
        bg: 'bg-green-50',
        text: 'text-green-800',
        label: 'OPORTUNIDADE'
      };
    case 'achievement':
      return {
        badge: 'light_success',
        border: 'border-purple-200',
        bg: 'bg-purple-50',
        text: 'text-purple-800',
        label: 'CONQUISTA'
      };
    default:
      return {
        badge: 'outline',
        border: 'border-border',
        bg: 'bg-background',
        text: 'text-foreground',
        label: 'INFO'
      };
  }
};

export function InsightCard({ insight, onClick, delay = 0 }: InsightCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const colors = getInsightColors(insight.type);

  return (
    <Card
      variant="clickable"
      size="sm"
      className={cn(
        'flex flex-col h-[200px] justify-between relative transition-all duration-300 animate-in fade-in slide-in-from-bottom-4'
      )}
      style={{
        animationDelay: `${delay}ms`,
        animationDuration: '600ms',
        animationFillMode: 'both'
      }}
      onClick={onClick}
    >

      <CardContent className="pb-4">
        {/* Indicador de Novo */}
        {/* {insight.isNew && (
          <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse ml-2" />
        )} */}
        <div className="space-y-3">
          {/* Texto Principal */}
          <p className="text-md text-foreground">
            {insight.naturalLanguageText}
          </p>

        </div>
      </CardContent>

      <CardFooter className="pt-2">
        <div className="flex items-center justify-between w-full">
          {/* Badge Principal */}
          <div className="flex items-center gap-1">
            <Badge variant={colors.badge as any} className={cn('text-xs font-semibold')}>
              {colors.label}
            </Badge>

            {/* Botão Conexão (se conectado) */}
            {insight.isConnected && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:bg-accent text-blue-600"
                onClick={(e) => e.stopPropagation()}
              >
                <Link2 className="h-3 w-3" />
              </Button>
            )}

            {/* Trend Indicator */}
            {insight.trend && (
              <Badge variant="ghost" className="flex items-center gap-2 text-xs text-muted-foreground">
                {insight.trend === 'up' && <span>+40% hoje</span>}
                {insight.trend === 'down' && <span>-15% hoje</span>}
                {insight.trend === 'stable' && <span>Estável</span>}
              </Badge>
            )}

            {/* Métricas Rápidas */}
            {insight.urgency && (
              <div className="flex items-center gap-2 text-xs">
                {insight.urgency === 'urgent' && (
                  <Badge variant="ghost" icon={Flame} className="flex items-center gap-1 text-red-600">
                    <span>Urgente</span>
                  </Badge>
                )}
                {insight.urgency === 'today' && (
                  <Badge variant="ghost" icon={Clock} className="flex items-center gap-1 text-amber-600">
                    <span>Hoje</span>
                  </Badge>
                )}
                {insight.urgency === 'tomorrow' && (
                  <Badge variant="ghost" icon={Clock} className="flex items-center gap-1 text-blue-600">
                    <span>Amanhã</span>
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Botão Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="end">
              <DropdownMenuItem>
                <span>Editar</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardFooter>
    </Card>
  );
}