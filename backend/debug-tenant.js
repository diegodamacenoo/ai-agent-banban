const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function debugTenant() {
  console.log('🔍 Debug de validação de tenant...\n');
  
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    const BANBAN_ORG_ID = '2da2a9a7-89ec-48bf-a3bc-c46e58d5a9b4';
    
    // Verificar se a organização BanBan existe
    console.log('1. Verificando organização BanBan...');
    const { data: banbanOrg, error: banbanError } = await supabase
      .from('organizations')
      .select('id, slug, company_trading_name')
      .eq('id', BANBAN_ORG_ID)
      .single();
    
    if (banbanError) {
      console.log('❌ Erro ao buscar organização BanBan:', banbanError.message);
    } else {
      console.log('✅ Organização BanBan encontrada:', banbanOrg);
    }
    
    // Verificar todas as organizações disponíveis
    console.log('\n2. Listando todas as organizações:');
    const { data: allOrgs, error: listError } = await supabase
      .from('organizations')
      .select('id, slug, company_trading_name')
      .limit(10);
    
    if (listError) {
      console.log('❌ Erro ao listar organizações:', listError.message);
    } else {
      console.log('✅ Organizações encontradas:');
      allOrgs.forEach(org => {
        console.log(`  - ${org.id} | ${org.slug} | ${org.company_trading_name}`);
      });
    }
    
    // Verificar se existe uma transação de teste
    console.log('\n3. Verificando transações existentes...');
    const { data: transactions, error: txError } = await supabase
      .from('tenant_business_transactions')
      .select('id, external_id, transaction_type, status')
      .eq('organization_id', BANBAN_ORG_ID)
      .limit(5);
    
    if (txError) {
      console.log('❌ Erro ao buscar transações:', txError.message);
    } else {
      console.log('✅ Transações encontradas:', transactions.length);
      transactions.forEach(tx => {
        console.log(`  - ${tx.external_id} | ${tx.transaction_type} | ${tx.status}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro durante debug:', error.message);
  }
}

debugTenant();