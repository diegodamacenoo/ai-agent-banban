'use client';

import { useState, useEffect, useCallback } from 'react';

// Interface para layout de widgets
export interface WidgetLayoutItem {
  i: string; // ID do widget
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

export interface TenantWidget {
  id: string;
  widget_id: string;
  enabled: boolean;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  custom_params: Record<string, any>;
  display_order: number;
  widget_title: string;
  widget_description: string;
  component_path: string;
  module_id: string;
  query_type: 'rpc' | 'rest' | 'sql';
  query_config: Record<string, any>;
  default_params: Record<string, any>;
}

export interface DashboardLayout {
  tenant_id: string;
  layout_config: WidgetLayoutItem[];
  widgets: TenantWidget[];
  is_active: boolean;
}

export interface WidgetDataRequest {
  widget_id: string;
  params?: Record<string, any>;
}

export interface WidgetDataResponse {
  widget_id: string;
  data: any;
  error?: string;
  cached: boolean;
  timestamp: string;
}

interface UseDashboardDataOptions {
  tenantId: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // em millisegundos
  enableCache?: boolean;
}

interface UseDashboardDataReturn {
  layout: DashboardLayout | null;
  widgetData: Record<string, any>;
  loading: boolean;
  error: string | null;
  refreshLayout: () => Promise<void>;
  refreshWidgetData: (widgetIds?: string[]) => Promise<void>;
  updateLayout: (newLayout: WidgetLayoutItem[]) => Promise<boolean>;
  updateWidgetParams: (widgetId: string, params: Record<string, any>) => Promise<boolean>;
  enableWidget: (widgetId: string) => Promise<boolean>;
  disableWidget: (widgetId: string) => Promise<boolean>;
}

export function useDashboardData({
  tenantId,
  autoRefresh = false,
  refreshInterval = 300000, // 5 minutos
  enableCache = true
}: UseDashboardDataOptions): UseDashboardDataReturn {
  const [layout, setLayout] = useState<DashboardLayout | null>(null);
  const [widgetData, setWidgetData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cache local para evitar requests desnecessários
  const [dataCache, setDataCache] = useState<Record<string, { data: any; timestamp: number }>>({});

  // Função para buscar layout do dashboard
  const fetchLayout = useCallback(async (): Promise<DashboardLayout | null> => {
    try {
      const response = await fetch(`/api/dashboard/layout?tenant_id=${tenantId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar layout: ${response.statusText}`);
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (err) {
      console.error('Erro ao buscar layout:', err);
      throw err;
    }
  }, [tenantId]);

  // Função para buscar dados dos widgets
  const fetchWidgetData = useCallback(async (widgetIds: string[]): Promise<Record<string, any>> => {
    if (widgetIds.length === 0 || !layout) return {};

    try {
      // Filtrar widgets que precisam de refresh (cache expirado ou não existe)
      const now = Date.now();
      const cacheTimeout = 5 * 60 * 1000; // 5 minutos
      
      const widgetsToFetch = enableCache 
        ? widgetIds.filter(id => {
            const cached = dataCache[id];
            return !cached || (now - cached.timestamp) > cacheTimeout;
          })
        : widgetIds;

      if (widgetsToFetch.length === 0) {
        // Retornar dados do cache
        const cachedData: Record<string, any> = {};
        widgetIds.forEach(id => {
          if (dataCache[id]) {
            cachedData[id] = dataCache[id].data;
          }
        });
        return cachedData;
      }

      // Construir queries usando dados do layout
      const queries = widgetsToFetch.map(widgetId => {
        const widget = layout.widgets.find(w => w.widget_id === widgetId);
        if (!widget) {
          throw new Error(`Widget ${widgetId} não encontrado no layout`);
        }

        return {
          widgetId: widget.widget_id,
          queryType: widget.query_type,
          queryConfig: widget.query_config,
          customParams: widget.custom_params
        };
      });

      const response = await fetch('/api/dashboard/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          queries
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar dados dos widgets: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Erro desconhecido');
      }

      const newData: Record<string, any> = {};
      const newCache = { ...dataCache };

      // Processar respostas dos widgets
      Object.entries(result.data).forEach(([widgetId, data]) => {
        newData[widgetId] = data;
        
        // Atualizar cache
        if (enableCache) {
          newCache[widgetId] = {
            data: data,
            timestamp: now
          };
        }
      });

      // Adicionar dados do cache para widgets não atualizados
      widgetIds.forEach(id => {
        if (!newData[id] && dataCache[id]) {
          newData[id] = dataCache[id].data;
        }
      });

      if (enableCache) {
        setDataCache(newCache);
      }

      return newData;
    } catch (err) {
      console.error('Erro ao buscar dados dos widgets:', err);
      throw err;
    }
  }, [tenantId, dataCache, enableCache]);

  // Função para atualizar layout
  const updateLayout = useCallback(async (newLayout: WidgetLayoutItem[]): Promise<boolean> => {
    try {
      const response = await fetch('/api/dashboard/layout', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenant_id: tenantId,
          layout_config: newLayout
        }),
      });

      const result = await response.json();
      
      if (result.success && layout) {
        setLayout({
          ...layout,
          layout_config: newLayout
        });
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Erro ao atualizar layout:', err);
      return false;
    }
  }, [tenantId, layout]);

  // Função para atualizar parâmetros de widget
  const updateWidgetParams = useCallback(async (widgetId: string, params: Record<string, any>): Promise<boolean> => {
    try {
      const response = await fetch('/api/dashboard/widgets', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenant_id: tenantId,
          widget_id: widgetId,
          custom_params: params
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Atualizar layout local
        if (layout) {
          const updatedWidgets = layout.widgets.map(widget => 
            widget.widget_id === widgetId 
              ? { ...widget, custom_params: { ...widget.custom_params, ...params } }
              : widget
          );
          
          setLayout({
            ...layout,
            widgets: updatedWidgets
          });
        }
        
        // Invalidar cache para este widget
        if (enableCache) {
          const newCache = { ...dataCache };
          delete newCache[widgetId];
          setDataCache(newCache);
        }
        
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Erro ao atualizar parâmetros do widget:', err);
      return false;
    }
  }, [tenantId, layout, dataCache, enableCache]);

  // Função para habilitar widget
  const enableWidget = useCallback(async (tenantWidgetId: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/dashboard/widgets', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantWidgetId: tenantWidgetId,
          enabled: true
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Atualizar estado local se o widget existe no layout
        if (layout) {
          const updatedWidgets = layout.widgets.map(widget => 
            widget.id === tenantWidgetId 
              ? { ...widget, enabled: true }
              : widget
          );
          
          setLayout({
            ...layout,
            widgets: updatedWidgets
          });
        }
        
        // Buscar dados do widget recém habilitado
        try {
          // Encontrar widgetId do dashboard_widgets
          const widget = layout?.widgets?.find(w => w.id === tenantWidgetId);
          if (widget?.widgetId) {
            const data = await fetchWidgetData([widget.widgetId]);
            setWidgetData(prev => ({ ...prev, ...data }));
          }
        } catch (dataErr) {
          console.warn('Erro ao buscar dados do widget habilitado:', dataErr);
        }
        
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Erro ao habilitar widget:', err);
      return false;
    }
  }, [tenantId, layout, fetchWidgetData]);

  // Função para desabilitar widget
  const disableWidget = useCallback(async (tenantWidgetId: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/dashboard/widgets', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantWidgetId: tenantWidgetId,
          enabled: false
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Atualizar estado local se o widget existe no layout
        if (layout) {
          const updatedWidgets = layout.widgets.map(widget => 
            widget.id === tenantWidgetId 
              ? { ...widget, enabled: false }
              : widget
          );
          
          setLayout({
            ...layout,
            widgets: updatedWidgets
          });
        }
        
        // Remover dados do widget do cache
        const widget = layout?.widgets?.find(w => w.id === tenantWidgetId);
        if (widget?.widgetId) {
          setWidgetData(prev => {
            const newData = { ...prev };
            delete newData[widget.widgetId];
            return newData;
          });
        }
        
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Erro ao desabilitar widget:', err);
      return false;
    }
  }, [tenantId, layout]);

