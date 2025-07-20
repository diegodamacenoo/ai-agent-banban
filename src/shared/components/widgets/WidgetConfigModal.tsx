'use client';

import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Switch } from '@/shared/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Separator } from '@/shared/ui/separator';
import { 
  Plus, 
  Minus, 
  Settings, 
  Grid3X3, 
  BarChart3, 
  Package, 
  Zap, 
  AlertTriangle,
  Eye,
  EyeOff,
  RotateCcw
} from 'lucide-react';
import { WIDGET_METADATA } from './WidgetLoader';

// Interface para o widget com status
interface WidgetWithStatus {
  id: string;
  title: string;
  description: string;
  module_id: string;
  component_path: string;
  enabled: boolean;
  implemented: boolean;
  defaultWidth: number;
  defaultHeight: number;
}

// Props do modal
interface WidgetConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  widgets: WidgetWithStatus[];
  activeModules: string[];
  onToggleWidget: (widgetId: string, enabled: boolean) => void;
  onResetLayout: () => void;
  onSaveLayout?: () => void;
}

// Ícones dos módulos
const MODULE_ICONS = {
  analytics: BarChart3,
  inventory: Package,
  performance: Zap,
  alerts: AlertTriangle
} as const;

// Cores dos módulos
const MODULE_COLORS = {
  analytics: 'bg-blue-50 text-blue-700 border-blue-200',
  inventory: 'bg-green-50 text-green-700 border-green-200',
  performance: 'bg-purple-50 text-purple-700 border-purple-200',
  alerts: 'bg-orange-50 text-orange-700 border-orange-200'
} as const;

// Nomes dos módulos
const MODULE_NAMES = {
  analytics: 'Analytics',
  inventory: 'Estoque',
  performance: 'Performance',
  alerts: 'Alertas'
} as const;

// Componente do widget individual
function WidgetCard({ 
  widget, 
  onToggle 
}: { 
  widget: WidgetWithStatus; 
  onToggle: (enabled: boolean) => void;
}) {
  const ModuleIcon = MODULE_ICONS[widget.module_id as keyof typeof MODULE_ICONS] || Grid3X3;
  const moduleColor = MODULE_COLORS[widget.module_id as keyof typeof MODULE_COLORS] || 'bg-gray-50 text-gray-700 border-gray-200';

  return (
    <Card className={`transition-all duration-200 ${widget.enabled ? 'ring-2 ring-primary/20' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded border ${moduleColor}`}>
              <ModuleIcon className="h-3 w-3" />
            </div>
            <div>
              <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {widget.description}
              </CardDescription>
            </div>
          </div>
          <Switch
            checked={widget.enabled}
            onCheckedChange={onToggle}
            disabled={!widget.implemented}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>Tamanho: {widget.defaultWidth}×{widget.defaultHeight}</span>
            <span>•</span>
            <span>{MODULE_NAMES[widget.module_id as keyof typeof MODULE_NAMES]}</span>
          </div>
          <div className="flex items-center gap-1">
            {widget.implemented ? (
              <Badge variant="outline" className="text-xs">
                <Eye className="h-2.5 w-2.5 mr-1" />
                Ativo
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">
                <EyeOff className="h-2.5 w-2.5 mr-1" />
                Em Breve
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente principal do modal
export function WidgetConfigModal({
  open,
  onOpenChange,
  widgets,
  activeModules,
  onToggleWidget,
  onResetLayout,
  onSaveLayout
}: WidgetConfigModalProps) {
  const [selectedModule, setSelectedModule] = useState<string>('all');

  // Agrupar widgets por módulo
  const widgetsByModule = useMemo(() => {
    const grouped = widgets.reduce((acc, widget) => {
      if (!acc[widget.module_id]) {
        acc[widget.module_id] = [];
      }
      acc[widget.module_id].push(widget);
      return acc;
    }, {} as Record<string, WidgetWithStatus[]>);

    return grouped;
  }, [widgets]);

  // Filtrar widgets baseado no módulo selecionado
  const filteredWidgets = useMemo(() => {
    if (selectedModule === 'all') {
      return widgets;
    }
    return widgetsByModule[selectedModule] || [];
  }, [widgets, widgetsByModule, selectedModule]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = widgets.length;
    const enabled = widgets.filter(w => w.enabled).length;
    const implemented = widgets.filter(w => w.implemented).length;
    const activeModulesCount = activeModules.length;

    return { total, enabled, implemented, activeModulesCount };
  }, [widgets, activeModules]);

  const handleToggleWidget = (widget: WidgetWithStatus, newEnabledValue: boolean) => {
    if (widget.implemented) {
      onToggleWidget(widget.id, newEnabledValue);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl sm:max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurar Dashboard
          </DialogTitle>
          <DialogDescription>
            Personalize seu dashboard ativando ou desativando widgets conforme suas necessidades.
          </DialogDescription>
        </DialogHeader>

        {/* Estatísticas */}
        <div className="grid grid-cols-4 gap-4 py-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{stats.enabled}</div>
            <div className="text-xs text-muted-foreground">Widgets Ativos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total Disponível</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.implemented}</div>
            <div className="text-xs text-muted-foreground">Implementados</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.activeModulesCount}</div>
            <div className="text-xs text-muted-foreground">Módulos Ativos</div>
          </div>
        </div>

        <Separator />

        {/* Tabs por módulo */}
        <Tabs value={selectedModule} onValueChange={setSelectedModule} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all" className="flex items-center gap-1">
              <Grid3X3 className="h-3 w-3" />
              Todos
            </TabsTrigger>
            {Object.keys(widgetsByModule).map((moduleId) => {
              const ModuleIcon = MODULE_ICONS[moduleId as keyof typeof MODULE_ICONS] || Grid3X3;
              const count = widgetsByModule[moduleId].filter(w => w.enabled).length;
              
              return (
                <TabsTrigger key={moduleId} value={moduleId} className="flex items-center gap-1">
                  <ModuleIcon className="h-3 w-3" />
                  {MODULE_NAMES[moduleId as keyof typeof MODULE_NAMES]}
                  {count > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                      {count}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value={selectedModule} className="mt-4">
            <ScrollArea className="h-96">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
                {filteredWidgets.map((widget) => (
                  <WidgetCard
                    key={widget.id}
                    widget={widget}
                    onToggle={(enabled) => handleToggleWidget(widget, enabled)}
                  />
                ))}
              </div>
              
              {filteredWidgets.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Grid3X3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum widget disponível para este módulo</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onResetLayout}>
              <RotateCcw className="h-3 w-3 mr-1" />
              Resetar Layout
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={() => {
              onSaveLayout?.();
              onOpenChange(false);
            }}>
              <Settings className="h-3 w-3 mr-1" />
              Salvar Configuração
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default WidgetConfigModal;