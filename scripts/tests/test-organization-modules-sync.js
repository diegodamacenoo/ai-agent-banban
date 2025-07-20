
import { createClient } from '@supabase/supabase-js';

// Configuracoes do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variaveis de ambiente do Supabase nao configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testOrganizationModulesSync() {
  console.log('🔍 Testando sincronizacao organization_modules...\n');

  try {
    // 1. Buscar organizacao BanBan
    console.log('1️⃣ Buscando organizacao BanBan...');
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, company_trading_name, implementation_config')
      .ilike('company_trading_name', '%banban%')
      .single();

    if (orgError || !organization) {
      console.error('❌ Organizacao BanBan nao encontrada:', orgError?.message);
      return;
    }

    console.log('✅ Organizacao encontrada:', organization.company_trading_name);
    console.log('📋 Modulos subscritos:', organization.implementation_config?.subscribed_modules);

    // 2. Verificar se ha registros na tabela organization_modules
    console.log('\n2️⃣ Verificando tabela organization_modules...');
    const { data: orgModules, error: modulesError } = await supabase
      .from('tenant_module_assignments')
      .select('*')
      .eq('organization_id', organization.id);

    if (modulesError) {
      console.error('❌ Erro ao buscar organization_modules:', modulesError.message);
      return;
    }

    console.log(`📊 Registros encontrados na organization_modules: ${orgModules?.length || 0}`);

    if (orgModules && orgModules.length > 0) {
      console.log('\n📋 Modulos encontrados na tabela organization_modules:');
      orgModules.forEach((module, index) => {
        console.log(`   ${index + 1}. ${module.module_name} (${module.module_id})`);
        console.log(`      - Tipo: ${module.module_type}`);
        console.log(`      - Status: ${module.status}`);
        console.log(`      - Prioridade: ${module.priority}`);
        console.log(`      - Criado em: ${new Date(module.created_at).toLocaleString('pt-BR')}`);
        console.log('');
      });
    } else {
      console.log('⚠️  Nenhum modulo encontrado na tabela organization_modules');
    }

    // 3. Comparar com implementation_config
    console.log('3️⃣ Comparando dados...');
    const subscribedModules = organization.implementation_config?.subscribed_modules || [];
    const moduleIds = orgModules?.map(m => m.module_id) || [];

    console.log('\n📊 Comparacao:');
    console.log(`   - Modulos em implementation_config: ${subscribedModules.length}`);
    console.log(`   - Modulos em organization_modules: ${moduleIds.length}`);

    // Verificar consistencia
    const missing = subscribedModules.filter(id => !moduleIds.includes(id));
    const extra = moduleIds.filter(id => !subscribedModules.includes(id));

    if (missing.length > 0) {
      console.log(`❌ Modulos faltando na organization_modules: ${missing.join(', ')}`);
    }

    if (extra.length > 0) {
      console.log(`⚠️  Modulos extras na organization_modules: ${extra.join(', ')}`);
    }

    if (missing.length === 0 && extra.length === 0 && subscribedModules.length > 0) {
      console.log('✅ Sincronizacao perfeita! Todos os modulos estao consistentes.');
    } else if (subscribedModules.length === 0 && moduleIds.length === 0) {
      console.log('ℹ️  Nenhum modulo configurado em ambas as tabelas (consistente).');
    } else {
      console.log('❌ Inconsistencia detectada entre as tabelas.');
    }

    // 4. Teste de uma atualizacao simulada
    console.log('\n4️⃣ Simulando atualizacao de modulos...');
    
    // Simular dados que seriam enviados pela interface admin
    const testModules = ['banban-insights', 'banban-performance', 'banban-alerts'];
    
    console.log('📝 Modulos de teste:', testModules);
    console.log('💡 Para testar a sincronizacao, use a interface admin para atribuir/remover modulos');
    console.log('💡 Ou execute a funcao updateOrganizationModules programaticamente');

    // 5. Verificar estrutura da tabela
    console.log('\n5️⃣ Verificando estrutura da tabela organization_modules...');
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'organization_modules' });

    if (!columnsError && columns) {
      console.log('✅ Colunas da tabela organization_modules:');
      columns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type}`);
      });
    } else {
      console.log('⚠️  Nao foi possivel verificar estrutura da tabela');
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Funcao auxiliar para obter colunas da tabela (caso nao exista a RPC)
async function getTableInfo() {
  const { data, error } = await supabase
    .from('tenant_module_assignments')
    .select('*')
    .limit(1);

  if (error) {
    console.log('⚠️  Tabela organization_modules pode nao existir ou ter problemas de acesso');
    return;
  }

  if (data && data.length > 0) {
    console.log('✅ Tabela organization_modules acessivel');
    console.log('📋 Exemplo de estrutura:', Object.keys(data[0]));
  } else {
    console.log('ℹ️  Tabela organization_modules existe mas esta vazia');
  }
}

// Executar teste
console.log('🚀 Iniciando teste de sincronizacao...\n');
testOrganizationModulesSync()
  .then(() => {
    console.log('\n✅ Teste concluido!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro no teste:', error);
    process.exit(1);
  }); 