  // Função para habilitar widget (buscar widget disponível e habilitar para o tenant)
  const createWidget = useCallback(async (widgetKey: string, metadata: any): Promise<boolean> => {
    try {
      // Primeiro, buscar widgets disponíveis para encontrar o ID correto
      const availableResponse = await fetch(`/api/dashboard/widgets?type=all`);
      const availableResult = await availableResponse.json();
      
      console.debug('🔍 Available widgets API response:', availableResult);
      console.debug('🔍 Available widgets count:', availableResult.data?.length || 0);
      
      if (!availableResult.success) {
        console.error('Erro ao buscar widgets disponíveis:', availableResult.error);
        return false;
      }
      
      // Encontrar o widget pela component_path
      const componentPath = `/widgets/${metadata.module_id}/${widgetKey}`;
      const targetWidget = availableResult.data.find((w: any) => 
        w.component_path === componentPath
      );
      
      if (!targetWidget) {
        console.error(`Widget não encontrado para path: ${componentPath}`);
        return false;
      }
      
              console.debug('🔍 Found target widget:', targetWidget);
      
      // Agora habilitar o widget para o tenant
      const response = await fetch('/api/dashboard/widgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          widgetId: targetWidget.id, // Use o ID real do widget
          position: { 
            x: 0, 
            y: 0, 
            w: metadata.defaultWidth || 3, 
            h: metadata.defaultHeight || 2 
          },
          customParams: {},
          displayOrder: 0
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Fazer refresh do layout imediatamente
        try {
          const newLayout = await fetchLayout();
          setLayout(newLayout);
          
          if (newLayout && newLayout.widgets.length > 0) {
            const enabledWidgetIds = newLayout.widgets
              .filter(w => w.enabled)
              .map(w => w.widget_id);
              
            if (enabledWidgetIds.length > 0) {
              const data = await fetchWidgetData(enabledWidgetIds);
              setWidgetData(data);
            }
          }
        } catch (refreshErr) {
          console.warn('Erro ao fazer refresh após criar widget:', refreshErr);
        }
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Erro ao criar widget:', err);
      return false;
    }
  }, [tenantId, fetchLayout, fetchWidgetData]);

  // Função para refresh do layout
  const refreshLayout = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const newLayout = await fetchLayout();
      setLayout(newLayout);
      
      if (newLayout && newLayout.widgets.length > 0) {
        const enabledWidgetIds = newLayout.widgets
          .filter(w => w.enabled)
          .map(w => w.widget_id);
          
        if (enabledWidgetIds.length > 0) {
          const data = await fetchWidgetData(enabledWidgetIds);
          setWidgetData(data);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [fetchLayout, fetchWidgetData]);

  // Função para refresh dos dados dos widgets
  const refreshWidgetData = useCallback(async (widgetIds?: string[]) => {
    if (!layout) return;
    
    const targetWidgetIds = widgetIds || layout.widgets
      .filter(w => w.enabled)
      .map(w => w.widget_id);
      
    if (targetWidgetIds.length === 0) return;
    
    try {
      // Invalidar cache para widgets especificados
      if (enableCache && widgetIds) {
        const newCache = { ...dataCache };
        widgetIds.forEach(id => delete newCache[id]);
        setDataCache(newCache);
      }
      
      const data = await fetchWidgetData(targetWidgetIds);
      setWidgetData(prev => ({ ...prev, ...data }));
    } catch (err) {
      console.error('Erro ao atualizar dados dos widgets:', err);
    }
  }, [layout, fetchWidgetData, dataCache, enableCache]);

  // Carregamento inicial
  useEffect(() => {
    refreshLayout();
  }, [refreshLayout]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !layout) return;

    const interval = setInterval(() => {
      refreshWidgetData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, layout, refreshWidgetData]);

  return {
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
  };
}