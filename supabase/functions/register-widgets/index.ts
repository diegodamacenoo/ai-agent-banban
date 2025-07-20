import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Interface para os dados de entrada
interface RegisterWidgetsRequest {
  tenant_id: string;
  module_id: string;
  action: 'enable' | 'disable' | 'sync';
  widget_ids?: string[]; // Opcional: widgets específicos
}

// Interface para log de auditoria
interface AuditLog {
  action: string;
  tenant_id: string;
  module_id: string;
  widgets_count: number;
  success: boolean;
  error_message?: string;
  timestamp: string;
}

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const requestData: RegisterWidgetsRequest = await req.json();
    const { tenant_id, module_id, action, widget_ids } = requestData;

    // Validação de entrada
    if (!tenant_id || !module_id || !action) {
      return new Response(JSON.stringify({
        error: 'tenant_id, module_id e action são obrigatórios'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`🔧 Register Widgets: ${action} para tenant ${tenant_id}, módulo ${module_id}`);

    let result;
    let auditLog: AuditLog = {
      action,
      tenant_id,
      module_id,
      widgets_count: 0,
      success: false,
      timestamp: new Date().toISOString()
    };

    switch (action) {
      case 'enable':
        result = await enableModuleWidgets(supabase, tenant_id, module_id, widget_ids);
        break;
      case 'disable':
        result = await disableModuleWidgets(supabase, tenant_id, module_id, widget_ids);
        break;
      case 'sync':
        result = await syncModuleWidgets(supabase, tenant_id, module_id);
        break;
      default:
        throw new Error(`Ação inválida: ${action}`);
    }

    // Atualizar log de auditoria
    auditLog.widgets_count = result.widgetsProcessed;
    auditLog.success = result.success;
    auditLog.error_message = result.error;

    // Salvar log de auditoria
    await saveAuditLog(supabase, auditLog);

    return new Response(JSON.stringify({
      success: result.success,
      message: result.message,
      widgets_processed: result.widgetsProcessed,
      widgets_enabled: result.widgetsEnabled,
      widgets_disabled: result.widgetsDisabled,
      details: result.details
    }), {
      status: result.success ? 200 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Erro na Edge Function register-widgets:', error);
    
    return new Response(JSON.stringify({
      error: 'Erro interno do servidor',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

/**
 * Habilita widgets de um módulo para um tenant
 */
async function enableModuleWidgets(
  supabase: any, 
  tenantId: string, 
  moduleId: string, 
  specificWidgetIds?: string[]
) {
  try {
    // 1. Verificar se a organização existe
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', tenantId)
      .single();

    if (orgError || !organization) {
      throw new Error('Organização não encontrada');
    }

    // 2. Buscar widgets disponíveis do módulo
    let widgetsQuery = supabase
      .from('dashboard_widgets')
      .select('*')
      .eq('module_id', moduleId)
      .eq('is_active', true);

    // Filtrar por widgets específicos se fornecido
    if (specificWidgetIds && specificWidgetIds.length > 0) {
      widgetsQuery = widgetsQuery.in('id', specificWidgetIds);
    }

    const { data: availableWidgets, error: widgetsError } = await widgetsQuery;

    if (widgetsError) {
      throw new Error(`Erro ao buscar widgets: ${widgetsError.message}`);
    }

    if (!availableWidgets || availableWidgets.length === 0) {
      return {
        success: true,
        message: 'Nenhum widget encontrado para habilitar',
        widgetsProcessed: 0,
        widgetsEnabled: 0,
        widgetsDisabled: 0,
        details: []
      };
    }

    // 3. Preparar dados para inserção
    const tenantWidgets = availableWidgets.map((widget, index) => ({
      tenant_id: tenantId,
      widget_id: widget.id,
      enabled: true,
      position_x: 0,
      position_y: index * (widget.default_height || 4), // Posicionamento automático
      width: widget.default_width || 4,
      height: widget.default_height || 4,
      custom_params: {},
      display_order: index
    }));

    // 4. Inserir/atualizar widgets do tenant
    const { data: insertedWidgets, error: insertError } = await supabase
      .from('tenant_dashboard_widgets')
      .upsert(tenantWidgets, {
        onConflict: 'tenant_id,widget_id',
        ignoreDuplicates: false
      })
      .select();

    if (insertError) {
      throw new Error(`Erro ao habilitar widgets: ${insertError.message}`);
    }

    console.log(`✅ Habilitados ${insertedWidgets?.length || 0} widgets para tenant ${tenantId}`);

    return {
      success: true,
      message: `Widgets do módulo ${moduleId} habilitados com sucesso`,
      widgetsProcessed: availableWidgets.length,
      widgetsEnabled: insertedWidgets?.length || 0,
      widgetsDisabled: 0,
      details: insertedWidgets?.map(w => ({
        widget_id: w.widget_id,
        action: 'enabled',
        position: { x: w.position_x, y: w.position_y, w: w.width, h: w.height }
      })) || []
    };

  } catch (error) {
    console.error('❌ Erro ao habilitar widgets:', error);
    return {
      success: false,
      message: `Falha ao habilitar widgets: ${error.message}`,
      widgetsProcessed: 0,
      widgetsEnabled: 0,
      widgetsDisabled: 0,
      details: [],
      error: error.message
    };
  }
}

/**
 * Desabilita widgets de um módulo para um tenant
 */
async function disableModuleWidgets(
  supabase: any, 
  tenantId: string, 
  moduleId: string, 
  specificWidgetIds?: string[]
) {
  try {
    // 1. Buscar widgets habilitados do módulo para o tenant
    let query = supabase
      .from('tenant_dashboard_widgets')
      .select(`
        id,
        widget_id,
        dashboard_widgets!inner (
          id,
          module_id
        )
      `)
      .eq('tenant_id', tenantId)
      .eq('dashboard_widgets.module_id', moduleId);

    // Filtrar por widgets específicos se fornecido
    if (specificWidgetIds && specificWidgetIds.length > 0) {
      query = query.in('widget_id', specificWidgetIds);
    }

    const { data: tenantWidgets, error: queryError } = await query;

    if (queryError) {
      throw new Error(`Erro ao buscar widgets do tenant: ${queryError.message}`);
    }

    if (!tenantWidgets || tenantWidgets.length === 0) {
      return {
        success: true,
        message: 'Nenhum widget encontrado para desabilitar',
        widgetsProcessed: 0,
        widgetsEnabled: 0,
        widgetsDisabled: 0,
        details: []
      };
    }

    // 2. Remover widgets do tenant
    const widgetIds = tenantWidgets.map(w => w.id);
    const { error: deleteError } = await supabase
      .from('tenant_dashboard_widgets')
      .delete()
      .in('id', widgetIds);

    if (deleteError) {
      throw new Error(`Erro ao desabilitar widgets: ${deleteError.message}`);
    }

    console.log(`✅ Desabilitados ${tenantWidgets.length} widgets para tenant ${tenantId}`);

    return {
      success: true,
      message: `Widgets do módulo ${moduleId} desabilitados com sucesso`,
      widgetsProcessed: tenantWidgets.length,
      widgetsEnabled: 0,
      widgetsDisabled: tenantWidgets.length,
      details: tenantWidgets.map(w => ({
        widget_id: w.widget_id,
        action: 'disabled'
      }))
    };

  } catch (error) {
    console.error('❌ Erro ao desabilitar widgets:', error);
    return {
      success: false,
      message: `Falha ao desabilitar widgets: ${error.message}`,
      widgetsProcessed: 0,
      widgetsEnabled: 0,
      widgetsDisabled: 0,
      details: [],
      error: error.message
    };
  }
}

/**
 * Sincroniza widgets de um módulo (adiciona novos, mantém existentes)
 */
async function syncModuleWidgets(
  supabase: any, 
  tenantId: string, 
  moduleId: string
) {
  try {
    // 1. Buscar todos os widgets disponíveis do módulo
    const { data: availableWidgets, error: widgetsError } = await supabase
      .from('dashboard_widgets')
      .select('*')
      .eq('module_id', moduleId)
      .eq('is_active', true);

    if (widgetsError) {
      throw new Error(`Erro ao buscar widgets disponíveis: ${widgetsError.message}`);
    }

    // 2. Buscar widgets já habilitados para o tenant
    const { data: existingWidgets, error: existingError } = await supabase
      .from('tenant_dashboard_widgets')
      .select('widget_id')
      .eq('tenant_id', tenantId)
      .in('widget_id', availableWidgets?.map(w => w.id) || []);

    if (existingError) {
      throw new Error(`Erro ao buscar widgets existentes: ${existingError.message}`);
    }

    const existingWidgetIds = new Set(existingWidgets?.map(w => w.widget_id) || []);

    // 3. Identificar widgets novos para adicionar
    const newWidgets = availableWidgets?.filter(w => !existingWidgetIds.has(w.id)) || [];

    if (newWidgets.length === 0) {
      return {
        success: true,
        message: 'Todos os widgets já estão sincronizados',
        widgetsProcessed: availableWidgets?.length || 0,
        widgetsEnabled: 0,
        widgetsDisabled: 0,
        details: []
      };
    }

    // 4. Adicionar widgets novos
    const tenantWidgets = newWidgets.map((widget, index) => ({
      tenant_id: tenantId,
      widget_id: widget.id,
      enabled: true,
      position_x: 0,
      position_y: (existingWidgets?.length || 0 + index) * (widget.default_height || 4),
      width: widget.default_width || 4,
      height: widget.default_height || 4,
      custom_params: {},
      display_order: (existingWidgets?.length || 0) + index
    }));

    const { data: insertedWidgets, error: insertError } = await supabase
      .from('tenant_dashboard_widgets')
      .insert(tenantWidgets)
      .select();

    if (insertError) {
      throw new Error(`Erro ao sincronizar widgets: ${insertError.message}`);
    }

    console.log(`✅ Sincronizados ${insertedWidgets?.length || 0} novos widgets para tenant ${tenantId}`);

    return {
      success: true,
      message: `${insertedWidgets?.length || 0} novos widgets adicionados na sincronização`,
      widgetsProcessed: availableWidgets?.length || 0,
      widgetsEnabled: insertedWidgets?.length || 0,
      widgetsDisabled: 0,
      details: insertedWidgets?.map(w => ({
        widget_id: w.widget_id,
        action: 'synced',
        position: { x: w.position_x, y: w.position_y, w: w.width, h: w.height }
      })) || []
    };

  } catch (error) {
    console.error('❌ Erro ao sincronizar widgets:', error);
    return {
      success: false,
      message: `Falha ao sincronizar widgets: ${error.message}`,
      widgetsProcessed: 0,
      widgetsEnabled: 0,
      widgetsDisabled: 0,
      details: [],
      error: error.message
    };
  }
}

/**
 * Salva log de auditoria
 */
async function saveAuditLog(supabase: any, auditLog: AuditLog) {
  try {
    await supabase
      .from('widget_registration_logs')
      .insert({
        tenant_id: auditLog.tenant_id,
        module_id: auditLog.module_id,
        action: auditLog.action,
        widgets_count: auditLog.widgets_count,
        success: auditLog.success,
        error_message: auditLog.error_message,
        created_at: auditLog.timestamp
      });
  } catch (error) {
    console.error('⚠️ Falha ao salvar log de auditoria:', error);
    // Não falhar a operação principal por causa do log
  }
}