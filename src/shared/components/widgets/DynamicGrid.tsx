'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { BaseWidget, WidgetMetadata } from './BaseWidget';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent } from '@/shared/ui/card';
import { 
  Edit3, 
  Save, 
  X, 
  Plus,
  Eye,
  EyeOff,
  RotateCcw
} from 'lucide-react';

// CSS do react-grid-layout (já importado no globals.css)

const ResponsiveGridLayout = WidthProvider(Responsive);

export interface DynamicWidgetProps {
  id: string;
  metadata: WidgetMetadata;
  data?: any;
  params?: Record<string, any>;
  loading?: boolean;
  error?: string;
  enabled?: boolean;
  onRefresh?: (widgetId: string) => void;
  onUpdateParams?: (widgetId: string, params: Record<string, any>) => void;
  onToggleEnabled?: (widgetId: string, enabled: boolean) => void;
  children: React.ReactNode;
}

interface DynamicGridProps {
  widgets: DynamicWidgetProps[];
  layouts: Record<string, Layout[]>;
  editMode?: boolean;
  onLayoutChange?: (layout: Layout[], layouts: Record<string, Layout[]>) => void;
  onAddWidget?: () => void;
  onRemoveWidget?: (widgetId: string) => void;
  onResetLayout?: () => void;
  className?: string;
}

// Breakpoints responsivos
const BREAKPOINTS = {
  lg: 1200,
  md: 996,
  sm: 768,
  xs: 480,
  xxs: 0
};

const COLS = {
  lg: 12,
  md: 10,
  sm: 6,
  xs: 4,
  xxs: 2
};

