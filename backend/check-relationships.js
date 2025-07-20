const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkRelationships() {
  console.log('🔍 Verificando tabelas de relacionamentos...\n');
  
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Verificar tenant_business_relationships
    console.log('1. Verificando tenant_business_relationships:');
    const { data: rels, error: relsError } = await supabase
      .from('tenant_business_relationships')
      .select('*')
      .limit(1);
    
    if (relsError) {
      console.log('❌ Erro:', relsError.message);
    } else {
      console.log('✅ Tabela existe:', rels?.length || 0, 'registros');
      if (rels && rels.length > 0) {
        console.log('Estrutura:', Object.keys(rels[0]));
      }
    }
    
    // Verificar tenant_business_transactions
    console.log('\n2. Verificando tenant_business_transactions:');
    const { data: trans, error: transError } = await supabase
      .from('tenant_business_transactions')
      .select('*')
      .limit(1);
    
    if (transError) {
      console.log('❌ Erro:', transError.message);
    } else {
      console.log('✅ Tabela existe:', trans?.length || 0, 'registros');
      if (trans && trans.length > 0) {
        console.log('Estrutura:', Object.keys(trans[0]));
      }
    }
    
  } catch (error) {
    console.error('❌ Erro durante verificação:', error.message);
  }
}

checkRelationships();