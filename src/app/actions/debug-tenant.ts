'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function debugTenantModules() {
  const organizationId = '2da2a9a7-89ec-48bf-a3bc-c46e58d5a9b4';
  
  console.log(`🔍 Debugando módulos para organização: ${organizationId}`);
  console.log('='.repeat(50));

  const supabase = await createSupabaseServerClient();

  // 1. Verificar se a organização existe
  console.log('\n1. Verificando organização...');
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id, slug, company_trading_name')
    .eq('id', organizationId)
    .single();

  if (orgError) {
    console.error('❌ Erro ao buscar organização:', orgError);
    return { success: false, error: orgError };
  }

  if (!org) {
    console.error('❌ Organização não encontrada');
    return { success: false, error: 'Organização não encontrada' };
  }

  console.log('✅ Organização encontrada:', {
    id: org.id,
    slug: org.slug,
    name: org.company_trading_name
  });

  // 2. Verificar tenant_module_assignments
  console.log('\n2. Verificando tenant_module_assignments...');
  const { data: assignments, error: assignError } = await supabase
    .from('tenant_module_assignments')
    .select('*')
    .eq('tenant_id', organizationId);

  if (assignError) {
    console.error('❌ Erro ao buscar assignments:', assignError);
    return { success: false, error: assignError };
  }

  console.log(`📋 Encontrados ${assignments?.length || 0} assignments`);
  if (assignments && assignments.length > 0) {
    assignments.forEach((assignment, i) => {
      console.log(`  ${i + 1}. Module: ${assignment.base_module_id} - Ativo: ${assignment.is_active}`);
    });
  } else {
    console.log('❗ NENHUM ASSIGNMENT ENCONTRADO - Este é o problema!');
  }

  // 3. Verificar módulos base
  console.log('\n3. Verificando base_modules disponíveis...');
  const { data: baseModules, error: baseError } = await supabase
    .from('base_modules')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (baseError) {
    console.error('❌ Erro ao buscar base_modules:', baseError);
    return { success: false, error: baseError };
  }

  console.log(`📦 Encontrados ${baseModules?.length || 0} base modules ativos`);
  if (baseModules && baseModules.length > 0) {
    baseModules.forEach((module, i) => {
      console.log(`  ${i + 1}. ID: ${module.id} - Slug: ${module.slug} - Nome: ${module.name}`);
    });
  }

  // 4. Verificar implementações
  console.log('\n4. Verificando module_implementations...');
  const { data: implementations, error: implError } = await supabase
    .from('module_implementations')
    .select('*')
    .order('created_at', { ascending: false });

  if (implError) {
    console.error('❌ Erro ao buscar implementations:', implError);
    return { success: false, error: implError };
  }

  console.log(`🔧 Encontradas ${implementations?.length || 0} implementations`);
  if (implementations && implementations.length > 0) {
    implementations.forEach((impl, i) => {
      console.log(`  ${i + 1}. Base Module: ${impl.base_module_id} - Key: ${impl.implementation_key}`);
    });
  }

  console.log('\n✅ Debug concluído');
  
  // Conclusão
  console.log('\n🎯 DIAGNÓSTICO:');
  if (!assignments || assignments.length === 0) {
    console.log('❌ PROBLEMA IDENTIFICADO: Não há tenant_module_assignments para esta organização');
    console.log('💡 SOLUÇÃO: É necessário atribuir módulos a esta organização via painel admin');
  }

  return { 
    success: true, 
    data: {
      organization: org,
      assignments: assignments || [],
      baseModules: baseModules || [],
      implementations: implementations || []
    },
    diagnosis: {
      hasAssignments: assignments && assignments.length > 0,
      hasBaseModules: baseModules && baseModules.length > 0,
      hasImplementations: implementations && implementations.length > 0,
      recommendedAction: (!assignments || assignments.length === 0) ? 
        'ASSIGN_MODULES' : 
        assignments.some(a => !a.is_active) ? 'ACTIVATE_MODULES' : 'OK'
    }
  };
}

// Função adicional para atribuir módulos automaticamente (apenas para debug)
export async function autoAssignModulesToTenant() {
  const organizationId = '2da2a9a7-89ec-48bf-a3bc-c46e58d5a9b4';
  
  console.log(`🔧 Auto-atribuindo módulos para organização: ${organizationId}`);
  
  const supabase = await createSupabaseServerClient();
  
  // Buscar módulos base disponíveis
  const { data: baseModules, error } = await supabase
    .from('base_modules')
    .select('id, slug, name')
    .eq('is_active', true);
    
  if (error || !baseModules || baseModules.length === 0) {
    console.error('❌ Nenhum módulo base encontrado');
    return { success: false, error: 'Nenhum módulo base disponível' };
  }
  
  const results = [];
  
  for (const module of baseModules) {
    // Verificar se já existe atribuição
    const { data: existing } = await supabase
      .from('tenant_module_assignments')
      .select('tenant_id')
      .eq('tenant_id', organizationId)
      .eq('base_module_id', module.id)
      .single();
      
    if (existing) {
      results.push({ module: module.slug, status: 'já_atribuído' });
      continue;
    }
    
    // Buscar implementação padrão
    const { data: defaultImpl } = await supabase
      .from('module_implementations')
      .select('id')
      .eq('base_module_id', module.id)
      .eq('is_default', true)
      .single();
    
    // Criar atribuição
    const { error: assignError } = await supabase
      .from('tenant_module_assignments')
      .insert({
        tenant_id: organizationId,
        base_module_id: module.id,
        implementation_id: defaultImpl?.id,
        is_active: true,
        assigned_at: new Date().toISOString(),
        custom_config: {}
      });
      
    if (assignError) {
      console.error(`❌ Erro ao atribuir ${module.slug}:`, assignError);
      results.push({ module: module.slug, status: 'erro', error: assignError });
    } else {
      console.log(`✅ Módulo ${module.slug} atribuído com sucesso`);
      results.push({ module: module.slug, status: 'atribuído' });
    }
  }
  
  return { success: true, results };
}