// Componente individual do widget no grid
function DynamicWidget({
  id,
  metadata,
  data,
  params,
  loading,
  error,
  enabled = true,
  onRefresh,
  onUpdateParams,
  onToggleEnabled,
  children
}: DynamicWidgetProps) {
  const [expanded, setExpanded] = useState(false);

  const handleRefresh = useCallback(() => {
    onRefresh?.(id);
  }, [id, onRefresh]);

  const handleUpdateParams = useCallback((newParams: Record<string, any>) => {
    onUpdateParams?.(id, newParams);
  }, [id, onUpdateParams]);

  const handleToggleEnabled = useCallback(() => {
    onToggleEnabled?.(id, !enabled);
  }, [id, enabled, onToggleEnabled]);

  const handleToggleExpand = useCallback(() => {
    setExpanded(prev => !prev);
  }, []);

  // Widget desabilitado
  if (!enabled) {
    return (
      <Card className="h-full bg-muted/50 border-dashed">
        <CardContent className="h-full flex items-center justify-center">
          <div className="text-center space-y-2">
            <EyeOff className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm font-medium text-muted-foreground">{metadata.title}</p>
            <p className="text-xs text-muted-foreground">Widget desabilitado</p>
            <Button variant="outline" size="sm" onClick={handleToggleEnabled}>
              <Eye className="h-3 w-3 mr-1" />
              Habilitar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <BaseWidget
      metadata={metadata}
      data={data}
      params={params}
      loading={loading}
      error={error}
      onRefresh={handleRefresh}
      onUpdateParams={handleUpdateParams}
      expanded={expanded}
      onToggleExpand={handleToggleExpand}
      className={expanded ? 'col-span-full row-span-2' : ''}
    >
      {children}
    </BaseWidget>
  );
}

// Componente principal do grid dinâmico
export function DynamicGrid({
  widgets,
  layouts,
  editMode = false,
  onLayoutChange,
  onAddWidget,
  onRemoveWidget,
  onResetLayout,
  className = ""
}: DynamicGridProps) {
  const [currentLayouts, setCurrentLayouts] = useState(layouts);

  // Gerar layout padrão para widgets sem layout definido
  const generateDefaultLayout = useCallback((widgetId: string, metadata: WidgetMetadata, breakpoint: string): Layout => {
    const cols = COLS[breakpoint as keyof typeof COLS] || COLS.lg;
    const existingLayouts = currentLayouts[breakpoint] || [];
    
    // Encontrar próxima posição disponível
    let x = 0;
    let y = 0;
    
    // Calcular próxima linha baseado no último widget
    if (existingLayouts.length > 0) {
      const maxY = Math.max(...existingLayouts.map(l => l.y + l.h));
      y = maxY;
    }

    return {
      i: widgetId,
      x,
      y,
      w: Math.min(metadata.defaultWidth, cols),
      h: metadata.defaultHeight,
      minW: metadata.minWidth || 1,
      minH: metadata.minHeight || 1,
      maxW: metadata.maxWidth || cols,
      maxH: metadata.maxHeight || 10
    };
  }, [currentLayouts]);

  // Memoizar layouts com widgets faltantes
  const completeLayouts = useMemo(() => {
    const newLayouts: Record<string, Layout[]> = {};
    
    Object.keys(BREAKPOINTS).forEach(breakpoint => {
      const existingLayout = currentLayouts[breakpoint] || [];
      const widgetIds = widgets.map(w => w.id);
      
      // Adicionar layouts faltantes
      const missingWidgets = widgetIds.filter(
        id => !existingLayout.find(l => l.i === id)
      );
      
      const missingLayouts = missingWidgets.map(id => {
        const widget = widgets.find(w => w.id === id);
        return widget ? generateDefaultLayout(id, widget.metadata, breakpoint) : null;
      }).filter(Boolean) as Layout[];
      
      // Remover layouts de widgets que não existem mais
      const validLayouts = existingLayout.filter(
        l => widgetIds.includes(l.i)
      );
      
      newLayouts[breakpoint] = [...validLayouts, ...missingLayouts];
    });
    
    return newLayouts;
  }, [widgets, currentLayouts, generateDefaultLayout]);

  // Handler para mudanças de layout
  const handleLayoutChange = useCallback((layout: Layout[], allLayouts: Record<string, Layout[]>) => {
    setCurrentLayouts(allLayouts);
    onLayoutChange?.(layout, allLayouts);
  }, [onLayoutChange]);

  // Widgets habilitados para renderização
  const enabledWidgets = widgets.filter(w => w.enabled !== false);
  const disabledWidgets = widgets.filter(w => w.enabled === false);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Toolbar do modo de edição */}
      {editMode && (
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <Edit3 className="h-4 w-4" />
            <span className="text-sm font-medium">Modo de Edição</span>
            <Badge variant="secondary">
              {enabledWidgets.length} widget{enabledWidgets.length !== 1 ? 's' : ''}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            {onAddWidget && (
              <Button variant="outline" size="sm" onClick={onAddWidget}>
                <Plus className="h-3 w-3 mr-1" />
                Adicionar Widget
              </Button>
            )}
            
            {onResetLayout && (
              <Button variant="outline" size="sm" onClick={onResetLayout}>
                <RotateCcw className="h-3 w-3 mr-1" />
                Resetar Layout
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Grid principal */}
      {enabledWidgets.length > 0 ? (
        <ResponsiveGridLayout
          className="layout"
          layouts={completeLayouts}
          breakpoints={BREAKPOINTS}
          cols={COLS}
          rowHeight={60}
          isDraggable={editMode}
          isResizable={editMode}
          onLayoutChange={handleLayoutChange}
          margin={[16, 16]}
          containerPadding={[0, 0]}
          useCSSTransforms={true}
          preventCollision={false}
          compactType="vertical"
        >
          {enabledWidgets.map((widget) => (
            <div key={widget.id}>
              <DynamicWidget {...widget} />
            </div>
          ))}
        </ResponsiveGridLayout>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center h-40">
            <div className="text-center space-y-2">
              <Plus className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">
                {widgets.length === 0 
                  ? "Nenhum widget configurado" 
                  : "Todos os widgets estão desabilitados"
                }
              </p>
              {onAddWidget && (
                <Button variant="outline" onClick={onAddWidget}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeiro Widget
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Widgets desabilitados (em modo de edição) */}
      {editMode && disabledWidgets.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Widgets Desabilitados ({disabledWidgets.length})
          </h4>
          <div className="grid grid-cols-4 gap-4">
            {disabledWidgets.map((widget) => (
              <div key={widget.id}>
                <DynamicWidget {...widget} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// CSS inline para o grid (caso não seja carregado externamente)
export const GRID_CSS = `
.react-grid-layout {
  position: relative;
}

.react-grid-item {
  transition: all 200ms ease;
  transition-property: left, top;
}

.react-grid-item.cssTransforms {
  transition-property: transform;
}

.react-grid-item > .react-resizable-handle {
  position: absolute;
  width: 20px;
  height: 20px;
  bottom: 0;
  right: 0;
  background: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNiIgaGVpZ2h0PSI2IiB2aWV3Qm94PSIwIDAgNiA2IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8ZG90cyBmaWxsPSIjOTQ5NDk0Ii8+Cjwvc3ZnPgo=');
  background-position: bottom right;
  padding: 0 3px 3px 0;
  background-repeat: no-repeat;
  background-origin: content-box;
  box-sizing: border-box;
  cursor: se-resize;
}

.react-grid-item.react-grid-placeholder {
  background: red;
  opacity: 0.2;
  transition-duration: 100ms;
  z-index: 2;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  -o-user-select: none;
  user-select: none;
}

.react-grid-item > .react-resizable-handle::after {
  content: "";
  position: absolute;
  right: 3px;
  bottom: 3px;
  width: 5px;
  height: 5px;
  border-right: 2px solid rgba(0, 0, 0, 0.4);
  border-bottom: 2px solid rgba(0, 0, 0, 0.4);
}
`;

export default DynamicGrid;