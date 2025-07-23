const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase para produção
const supabaseUrl = 'https://bopytcghbmuywfltmwhk.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvcHl0Y2doYm11eXdmbHRtd2hrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjMxMDg3NSwiZXhwIjoyMDYxODg2ODc1fQ.M0DtA5nTtsEDAg8FPowvKhWuF09lhh0gEcdCWW5Pb4U';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeComponentPaths() {
  console.log('🔍 ANÁLISE DETALHADA DE COMPONENT_PATHS');
  console.log('═'.repeat(70));

  try {
    // Buscar TODOS os component_paths da tabela
    const { data: implementations, error } = await supabase
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
      .order('component_path', { ascending: true });

    if (error) {
      console.error('❌ Erro ao buscar implementações:', error);
      return;
    }

    console.log(`📊 Total de implementações encontradas: ${implementations.length}`);
    console.log('');

    // Analisar padrões detalhadamente
    const patterns = {
      empty_paths: [],
      custom_client_paths: [],
      banban_client_paths: [],
      at_custom_paths: [],
      at_banban_paths: [],
      core_module_paths: [],
      widget_paths: [],
      implementation_paths: [],
      other_paths: []
    };

    implementations.forEach(impl => {
      const path = impl.component_path;
      
      if (!path || path.trim() === '') {
        patterns.empty_paths.push(impl);
      } else if (path.includes('/clients/custom/')) {
        patterns.custom_client_paths.push(impl);
      } else if (path.includes('/clients/banban/')) {
        patterns.banban_client_paths.push(impl);
      } else if (path.includes('@/clients/custom/')) {
        patterns.at_custom_paths.push(impl);
      } else if (path.includes('@/clients/banban/')) {
        patterns.at_banban_paths.push(impl);
      } else if (path.includes('/core/')) {
        patterns.core_module_paths.push(impl);
      } else if (path.includes('/widgets/')) {
        patterns.widget_paths.push(impl);
      } else if (path.includes('/implementations/')) {
        patterns.implementation_paths.push(impl);
      } else {
        patterns.other_paths.push(impl);
      }
    });

    // Reportar cada padrão
    console.log('📋 PADRÕES DE COMPONENT_PATH ENCONTRADOS:\n');

    // 1. Paths vazios/nulos
    if (patterns.empty_paths.length > 0) {
      console.log(`🚫 PATHS VAZIOS (${patterns.empty_paths.length}):`);
      patterns.empty_paths.forEach(impl => {
        console.log(`   • ${impl.name} (${impl.implementation_key})`);
        console.log(`     Base: ${impl.base_modules?.name} | Audience: ${impl.audience} | Ativo: ${impl.is_active ? '✅' : '❌'}`);
      });
      console.log('');
    }

    // 2. Paths problemáticos - /clients/custom/
    if (patterns.custom_client_paths.length > 0) {
      console.log(`🚨 PATHS PROBLEMÁTICOS - /clients/custom/ (${patterns.custom_client_paths.length}):`);
      patterns.custom_client_paths.forEach(impl => {
        console.log(`   • Path: ${impl.component_path}`);
        console.log(`     Nome: ${impl.name} (${impl.implementation_key})`);
        console.log(`     Base: ${impl.base_modules?.name} | Audience: ${impl.audience} | Ativo: ${impl.is_active ? '✅' : '❌'}`);
        console.log('');
      });
    }

    // 3. Paths problemáticos - @/clients/custom/
    if (patterns.at_custom_paths.length > 0) {
      console.log(`🚨 PATHS PROBLEMÁTICOS - @/clients/custom/ (${patterns.at_custom_paths.length}):`);
      patterns.at_custom_paths.forEach(impl => {
        console.log(`   • Path: ${impl.component_path}`);
        console.log(`     Nome: ${impl.name} (${impl.implementation_key})`);
        console.log(`     Base: ${impl.base_modules?.name} | Audience: ${impl.audience} | Ativo: ${impl.is_active ? '✅' : '❌'}`);
        console.log('');
      });
    }

    // 4. Paths corretos para Banban
    if (patterns.banban_client_paths.length > 0 || patterns.at_banban_paths.length > 0) {
      const totalBanban = patterns.banban_client_paths.length + patterns.at_banban_paths.length;
      console.log(`✅ PATHS CORRETOS PARA BANBAN (${totalBanban}):`);
      
      [...patterns.banban_client_paths, ...patterns.at_banban_paths].forEach(impl => {
        console.log(`   • Path: ${impl.component_path}`);
        console.log(`     Nome: ${impl.name} (${impl.implementation_key})`);
        console.log(`     Base: ${impl.base_modules?.name} | Audience: ${impl.audience} | Ativo: ${impl.is_active ? '✅' : '❌'}`);
        console.log('');
      });
    }

    // 5. Paths de implementações padrão
    if (patterns.implementation_paths.length > 0) {
      console.log(`📁 PATHS DE IMPLEMENTAÇÕES PADRÃO (${patterns.implementation_paths.length}):`);
      patterns.implementation_paths.forEach(impl => {
        console.log(`   • Path: ${impl.component_path}`);
        console.log(`     Nome: ${impl.name} (${impl.implementation_key})`);
        console.log(`     Base: ${impl.base_modules?.name} | Audience: ${impl.audience} | Ativo: ${impl.is_active ? '✅' : '❌'}`);
      });
      console.log('');
    }

    // 6. Outros paths
    if (patterns.other_paths.length > 0) {
      console.log(`❓ OUTROS PATHS (${patterns.other_paths.length}):`);
      patterns.other_paths.forEach(impl => {
        console.log(`   • Path: ${impl.component_path}`);
        console.log(`     Nome: ${impl.name} (${impl.implementation_key})`);
        console.log(`     Base: ${impl.base_modules?.name} | Audience: ${impl.audience} | Ativo: ${impl.is_active ? '✅' : '❌'}`);
      });
      console.log('');
    }

    // Sumário da análise
    console.log('📊 RESUMO DA ANÁLISE:');
    console.log('─'.repeat(50));
    console.log(`Total de implementações: ${implementations.length}`);
    console.log(`Paths vazios: ${patterns.empty_paths.length}`);
    console.log(`Paths problemáticos (/clients/custom/): ${patterns.custom_client_paths.length}`);
    console.log(`Paths problemáticos (@/clients/custom/): ${patterns.at_custom_paths.length}`);
    console.log(`Paths corretos Banban: ${patterns.banban_client_paths.length + patterns.at_banban_paths.length}`);
    console.log(`Paths de implementações: ${patterns.implementation_paths.length}`);
    console.log(`Outros paths: ${patterns.other_paths.length}`);

    // Possível causa raiz
    console.log('\n🎯 ANÁLISE DA CAUSA RAIZ:');
    console.log('─'.repeat(50));
    
    const totalProblematicos = patterns.custom_client_paths.length + patterns.at_custom_paths.length;
    if (totalProblematicos > 0) {
      console.log(`❌ PROBLEMA IDENTIFICADO: ${totalProblematicos} implementações com paths "custom"`);
      console.log('   Quando o sistema tenta carregar um componente, pode estar tentando');
      console.log('   resolver paths que contêm "custom" em vez dos paths corretos do Banban.');
      console.log('');
      console.log('💡 POSSÍVEIS SOLUÇÕES:');
      console.log('   1. Corrigir os component_paths problemáticos no banco');
      console.log('   2. Verificar a lógica de resolução de paths no frontend');
      console.log('   3. Implementar fallback para paths inválidos');
    } else {
      console.log('✅ Não foram encontrados paths problemáticos com "custom"');
      console.log('   O problema pode estar na lógica de resolução de componentes');
      console.log('   ou na configuração do sistema de módulos.');
    }

  } catch (error) {
    console.error('❌ Erro durante análise:', error);
  }
}

// Executar análise
analyzeComponentPaths().then(() => {
  console.log('\n🏁 Análise de component_paths concluída');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});