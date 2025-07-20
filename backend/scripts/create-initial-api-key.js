#!/usr/bin/env node

/**
 * Script para criar API Key inicial para migração dos webhooks ECA
 * 
 * Este script deve ser executado após a migração do banco de dados
 * para criar uma API Key que substitua o token fixo dos webhooks.
 */

const { createClient } = require('@supabase/supabase-js');
const { randomBytes, createHash } = require('crypto');

// Configuração
const SUPABASE_URL = "https://bopytcghbmuywfltmwhk.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvcHl0Y2doYm11eXdmbHRtd2hrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjMxMDg3NSwiZXhwIjoyMDYxODg2ODc1fQ.M0DtA5nTtsEDAg8FPowvKhWuF09lhh0gEcdCWW5Pb4U";
const BANBAN_ORG_ID = process.env.BANBAN_ORG_ID || '2da2a9a7-89ec-48bf-a3bc-c46e58d5a9b4';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Erro: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios');
  console.error('Configure as variáveis de ambiente e tente novamente.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Gera uma nova API Key segura
 */
function generateApiKey() {
  const keyBytes = randomBytes(32);
  const key = `ak_${keyBytes.toString('hex')}`;
  const hash = createHash('sha256').update(key).digest('hex');
  const prefix = key.substring(0, 12) + '...';
  
  return { key, hash, prefix };
}

/**
 * Criar API Key inicial para webhooks
 */
async function createInitialApiKey() {
  try {
    console.log('🔑 Criando API Key inicial para webhooks BanBan...');
    
    const { key, hash, prefix } = generateApiKey();
    
    // Data de expiração: 1 ano a partir de agora
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    
    const apiKeyData = {
      id: crypto.randomUUID(),
      name: 'BanBan Webhooks - Sistema ECA',
      description: 'API Key para todos os webhooks do sistema ECA BanBan (purchase, inventory, sales, transfer, returns, etl)',
      key_hash: hash,
      prefix,
      permissions: [
        'webhook:purchase',
        'webhook:inventory', 
        'webhook:sales',
        'webhook:transfer',
        'webhook:returns',
        'webhook:etl'
      ],
      expires_at: expiresAt.toISOString(),
      rate_limit: 10000, // 10k requests/hour para sistema automatizado
      organization_id: BANBAN_ORG_ID,
      is_active: true,
      usage_count: 0,
      created_at: new Date().toISOString(),
      last_used_at: null,
    };

    console.log('📝 Inserindo API Key no banco de dados...');
    
    const { data, error } = await supabase
      .from('api_keys')
      .insert(apiKeyData)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao inserir API Key:', error);
      throw error;
    }

    console.log('✅ API Key criada com sucesso!');
    console.log('');
    console.log('='.repeat(80));
    console.log('📋 INFORMAÇÕES DA API KEY CRIADA');
    console.log('='.repeat(80));
    console.log(`ID: ${data.id}`);
    console.log(`Nome: ${data.name}`);
    console.log(`Prefixo: ${data.prefix}`);
    console.log(`Permissões: ${data.permissions.join(', ')}`);
    console.log(`Expira em: ${data.expires_at}`);
    console.log(`Rate Limit: ${data.rate_limit} requests/hora`);
    console.log(`Organização: ${data.organization_id}`);
    console.log('');
    console.log('🔐 API KEY (GUARDE COM SEGURANÇA):');
    console.log(key);
    console.log('');
    console.log('⚠️  IMPORTANTE:');
    console.log('   1. Esta é a ÚNICA vez que a chave completa será exibida');
    console.log('   2. Guarde-a em local seguro (gerenciador de senhas)');
    console.log('   3. Configure nos sistemas que fazem chamadas de webhook');
    console.log('   4. Use no header: Authorization: Bearer ' + key);
    console.log('='.repeat(80));
    
    return { apiKey: key, data };
    
  } catch (error) {
    console.error('❌ Erro ao criar API Key inicial:', error);
    throw error;
  }
}

/**
 * Verificar se a migração foi aplicada
 */
async function checkMigration() {
  try {
    console.log('🔍 Verificando se as tabelas de API Keys existem...');
    
    const { data, error } = await supabase
      .from('api_keys')
      .select('id')
      .limit(1);
    
    if (error && error.message.includes('relation "api_keys" does not exist')) {
      console.error('❌ Tabela api_keys não encontrada!');
      console.error('Execute primeiro a migração: create_api_keys_tables.sql');
      return false;
    }
    
    if (error) {
      console.error('❌ Erro ao verificar tabelas:', error);
      return false;
    }
    
    console.log('✅ Tabelas de API Keys encontradas');
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao verificar migração:', error);
    return false;
  }
}

/**
 * Script principal
 */
async function main() {
  try {
    console.log('🚀 Script de criação de API Key inicial - Sistema Híbrido BanBan');
    console.log('');
    
    // Verificar migração
    const migrationOk = await checkMigration();
    if (!migrationOk) {
      process.exit(1);
    }
    
    // Verificar se já existe API Key
    console.log('🔍 Verificando se já existe API Key para webhooks...');
    const { data: existingKeys, error: checkError } = await supabase
      .from('api_keys')
      .select('name, prefix, created_at')
      .eq('organization_id', BANBAN_ORG_ID)
      .ilike('name', '%webhook%');
    
    if (checkError) {
      console.error('❌ Erro ao verificar API Keys existentes:', checkError);
      process.exit(1);
    }
    
    if (existingKeys && existingKeys.length > 0) {
      console.log('⚠️  API Keys para webhooks já existem:');
      existingKeys.forEach((key, index) => {
        console.log(`   ${index + 1}. ${key.name} (${key.prefix}) - ${key.created_at}`);
      });
      console.log('');
      console.log('Se você realmente deseja criar uma nova, delete as existentes primeiro.');
      console.log('Ou use as existentes para configurar os webhooks.');
      return;
    }
    
    // Criar API Key
    await createInitialApiKey();
    
    console.log('');
    console.log('🎉 API Key inicial criada com sucesso!');
    console.log('');
    console.log('📝 PRÓXIMOS PASSOS:');
    console.log('   1. Configure a API Key nos sistemas que fazem chamadas de webhook');
    console.log('   2. Teste os endpoints de webhook com a nova autenticação');
    console.log('   3. Remove as variáveis de WEBHOOK_SECRET_TOKEN antigas');
    console.log('   4. Monitore o uso através de /api/admin/api-keys');
    
  } catch (error) {
    console.error('❌ Erro no script:', error);
    process.exit(1);
  }
}

// Executar script se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { createInitialApiKey, checkMigration };