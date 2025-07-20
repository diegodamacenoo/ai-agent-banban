const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugModules() {
  console.log('🔍 Debug - Verificando módulos das organizações...\n');

  try {
    // Buscar todas as organizações
    const { data: organizations, error: orgError } = await supabase
      .from('organizations')
      .select('id, company_trading_name, company_legal_name, slug, client_type, implementation_config, is_implementation_complete')
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

    organizations.forEach((org, index) => {
      console.log(`${index + 1}. ${org.company_trading_name || org.company_legal_name}`);
      console.log(`   ID: ${org.id}`);
      console.log(`   Slug: ${org.slug || 'N/A'}`);
      console.log(`   Tipo: ${org.client_type || 'N/A'}`);
      console.log(`   Implementação Completa: ${org.is_implementation_complete ? 'Sim' : 'Não'}`);
      console.log(`   Config de Implementação:`, org.implementation_config);
      
      if (org.implementation_config?.subscribed_modules) {
        console.log(`   ✅ Módulos Assinados (${org.implementation_config.subscribed_modules.length}):`, 
          org.implementation_config.subscribed_modules);
      } else {
        console.log(`   ❌ Nenhum módulo assinado encontrado`);
      }
      console.log('   ---\n');
    });

    // Testar especificamente uma organização (primeira da lista)
    if (organizations.length > 0) {
      const testOrg = organizations[0];
      console.log(`🧪 Testando organização: ${testOrg.company_trading_name}`);
      console.log(`🔗 Slug: ${testOrg.slug}`);
      
      // Simular o que o UnifiedSidebar faz
      const subscribedModules = testOrg.implementation_config?.subscribed_modules || [];
      console.log(`📋 Módulos que deveriam aparecer na sidebar:`, subscribedModules);
      
      if (subscribedModules.length === 0) {
        console.warn('⚠️ PROBLEMA IDENTIFICADO: Organização não tem módulos assinados!');
        console.log('💡 Solução: Configure módulos na página de administração');
      } else {
        console.log('✅ Módulos configurados corretamente');
      }
    }

  } catch (error) {
    console.error('❌ Erro durante debug:', error);
  }
}

// Executar debug
debugModules().then(() => {
  console.log('\n🏁 Debug concluído');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
}); 