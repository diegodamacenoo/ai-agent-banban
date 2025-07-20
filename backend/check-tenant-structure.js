const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkTenantStructure() {
  console.log('🔍 Verificando estrutura de tenants...\n');
  
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    console.log('1. Verificando tabela tenants...');
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('*')
      .limit(5);
    
    if (tenantsError) {
      console.log('❌ Erro ao acessar tabela tenants:', tenantsError.message);
    } else {
      console.log('✅ Tabela tenants encontrada:', tenants?.length || 0, 'registros');
      if (tenants && tenants.length > 0) {
        console.log('Exemplo:', JSON.stringify(tenants[0], null, 2));
      }
    }
    
    console.log('\n2. Verificando organizações...');
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('id, slug, company_trading_name')
      .eq('slug', 'banban-fashion');
    
    if (orgsError) {
      console.log('❌ Erro ao acessar organizations:', orgsError.message);
    } else {
      console.log('✅ BanBan Fashion encontrada:', JSON.stringify(orgs, null, 2));
    }
    
    // Se não há tabela tenants, talvez a organização seja o próprio tenant
    console.log('\n3. Verificando tenant_business_entities...');
    const { data: entities, error: entitiesError } = await supabase
      .from('tenant_business_entities')
      .select('*')
      .limit(3);
    
    if (entitiesError) {
      console.log('❌ Erro ao acessar tenant_business_entities:', entitiesError.message);
    } else {
      console.log('✅ Tabela tenant_business_entities encontrada:', entities?.length || 0, 'registros');
      if (entities && entities.length > 0) {
        console.log('Exemplo:', JSON.stringify(entities[0], null, 2));
      }
    }
    
  } catch (error) {
    console.error('❌ Erro durante verificação:', error.message);
  }
}

checkTenantStructure();