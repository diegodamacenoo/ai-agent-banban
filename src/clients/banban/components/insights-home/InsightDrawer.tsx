'use client';

import { X } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerDescription,
  DrawerClose 
} from '@/shared/ui/drawer';
import { cn } from '@/shared/utils/utils';
import { Insight } from './types';
import { AnalysisCard } from './components/AnalysisCard';
import { ContextCard } from './components/ContextCard';
import { ActionCard } from './components/ActionCard';

interface InsightDrawerProps {
  insight: Insight | null;
  isOpen: boolean;
  onClose: () => void;
  onStartChat?: (insight: Insight) => void;
}

const getInsightColors = (type: string) => {
  switch (type) {
    case 'critical':
      return {
        badge: 'destructive',
        bg: 'bg-red-50',
        text: 'text-red-800',
        border: 'border-red-200',
        label: 'CRÍTICO'
      };
    case 'attention':
      return {
        badge: 'outline',
        bg: 'bg-amber-50',
        text: 'text-amber-800', 
        border: 'border-amber-200',
        label: 'ATENÇÃO'
      };
    case 'moderate':
      return {
        badge: 'secondary',
        bg: 'bg-blue-50',
        text: 'text-blue-800',
        border: 'border-blue-200',
        label: 'MODERADO'
      };
    case 'opportunity':
      return {
        badge: 'outline',
        bg: 'bg-green-50',
        text: 'text-green-800',
        border: 'border-green-200', 
        label: 'OPORTUNIDADE'
      };
    case 'achievement':
      return {
        badge: 'secondary',
        bg: 'bg-purple-50',
        text: 'text-purple-800',
        border: 'border-purple-200',
        label: 'CONQUISTA'
      };
    default:
      return {
        badge: 'outline',
        bg: 'bg-background',
        text: 'text-foreground',
        border: 'border-border',
        label: 'INFO'
      };
  }
};

export function InsightDrawer({ insight, isOpen, onClose, onStartChat }: InsightDrawerProps) {

  if (!insight) {
    return null;
  }

  const colors = getInsightColors(insight.type);

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()} direction="right">
      <DrawerContent className="w-full max-w-2xl">
        <DrawerHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={colors.badge as any} className={cn('text-xs font-semibold', colors.text)}>
                  {colors.label}
                </Badge>
                {insight.isNew && (
                  <span className="text-xs text-red-600 font-medium">🔥 Novo hoje</span>
                )}
                {insight.isConnected && (
                  <span className="text-xs text-blue-600 font-medium">↗️ CONECTADO</span>
                )}
              </div>
              <DrawerTitle className="text-xl font-semibold">
                {insight.title}
              </DrawerTitle>
              <DrawerDescription className="text-sm">
                {insight.naturalLanguageText}
              </DrawerDescription>
            </div>
            <DrawerClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        {/* Content - Sequential Card Layout */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* 1. Analysis Card */}
          <AnalysisCard insight={insight} onStartChat={onStartChat} />
          
          {/* 2. Context & Data Card */}
          <ContextCard insight={insight} />
          
          {/* 3. Action Plan Card */}
          <ActionCard insight={insight} />
          
          {/* Footer - History */}
          <div className="pt-4 border-t border-border">
            <div className="text-sm text-muted-foreground space-y-2">
              <h4 className="font-medium text-foreground">📅 Histórico</h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="flex justify-between">
                  <span>Insight detectado:</span>
                  <span>Hoje, 09:15</span>
                </div>
                <div className="flex justify-between">
                  <span>Última atualização:</span>
                  <span>Hoje, {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}