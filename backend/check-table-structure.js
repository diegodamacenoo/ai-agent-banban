const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkTableStructure() {
  console.log('🔍 Verificando estrutura das tabelas...\n');
  
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Verificar uma entidade existente para ver a estrutura
    console.log('1. Estrutura de tenant_business_entities:');
    const { data: entity, error } = await supabase
      .from('tenant_business_entities')
      .select('*')
      .limit(1)
      .single();
    
    if (error) {
      console.log('❌ Erro:', error.message);
    } else {
      console.log('✅ Colunas encontradas:');
      Object.keys(entity).forEach(key => {
        console.log(`- ${key}: ${typeof entity[key]}`);
      });
      console.log('\nExemplo de registro:');
      console.log(JSON.stringify(entity, null, 2));
    }
    
    // Verificar se existe webhook_logs
    console.log('\n2. Verificando webhook_logs:');
    const { data: logs, error: logsError } = await supabase
      .from('webhook_logs')
      .select('*')
      .limit(1);
    
    if (logsError) {
      console.log('❌ Tabela webhook_logs não existe:', logsError.message);
    } else {
      console.log('✅ Tabela webhook_logs existe:', logs?.length || 0, 'registros');
    }
    
  } catch (error) {
    console.error('❌ Erro durante verificação:', error.message);
  }
}

checkTableStructure();