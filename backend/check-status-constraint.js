const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkStatusConstraint() {
  console.log('🔍 Verificando constraint de status...\n');
  
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Verificar valores de status existentes
    console.log('1. Valores de status existentes:');
    const { data: entities, error } = await supabase
      .from('tenant_business_entities')
      .select('status, entity_type')
      .limit(10);
    
    if (error) {
      console.log('❌ Erro:', error.message);
    } else {
      const uniqueStatuses = [...new Set(entities.map(e => e.status))];
      console.log('✅ Status únicos encontrados:', uniqueStatuses);
      
      // Verificar alguns exemplos
      entities.forEach(entity => {
        console.log(`- ${entity.entity_type}: ${entity.status}`);
      });
    }
    
    // Tentar inserir com status 'active' para ver se funciona
    console.log('\n2. Testando inserção com status "active":');
    try {
      const testEntity = {
        id: crypto.randomUUID(),
        organization_id: '2da2a9a7-89ec-48bf-a3bc-c46e58d5a9b4',
        entity_type: 'test_webhook',
        external_id: 'test_' + Date.now(),
        name: 'Teste de Status',
        business_data: { test: true },
        configuration: {},
        metadata: {},
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data: insertResult, error: insertError } = await supabase
        .from('tenant_business_entities')
        .insert(testEntity)
        .select()
        .single();
      
      if (insertError) {
        console.log('❌ Erro ao inserir:', insertError.message);
      } else {
        console.log('✅ Inserção bem-sucedida:', insertResult.id);
        
        // Deletar o registro de teste
        await supabase
          .from('tenant_business_entities')
          .delete()
          .eq('id', insertResult.id);
        console.log('🗑️ Registro de teste removido');
      }
    } catch (testError) {
      console.log('❌ Erro durante teste:', testError.message);
    }
    
  } catch (error) {
    console.error('❌ Erro durante verificação:', error.message);
  }
}

checkStatusConstraint();