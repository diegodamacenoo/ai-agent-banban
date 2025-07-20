'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Switch } from '@/shared/ui/switch';
import {
  TrendingUp,
  Plus,
  Settings,
  LayoutGrid,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { Layout } from '@/shared/components/Layout';
import type { CustomDashboardProps } from '@/clients/registry';
import { useDashboardData } from '@/shared/hooks/useDashboardData';
import { DynamicGrid } from '@/shared/components/widgets/DynamicGrid';
import { WidgetLoader } from '@/shared/components/widgets/WidgetLoader';
import { WidgetMetadata } from '@/shared/components/widgets/BaseWidget';
import { WidgetConfigModal } from '@/shared/components/widgets/WidgetConfigModal';
import { WIDGET_METADATA, isWidgetAvailable } from '@/shared/components/widgets/WidgetLoader';

export function DynamicTenantDashboard({ slug, organization, activeModules = [] }: CustomDashboardProps) {
  // Estados para o dashboard dinâmico
  const [editMode, setEditMode] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);

  // Hook para dados dinâmicos
  const {
    layout,
    widgetData,
    loading,
    error,
    refreshLayout,
    refreshWidgetData,
    updateLayout,
    updateWidgetParams,
    enableWidget,
    disableWidget,
    createWidget
  } = useDashboardData({
    tenantId: organization.id,
    autoRefresh: true,
    refreshInterval: 300000 // 5 minutos
  });

  // Gerar lista de widgets disponíveis baseada nos metadados
  const availableWidgets = useMemo(() => {
    const widgets = Object.entries(WIDGET_METADATA).map(([widgetKey, metadata]) => {
      const componentPath = `/widgets/${metadata.module_id}/${widgetKey}`;
      const currentWidget = layout?.widgets?.find(w => w.componentPath === componentPath);
      
      return {
        id: widgetKey,
        title: metadata.name,
        description: metadata.description,
        module_id: metadata.module_id,
        component_path: componentPath,
        enabled: currentWidget ? currentWidget.enabled === true : false, // Valor real do enabled
        implemented: isWidgetAvailable(componentPath),
        defaultWidth: metadata.defaultWidth,
        defaultHeight: metadata.defaultHeight
      };
    }); // Removendo filtro temporariamente para debug
    // }).filter(widget => activeModules.some(module => module.slug === widget.module_id));
    
    console.debug('Available widgets:', widgets.length, widgets);
    console.debug('Current layout widgets:', layout?.widgets);
    
    // Debug: verificar estado do widget encontrado
    if (layout?.widgets?.length > 0) {
      layout.widgets.forEach(widget => {
        console.debug(`🔍 Widget full object:`, widget);
        console.debug(`🔍 Widget keys:`, Object.keys(widget));
        console.debug(`🔍 Widget enabled value:`, widget.enabled);
      });
    }
    
    return widgets;
  }, [layout?.widgets, activeModules]);
  
  // Debug: verificar availableWidgets para o modal
  console.debug('🔍 Available widgets for modal:', availableWidgets.map(w => ({
    id: w.id,
    enabled: w.enabled,
    implemented: w.implemented
  })));

  // Converter widgets do layout para o formato do DynamicGrid
  const dynamicWidgets = layout?.widgets?.map(widget => ({
    id: widget.widgetId, // ID do dashboard_widgets
    metadata: {
      id: widget.widgetId,
      title: widget.title,
      description: widget.description,
      module_id: widget.moduleId,
      defaultWidth: widget.position?.w || 3,
      defaultHeight: widget.position?.h || 2,
      configurable: true,
      resizable: true
    } as WidgetMetadata,
    data: widgetData[widget.widgetId],
    params: widget.customParams,
    loading: loading,
    error: error,
    enabled: widget.enabled === true, // Valor real do enabled
    onRefresh: (widgetId: string) => refreshWidgetData([widgetId]),
    onUpdateParams: updateWidgetParams,
    onToggleEnabled: (widgetId: string, enabled: boolean) => {
      if (enabled) {
        enableWidget(widget.id); // ID do tenant_dashboard_widgets
      } else {
        disableWidget(widget.id); // ID do tenant_dashboard_widgets
      }
    },
    children: (
      <WidgetLoader
        componentPath={widget.componentPath}
        data={widgetData[widget.widgetId]}
        params={widget.customParams}
        loading={loading}
        error={error}
        onRefresh={() => refreshWidgetData([widget.widgetId])}
        onUpdateParams={(params) => updateWidgetParams(widget.widgetId, params)}
      />
    )
  })) || [];

  // Layouts para o grid dinâmico
  const gridLayouts = layout?.layout_config ? {
    lg: layout.layout_config,
    md: layout.layout_config,
    sm: layout.layout_config,
    xs: layout.layout_config,
    xxs: layout.layout_config
  } : {};

  return (
    <Layout loading={loading} error={error} onRetry={refreshLayout}>
      <Layout.Header>
        <Layout.Breadcrumbs items={[{ title: 'Dashboard' }]} />
        <Layout.Actions>
          <Button asChild variant="outline">
            <Link href={`/${slug}/performance`}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Performance
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/${slug}/documents/new`}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Documento
            </Link>
          </Button>
        </Layout.Actions>
      </Layout.Header>
      <Layout.Body>
        <Layout.Content>
          <div className="space-y-6">
            {/* Controles do dashboard */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold">Dashboard</h2>
                <Badge variant="outline">
                  {dynamicWidgets.length} widget{dynamicWidgets.length !== 1 ? 's' : ''}
                </Badge>
                {activeModules.length > 0 && (
                  <Badge variant="secondary">
                    {activeModules.length} módulo{activeModules.length !== 1 ? 's' : ''} ativo{activeModules.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Modo de Edição:</span>
                <Switch
                  checked={editMode}
                  onCheckedChange={setEditMode}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refreshLayout()}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
              </div>
            </div>

            {/* Grid dinâmico de widgets */}
            <DynamicGrid
              widgets={dynamicWidgets}
              layouts={gridLayouts}
              editMode={editMode}
              onLayoutChange={(layout, layouts) => {
                if (layout.length > 0) {
                  updateLayout(layout);
                }
              }}
              onAddWidget={() => {
                setConfigModalOpen(true);
              }}
              onRemoveWidget={(widgetId) => {
                disableWidget(widgetId);
              }}
              onResetLayout={() => {
                console.debug('Reset layout from grid');
                refreshLayout();
              }}
            />

            {/* Fallback quando não há widgets */}
            {dynamicWidgets.length === 0 && !loading && (
              <Card>
                <CardContent className="flex items-center justify-center h-80">
                  <div className="text-center space-y-4">
                    <LayoutGrid className="h-20 w-20 text-muted-foreground mx-auto" />
                    <div>
                      <h3 className="text-xl font-semibold mb-2">
                        Bem-vindo ao {organization.company_trading_name}
                      </h3>
                      <p className="text-muted-foreground mb-4 max-w-md">
                        {activeModules.length === 0 
                          ? "Nenhum módulo foi configurado ainda. Entre em contato com o administrador para ativar módulos."
                          : "Configure widgets para visualizar dados dos seus módulos ativos em tempo real."
                        }
                      </p>
                      <div className="flex gap-2 justify-center mb-4">
                        <Badge variant="outline">Cliente: {organization.client_type}</Badge>
                        <Badge variant="outline">Organização: {organization.slug}</Badge>
                      </div>
                      {activeModules.length > 0 && (
                        <Button variant="outline" onClick={() => setConfigModalOpen(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Configurar Widgets
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </Layout.Content>
      </Layout.Body>

      {/* Modal de Configuração de Widgets */}
      <WidgetConfigModal
        open={configModalOpen}
        onOpenChange={setConfigModalOpen}
        widgets={availableWidgets}
        activeModules={['analytics', 'inventory', 'performance', 'alerts']}
        onToggleWidget={async (widgetId, enabled) => {
          console.debug(`🔧 Toggling widget ${widgetId} to ${enabled}`);
          
          // Debug: verificar layout atual
          console.debug('🔍 Current layout:', layout);
          console.debug('🔍 Layout widgets count:', layout?.widgets?.length || 0);
          
          // Buscar widget no layout atual pelo ID
          const componentPath = `/widgets/${WIDGET_METADATA[widgetId as keyof typeof WIDGET_METADATA]?.module_id}/${widgetId}`;
          console.debug('🔍 Looking for component path:', componentPath);
          
          const existingWidget = layout?.widgets?.find(w => w.componentPath === componentPath);
          console.debug('🔍 Existing widget found:', existingWidget);
          
          if (existingWidget) {
            console.debug('📝 Widget exists, toggling state...');
            // Widget existe, apenas toggle enabled
            if (enabled) {
              console.debug('✅ Enabling existing widget...');
              const success = await enableWidget(existingWidget.id); // Usar id do tenant_dashboard_widgets
              console.debug(`✅ Enable result: ${success}`);
            } else {
              console.debug('❌ Disabling existing widget...');
              const success = await disableWidget(existingWidget.id); // Usar id do tenant_dashboard_widgets
              console.debug(`❌ Disable result: ${success}`);
            }
          } else {
            console.debug('🆕 Widget does not exist, checking if should create...');
            // Widget não existe, criar novo
            if (enabled) {
              console.debug('🚀 Creating new widget...');
              const metadata = WIDGET_METADATA[widgetId as keyof typeof WIDGET_METADATA];
              console.debug('🔍 Widget metadata:', metadata);
              
              if (metadata) {
                console.debug('📦 Calling createWidget...');
                const success = await createWidget(widgetId, metadata);
                console.debug(`🎉 Create widget result: ${success}`);
              } else {
                console.error(`❌ Metadata not found for widget ${widgetId}`);
              }
            } else {
              console.debug('⚠️ Trying to disable non-existing widget, ignoring...');
            }
          }
        }}
        onResetLayout={() => {
          // TODO: Implementar reset do layout para posições padrão
          console.debug('Reset layout');
          refreshLayout();
        }}
        onSaveLayout={() => {
          // Layout é salvo automaticamente via updateLayout
          console.debug('Layout salvo automaticamente');
        }}
      />
    </Layout>
  );
}