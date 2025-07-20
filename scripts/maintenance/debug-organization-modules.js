const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugOrganizationModules() {
  console.log('🔍 Debug - Verificando módulos de organizações específicas...\n');

  try {
    // Buscar organizações com dados completos
    const { data: organizations, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });

    if (orgError) {
      console.error('❌ Erro ao buscar organizações:', orgError);
      return;
    }

    if (!organizations || organizations.length === 0) {
      console.warn('⚠️ Nenhuma organização encontrada');
      return;
    }

    console.log(`📊 Encontradas ${organizations.length} organizações:\n`);

    // Analisar cada organização
    for (let i = 0; i < organizations.length; i++) {
      const org = organizations[i];
      console.log(`\n${i + 1}. 🏢 ${org.company_trading_name || org.company_legal_name}`);
      console.log(`   📋 Dados Básicos:`);
      console.log(`      ID: ${org.id}`);
      console.log(`      Slug: ${org.slug || 'N/A'}`);
      console.log(`      Tipo: ${org.client_type || 'N/A'}`);
      console.log(`      Implementação Completa: ${org.is_implementation_complete ? '✅ Sim' : '❌ Não'}`);
      
      console.log(`   🔧 Implementation Config:`);
      if (org.implementation_config) {
        console.log(`      Raw Config:`, JSON.stringify(org.implementation_config, null, 2));
        
        if (org.implementation_config.subscribed_modules) {
          console.log(`      ✅ Módulos Assinados (${org.implementation_config.subscribed_modules.length}):`);
          org.implementation_config.subscribed_modules.forEach((module, idx) => {
            console.log(`         ${idx + 1}. ${module}`);
          });
        } else {
          console.log(`      ❌ Nenhum módulo em subscribed_modules`);
        }

        if (org.implementation_config.custom_modules) {
          console.log(`      🔧 Custom Modules (${org.implementation_config.custom_modules.length}):`);
          org.implementation_config.custom_modules.forEach((module, idx) => {
            console.log(`         ${idx + 1}. ${module}`);
          });
        }

        if (org.implementation_config.features) {
          console.log(`      🎯 Features (${org.implementation_config.features.length}):`);
          org.implementation_config.features.forEach((feature, idx) => {
            console.log(`         ${idx + 1}. ${feature}`);
          });
        }
      } else {
        console.log(`      ❌ Nenhuma configuração de implementação encontrada`);
      }

      // Simular o que o UnifiedSidebar faz
      console.log(`   🧪 Simulação UnifiedSidebar:`);
      const subscribedModules = org.implementation_config?.subscribed_modules || [];
      console.log(`      Módulos que deveriam aparecer na sidebar: [${subscribedModules.join(', ')}]`);
      
      if (subscribedModules.length === 0) {
        console.log(`      ⚠️ PROBLEMA: Nenhum módulo configurado para aparecer na sidebar!`);
      } else {
        console.log(`      ✅ ${subscribedModules.length} módulos deveriam aparecer na sidebar`);
        
        // Mapear módulos como o UnifiedSidebar faz
        const moduleNavItems = [];
        
        if (subscribedModules.includes('insights')) {
          moduleNavItems.push('Insights Avançados');
        }
        if (subscribedModules.includes('performance')) {
          moduleNavItems.push('Performance');
        }
        if (subscribedModules.includes('alerts')) {
          moduleNavItems.push('Alertas');
        }
        if (subscribedModules.includes('inventory')) {
          moduleNavItems.push('Gestão de Estoque');
        }
        if (subscribedModules.includes('analytics')) {
          moduleNavItems.push('Analytics');
        }
        if (subscribedModules.includes('data-processing')) {
          moduleNavItems.push('Processamento de Dados');
        }

        console.log(`      📋 Items de navegação que seriam criados:`);
        moduleNavItems.forEach((item, idx) => {
          console.log(`         ${idx + 1}. ${item}`);
        });

        if (moduleNavItems.length === 0) {
          console.log(`      ⚠️ PROBLEMA: Módulos configurados não correspondem aos mapeados no UnifiedSidebar!`);
          console.log(`      💡 Módulos configurados: [${subscribedModules.join(', ')}]`);
          console.log(`      💡 Módulos suportados: [insights, performance, alerts, inventory, analytics, data-processing]`);
        }
      }

      console.log(`   ${'─'.repeat(80)}`);
    }

    // Testar especificamente uma organização com slug
    const orgWithSlug = organizations.find(org => org.slug);
    if (orgWithSlug) {
      console.log(`\n🧪 TESTE ESPECÍFICO: Organização ${orgWithSlug.company_trading_name}`);
      console.log(`   Slug: ${orgWithSlug.slug}`);
      console.log(`   URL do tenant: /${orgWithSlug.slug}`);
      
      const subscribedModules = orgWithSlug.implementation_config?.subscribed_modules || [];
      console.log(`   Módulos que deveriam aparecer: [${subscribedModules.join(', ')}]`);
      
      if (subscribedModules.length === 0) {
        console.log(`   ❌ DIAGNÓSTICO: Esta organização não tem módulos configurados!`);
        console.log(`   💡 SOLUÇÃO: Configure módulos na página /admin/organizations/${orgWithSlug.id}`);
      } else {
        console.log(`   ✅ DIAGNÓSTICO: Organização tem ${subscribedModules.length} módulos configurados`);
        console.log(`   🔍 PRÓXIMO PASSO: Verificar se estes módulos estão chegando ao layout tenant`);
      }
    }

  } catch (error) {
    console.error('❌ Erro durante debug:', error);
  }
}

// Executar debug
debugOrganizationModules().then(() => {
  console.log('\n🏁 Debug de módulos concluído');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
}); 