const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase para produção
const supabaseUrl = 'https://bopytcghbmuywfltmwhk.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvcHl0Y2doYm11eXdmbHRtd2hrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjMxMDg3NSwiZXhwIjoyMDYxODg2ODc1fQ.M0DtA5nTtsEDAg8FPowvKhWuF09lhh0gEcdCWW5Pb4U';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BANBAN_TENANT_ID = '2da2a9a7-89ec-48bf-a3bc-c46e58d5a9b4';

async function investigateBanbanModules() {
  console.log('🔍 INVESTIGAÇÃO - Módulos da Organização BANBAN-FASHION');
  console.log('═'.repeat(70));
  console.log(`📋 Tenant ID: ${BANBAN_TENANT_ID}`);
  console.log('');

  try {
    // 1. Verificar a organização Banban
    console.log('🏢 1. VERIFICANDO ORGANIZAÇÃO BANBAN');
    console.log('─'.repeat(50));
    
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', BANBAN_TENANT_ID)
      .single();

    if (orgError) {
      console.error('❌ Erro ao buscar organização:', orgError);
      return;
    }

    if (organization) {
      console.log(`✅ Organização: ${organization.company_trading_name || organization.company_legal_name}`);
      console.log(`📍 Slug: ${organization.slug}`);
      console.log(`🎯 Client Type: ${organization.client_type}`);
      console.log(`🔧 Implementation Config:`, JSON.stringify(organization.implementation_config, null, 2));
    }

    // 2. Verificar atribuições na nova arquitetura (tenant_module_assignments)
    console.log('\n🔗 2. ATRIBUIÇÕES DE MÓDULOS (tenant_module_assignments)');
    console.log('─'.repeat(50));

    const { data: assignments, error: assignError } = await supabase
      .from('tenant_module_assignments')
      .select(`
        tenant_id,
        base_module_id,
        implementation_id,
        is_active,
        custom_config,
        assigned_at,
        base_modules (
          id,
          slug,
          name,
          description,
          category
        ),
        module_implementations (
          id,
          implementation_key,
          name,
          component_path,
          component_type,
          audience,
          template_type
        )
      `)
      .eq('tenant_id', BANBAN_TENANT_ID);

    if (assignError) {
      console.error('❌ Erro ao buscar atribuições:', assignError);
    } else if (assignments && assignments.length > 0) {
      console.log(`✅ Encontradas ${assignments.length} atribuições de módulos:`);
      console.log('');
      
      assignments.forEach((assignment, index) => {
        const baseModule = assignment.base_modules;
        const implementation = assignment.module_implementations;
        
        console.log(`${index + 1}. ${baseModule?.name || 'Módulo Base Não Encontrado'}`);
        console.log(`   📋 Base Module:`);
        console.log(`      ID: ${assignment.base_module_id}`);
        console.log(`      Slug: ${baseModule?.slug || 'N/A'}`);
        console.log(`      Categoria: ${baseModule?.category || 'N/A'}`);
        console.log(`   🔧 Implementation:`);
        console.log(`      ID: ${assignment.implementation_id || 'N/A'}`);
        console.log(`      Key: ${implementation?.implementation_key || 'N/A'}`);
        console.log(`      📁 Component Path: ${implementation?.component_path || 'N/A'}`);
        console.log(`      🎯 Audience: ${implementation?.audience || 'N/A'}`);
        console.log(`      📊 Template Type: ${implementation?.template_type || 'N/A'}`);
        console.log(`   🔄 Assignment Status:`);
        console.log(`      Ativo: ${assignment.is_active ? '✅' : '❌'}`);
        console.log(`      Assigned At: ${assignment.assigned_at}`);
        console.log('');
      });
    } else {
      console.log('❌ Nenhuma atribuição encontrada na nova arquitetura');
    }

    // 3. Verificar todas as implementações que podem ser para Banban
    console.log('\n🔍 3. IMPLEMENTAÇÕES DISPONÍVEIS PARA BANBAN');
    console.log('─'.repeat(50));

    const { data: implementations, error: implError } = await supabase
      .from('module_implementations')
      .select(`
        id,
        base_module_id,
        implementation_key,
        name,
        component_path,
        component_type,
        audience,
        template_type,
        is_active,
        is_default,
        base_modules (
          slug,
          name,
          category
        )
      `)
      .or('audience.eq.banban,audience.eq.generic')
      .eq('is_active', true)
      .order('audience', { ascending: false })
      .order('component_path', { ascending: true });

    if (implError) {
      console.error('❌ Erro ao buscar implementações:', implError);
    } else if (implementations && implementations.length > 0) {
      console.log(`✅ Encontradas ${implementations.length} implementações para Banban:`);
      console.log('');
      
      // Agrupar por audience
      const banbanImplementations = implementations.filter(impl => impl.audience === 'banban');
      const genericImplementations = implementations.filter(impl => impl.audience === 'generic');
      
      if (banbanImplementations.length > 0) {
        console.log(`🎯 IMPLEMENTAÇÕES ESPECÍFICAS BANBAN (${banbanImplementations.length}):`);
        banbanImplementations.forEach((impl, index) => {
          console.log(`   ${index + 1}. ${impl.name}`);
          console.log(`      📁 Path: ${impl.component_path}`);
          console.log(`      🔧 Key: ${impl.implementation_key}`);
          console.log(`      📊 Template: ${impl.template_type || 'N/A'}`);
          console.log(`      🔗 Base Module: ${impl.base_modules?.name} (${impl.base_modules?.slug})`);
        });
        console.log('');
      }

      if (genericImplementations.length > 0) {
        console.log(`🌐 IMPLEMENTAÇÕES GENÉRICAS (${genericImplementations.length}):`);
        genericImplementations.forEach((impl, index) => {
          console.log(`   ${index + 1}. ${impl.name}`);
          console.log(`      📁 Path: ${impl.component_path}`);
          console.log(`      🔧 Key: ${impl.implementation_key}`);
          console.log(`      📊 Template: ${impl.template_type || 'N/A'}`);
          console.log(`      🔗 Base Module: ${impl.base_modules?.name} (${impl.base_modules?.slug})`);
        });
      }
    } else {
      console.log('❌ Nenhuma implementação encontrada');
    }

    // 4. Analisar padrões de component_path
    console.log('\n📁 4. ANÁLISE DE PADRÕES DE COMPONENT_PATH');
    console.log('─'.repeat(50));

    const { data: allPaths, error: pathError } = await supabase
      .from('module_implementations')
      .select('component_path, audience, implementation_key')
      .eq('is_active', true);

    if (pathError) {
      console.error('❌ Erro ao analisar paths:', pathError);
    } else if (allPaths && allPaths.length > 0) {
      // Analisar padrões
      const pathPatterns = {};
      const problematicPaths = [];

      allPaths.forEach(impl => {
        const path = impl.component_path;
        
        // Identificar padrões
        let pattern = 'OTHER';
        if (path.includes('/clients/custom/')) {
          pattern = 'CUSTOM_CLIENT';
          problematicPaths.push(impl);
        } else if (path.includes('/clients/banban/')) {
          pattern = 'BANBAN_CLIENT';
        } else if (path.includes('@/clients/custom/')) {
          pattern = 'AT_CUSTOM_CLIENT';
          problematicPaths.push(impl);
        } else if (path.includes('@/clients/banban/')) {
          pattern = 'AT_BANBAN_CLIENT';
        } else if (path.includes('/widgets/')) {
          pattern = 'WIDGET';
        } else if (path.includes('/core/')) {
          pattern = 'CORE_MODULE';
        }

        if (!pathPatterns[pattern]) {
          pathPatterns[pattern] = [];
        }
        pathPatterns[pattern].push(impl);
      });

      console.log('📊 PADRÕES DE PATHS ENCONTRADOS:');
      Object.entries(pathPatterns).forEach(([pattern, impls]) => {
        console.log(`   ${pattern}: ${impls.length} implementações`);
        
        if (pattern === 'CUSTOM_CLIENT' || pattern === 'AT_CUSTOM_CLIENT') {
          console.log(`      ⚠️ PROBLEMÁTICO - Paths que podem causar erro ao carregar`);
        }
      });

      if (problematicPaths.length > 0) {
        console.log('\n🚨 PATHS PROBLEMÁTICOS ENCONTRADOS:');
        problematicPaths.forEach((impl, index) => {
          console.log(`   ${index + 1}. ${impl.component_path}`);
          console.log(`      Audience: ${impl.audience}`);
          console.log(`      Key: ${impl.implementation_key}`);
        });
        
        console.log('\n💡 POSSÍVEL CAUSA DO PROBLEMA:');
        console.log('   Esses paths contêm "custom" que pode fazer o sistema tentar');
        console.log('   carregar módulos de @/clients/custom/* em vez de @/clients/banban/*');
      }
    }

    // 5. Verificar status dos módulos base
    console.log('\n📋 5. MÓDULOS BASE DISPONÍVEIS');
    console.log('─'.repeat(50));

    const { data: baseModules, error: baseError } = await supabase
      .from('base_modules')
      .select('id, slug, name, category, status, is_active, supports_multi_tenant')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (baseError) {
      console.error('❌ Erro ao buscar módulos base:', baseError);
    } else if (baseModules && baseModules.length > 0) {
      console.log(`✅ Encontrados ${baseModules.length} módulos base ativos:`);
      
      const categories = {};
      baseModules.forEach(module => {
        if (!categories[module.category]) {
          categories[module.category] = [];
        }
        categories[module.category].push(module);
      });

      Object.entries(categories).forEach(([category, modules]) => {
        console.log(`\n   📂 ${category.toUpperCase()}:`);
        modules.forEach(module => {
          console.log(`      • ${module.name} (${module.slug})`);
        });
      });
    }

  } catch (error) {
    console.error('❌ Erro durante investigação:', error);
  }
}

// Executar investigação
investigateBanbanModules().then(() => {
  console.log('\n🏁 Investigação concluída');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});