const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertPerformanceWidget() {
  console.log('🚀 Inserindo Performance KPIs widget...');
  
  const widget = {
    id: randomUUID(),
    title: 'Performance KPIs',
    description: 'Indicadores-chave de performance do negócio',
    component_path: '/widgets/analytics/performance-kpis',
    module_id: 'analytics',
    category: 'analytics',
    query_type: 'rpc',
    query_config: {
      function: 'get_performance_kpis',
      params: {
        period: '30d',
        include_trends: true
      }
    },
    default_params: {
      period: '30d',
      include_trends: true
    },
    is_active: true
  };

  try {
    const { data, error } = await supabase
      .from('dashboard_widgets')
      .upsert(widget, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('❌ Erro ao inserir widget:', error);
      return false;
    }

    console.log('✅ Widget inserido com sucesso:', data);
    return true;
  } catch (err) {
    console.error('❌ Erro no script:', err);
    return false;
  }
}

insertPerformanceWidget().then(success => {
  console.log(success ? '🎉 Script executado com sucesso!' : '❌ Script falhou');
  process.exit(success ? 0 : 1);
});