'use client';

import React, { Suspense, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Skeleton } from '@/shared/ui/skeleton';
import { 
  RefreshCcw, 
  Settings, 
  Maximize2, 
  Minimize2, 
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';

export interface WidgetProps<T = any> {
  data?: T;
  loading?: boolean;
  error?: string;
}

export interface WidgetMetadata {
  id: string;
  title: string;
  description: string;
  module_id: string;
  defaultWidth: number;
  defaultHeight: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  refreshInterval?: number; // em segundos
  configurable?: boolean;
  resizable?: boolean;
}

interface BaseWidgetProps {
  metadata: WidgetMetadata;
  data?: any;
  params?: Record<string, any>;
  loading?: boolean;
  error?: string;
  onRefresh?: () => void;
  onConfigure?: () => void;
  onUpdateParams?: (params: Record<string, any>) => void;
  expanded?: boolean;
  onToggleExpand?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function BaseWidget<T>(
  WrappedComponent: React.ComponentType<WidgetProps<T>>
): React.FC<WidgetProps<T>> {
  return function BaseWidgetComponent(props: WidgetProps<T>) {
    return (
      <Card className="w-full h-full overflow-auto">
        <WrappedComponent {...props} />
      </Card>
    );
  };
}

// Componente wrapper para widgets com funcionalidades padrão
export function BaseWidgetWrapper({
  metadata,
  data,
  params,
  loading = false,
  error,
  onRefresh,
  onConfigure,
  onUpdateParams,
  expanded = false,
  onToggleExpand,
  children,
  className = ""
}: BaseWidgetProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (!onRefresh || refreshing) return;
    
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh, refreshing]);

  // Estado de erro
  if (error) {
    return (
      <Card className={`h-full ${className}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <CardTitle className="text-sm">{metadata.title}</CardTitle>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCcw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-2">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
            <p className="text-sm text-muted-foreground">Erro ao carregar widget</p>
            <p className="text-xs text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`h-full flex flex-col ${className}`}>
      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {loading && <Clock className="h-4 w-4 text-muted-foreground animate-pulse" />}
            <CardTitle className="text-sm truncate">{metadata.title}</CardTitle>
            <Badge variant="outline" className="text-xs">
              {metadata.module_id}
            </Badge>
          </div>
          
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Auto-refresh indicator */}
            {metadata.refreshInterval && (
              <div className="text-xs text-muted-foreground mr-2">
                {metadata.refreshInterval}s
              </div>
            )}
            
            {/* Refresh button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing || loading}
              title="Atualizar dados"
            >
              <RefreshCcw className={`h-3 w-3 ${(refreshing || loading) ? 'animate-spin' : ''}`} />
            </Button>

            {/* Configure button */}
            {metadata.configurable && onConfigure && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onConfigure}
                title="Configurar widget"
              >
                <Settings className="h-3 w-3" />
              </Button>
            )}

            {/* Expand/collapse button */}
            {onToggleExpand && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleExpand}
                title={expanded ? "Minimizar" : "Expandir"}
              >
                {expanded ? (
                  <Minimize2 className="h-3 w-3" />
                ) : (
                  <Maximize2 className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Description (only show if not loading and has space) */}
        {!loading && metadata.description && !expanded && (
          <p className="text-xs text-muted-foreground truncate">
            {metadata.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0">
        {loading ? (
          <WidgetSkeleton />
        ) : (
          <Suspense fallback={<WidgetSkeleton />}>
            {children}
          </Suspense>
        )}
      </CardContent>
    </Card>
  );
}

// Skeleton padrão para widgets carregando
export function WidgetSkeleton() {
  return (
    <div className="space-y-3 h-full">
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-8 w-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

// Hook para gerenciar estado do widget
export function useWidgetState(metadata: WidgetMetadata) {
  const [expanded, setExpanded] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const toggleExpand = useCallback(() => {
    setExpanded(prev => !prev);
  }, []);

  const markRefreshed = useCallback(() => {
    setLastRefresh(new Date());
  }, []);

  return {
    expanded,
    toggleExpand,
    lastRefresh,
    markRefreshed
  };
}

// Componente para métricas simples (KPI)
interface MetricDisplayProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  trend?: 'up' | 'down' | 'stable';
  format?: 'number' | 'currency' | 'percentage';
  className?: string;
}

export function MetricDisplay({
  label,
  value,
  change,
  changeLabel,
  trend,
  format = 'number',
  className = ""
}: MetricDisplayProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val;
    
    switch (format) {
      case 'currency':
        return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      case 'percentage':
        return `${val.toFixed(1)}%`;
      default:
        return val.toLocaleString('pt-BR');
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-600" />;
      default:
        return <Minus className="h-3 w-3 text-muted-foreground" />;
    }
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{formatValue(value)}</p>
      {(change !== undefined || trend) && (
        <div className="flex items-center gap-1">
          {trend && getTrendIcon()}
          {change !== undefined && (
            <span className={`text-xs ${
              change > 0 ? 'text-green-600' : 
              change < 0 ? 'text-red-600' : 
              'text-muted-foreground'
            }`}>
              {change > 0 ? '+' : ''}{change.toFixed(1)}%
            </span>
          )}
          {changeLabel && (
            <span className="text-xs text-muted-foreground">{changeLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}

// Componente para lista de itens em widgets
interface WidgetListProps {
  items: Array<{
    id: string;
    title: string;
    subtitle?: string;
    value?: string | number;
    badge?: string;
    badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  }>;
  emptyMessage?: string;
  maxItems?: number;
  showMore?: boolean;
  onShowMore?: () => void;
}

export function WidgetList({
  items,
  emptyMessage = "Nenhum item encontrado",
  maxItems,
  showMore = false,
  onShowMore
}: WidgetListProps) {
  const displayItems = maxItems ? items.slice(0, maxItems) : items;
  const hasMore = maxItems && items.length > maxItems;

  if (items.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 flex-1">
      {displayItems.map((item) => (
        <div key={item.id} className="flex items-center justify-between p-2 rounded border">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{item.title}</p>
            {item.subtitle && (
              <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {item.value && (
              <span className="text-sm font-medium">{item.value}</span>
            )}
            {item.badge && (
              <Badge variant={item.badgeVariant || 'outline'} className="text-xs">
                {item.badge}
              </Badge>
            )}
          </div>
        </div>
      ))}
      
      {(hasMore || showMore) && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full mt-2"
          onClick={onShowMore}
        >
          Ver {hasMore ? `mais ${items.length - maxItems!}` : 'todos'}
        </Button>
      )}
    </div>
  );
}