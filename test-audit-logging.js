// Script de teste para verificar logs de auditoria
// Execute com: node test-audit-logging.js

const { createClient } = require('@supabase/supabase-js');
const { createAuditLog, AUDIT_ACTION_TYPES, AUDIT_RESOURCE_TYPES } = require('./src/lib/utils/audit-logger');

// Configure suas credenciais do Supabase
const supabaseUrl = 'https://bopytcghbmuywfltmwhk.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sua-anon-key-aqui';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuditLogging() {
  console.log('🔍 Testando sistema de logs de auditoria...\n');
  
  try {
    // 1. Verificar conexão
    console.log('1. Verificando conexão com Supabase...');
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (usersError) {
      console.error('❌ Erro na conexão:', usersError.message);
      return;
    }
    
    if (!users || users.length === 0) {
      console.log('⚠️ Nenhum usuário encontrado na tabela profiles');
      return;
    }
    
    console.log('✅ Conexão OK');
    
    // 2. Verificar estrutura da tabela audit_logs
    console.log('\n2. Verificando estrutura da tabela audit_logs...');
    const { data: logs, error: logsError } = await supabase
      .from('audit_logs')
      .select('*')
      .limit(1);
    
    if (logsError) {
      console.error('❌ Erro ao acessar audit_logs:', logsError.message);
      return;
    }
    
    console.log('✅ Tabela audit_logs acessível');
    
    // 3. Verificar políticas RLS (tentativa de inserção simples)
    console.log('\n3. Testando inserção de log de auditoria...');
    const testUserId = users[0].id;
    
    const { data: insertData, error: insertError } = await supabase
      .from('audit_logs')
      .insert({
        actor_user_id: testUserId,
        action_type: 'test_system_check',
        resource_type: 'system',
        details: {
          test: true,
          timestamp: new Date().toISOString(),
          message: 'Sistema de audit logging funcionando'
        },
        action_timestamp: new Date().toISOString()
      })
      .select();
    
    if (insertError) {
      console.error('❌ Erro ao inserir log:', insertError.message);
      
      if (insertError.code === '42501') {
        console.log('\n💡 Dica: Erro RLS detectado. Execute as migrações:');
        console.log(`
-- Criar políticas RLS necessárias
CREATE POLICY "Allow authenticated users to insert their own audit logs" 
ON audit_logs FOR INSERT 
TO authenticated 
WITH CHECK (actor_user_id = auth.uid());

CREATE POLICY "Allow service role to insert audit logs" 
ON audit_logs FOR INSERT 
TO service_role 
WITH CHECK (true);
        `);
      }
      return;
    }
    
    console.log('✅ Log inserido com sucesso:', insertData);
    
    // 4. Limpeza - remover log de teste
    const insertedId = insertData[0]?.id;
    if (insertedId) {
      await supabase
        .from('audit_logs')
        .delete()
        .eq('id', insertedId);
      console.log('✅ Log de teste removido');
    }
    
    console.log('\n🎉 Sistema de audit logging está funcionando corretamente!');
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
  }
}

async function testAuditLog() {
  console.log('Testando função createAuditLog...');
  
  try {
    const result = await createAuditLog({
      actor_user_id: 'd5edd63c-1497-4925-a649-d348440d142b', // ID do admin
      action_type: AUDIT_ACTION_TYPES.USER_DELETED,
      resource_type: AUDIT_RESOURCE_TYPES.USER,
      resource_id: '918cb137-c1b1-438f-9fe6-889c3185dc99',
      details: {
        action: "hard_delete_test",
        target_user_email: "test@example.com",
        target_user_name: "Test User",
      },
    });
    
    console.log('Resultado:', result);
  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

// Executar teste
testAuditLogging();
testAuditLog(); 