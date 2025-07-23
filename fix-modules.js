// Script para corrigir módulos via terminal
const { createClient } = require('@supabase/supabase-js');

async function fixTenantModules() {
  const supabase = createClient(
    'https://bopytcghbmuywfltmwhk.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvcHl0Y2doYm11eXdmbHRtd2hrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjMxMDg3NSwiZXhwIjoyMDYxODg2ODc1fQ.M0DtA5nTtsEDAg8FPowvKhWuF09lhh0gEcdCWW5Pb4U'
  );

  const tenantId = '2da2a9a7-89ec-48bf-a3bc-c46e58d5a9b4';
  
  console.log('🔧 Corrigindo módulos para tenant:', tenantId);

  // 1. Verificar assignments existentes
  const { data: existing } = await supabase
    .from('tenant_module_assignments')
    .select('*')
    .eq('tenant_id', tenantId);

  console.log('📋 Assignments existentes:', existing?.length || 0);

  if (existing && existing.length > 0) {
    console.log('✅ Tenant já tem módulos atribuídos');
    existing.forEach(a => console.log(`  - ${a.base_module_id} (ativo: ${a.is_active})`));
    return;
  }

  // 2. Buscar módulos base
  const { data: baseModules } = await supabase
    .from('base_modules')
    .select('*')
    .eq('is_active', true);

  console.log('📦 Módulos base disponíveis:', baseModules?.length || 0);

  // 3. Atribuir cada módulo
  for (const module of baseModules || []) {
    // Buscar implementação padrão
    const { data: impl } = await supabase
      .from('module_implementations')
      .select('id')
      .eq('base_module_id', module.id)
      .eq('is_default', true)
      .single();

    // Inserir assignment
    const { error } = await supabase
      .from('tenant_module_assignments')
      .insert({
        tenant_id: tenantId,
        base_module_id: module.id,
        implementation_id: impl?.id,
        is_active: true,
        assigned_at: new Date().toISOString(),
        custom_config: {}
      });

    if (error) {
      console.error(`❌ Erro ao atribuir ${module.slug}:`, error.message);
    } else {
      console.log(`✅ ${module.slug} atribuído`);
    }
  }

  console.log('🎉 Correção concluída! Vá para http://localhost:3000/banban-fashion');
}

fixTenantModules().catch(console.error);