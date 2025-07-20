const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function debugEntityCreation() {
  console.log('🔍 Debug de criação de entidade...\n');
  
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Verificar tipos de entidade existentes
    console.log('1. Tipos de entidade existentes:');
    const { data: entities, error } = await supabase
      .from('tenant_business_entities')
      .select('entity_type')
      .limit(20);
    
    if (error) {
      console.log('❌ Erro:', error.message);
    } else {
      const uniqueTypes = [...new Set(entities.map(e => e.entity_type))];
      console.log('✅ Tipos únicos encontrados:', uniqueTypes);
    }
    
    // Testar criação de supplier primeiro
    console.log('\n2. Testando criação de supplier:');
    try {
      const supplierEntity = {
        id: crypto.randomUUID(),
        organization_id: '2da2a9a7-89ec-48bf-a3bc-c46e58d5a9b4',
        entity_type: 'supplier',
        external_id: 'SUPPLIER-TEST-001',
        name: 'Fornecedor Teste',
        business_data: {
          trade_name: 'Fornecedor Teste',
          legal_name: 'Fornecedor Teste Ltda'
        },
        configuration: {},
        metadata: {},
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data: supplierResult, error: supplierError } = await supabase
        .from('tenant_business_entities')
        .insert(supplierEntity)
        .select()
        .single();
      
      if (supplierError) {
        console.log('❌ Erro ao criar supplier:', supplierError.message);
        console.log('❌ Detalhes:', JSON.stringify(supplierError, null, 2));
      } else {
        console.log('✅ Supplier criado:', supplierResult.id);
        
        // Deletar o registro de teste
        await supabase
          .from('tenant_business_entities')
          .delete()
          .eq('id', supplierResult.id);
        console.log('🗑️ Supplier de teste removido');
      }
    } catch (testError) {
      console.log('❌ Erro durante teste supplier:', testError.message);
    }
    
  } catch (error) {
    console.error('❌ Erro durante debug:', error.message);
  }
}

debugEntityCreation();