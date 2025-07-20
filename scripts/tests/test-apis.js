#!/usr/bin/env node

/**
 * Script para testar as APIs corrigidas
 * 
 * Este script verifica se as APIs de gerenciamento de usuarios
 * estao funcionando apos as correcoes de permissao.
 */

import fs from 'fs';
import path from 'path';

console.log('🧪 Testando APIs Corrigidas\n');

// Funcao para verificar se um arquivo existe e contem o padrao esperado
function checkAPIFile(filePath, expectedPatterns) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ ${filePath} - Arquivo nao encontrado`);
    return false;
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  let allPatternsFound = true;
  
  expectedPatterns.forEach(pattern => {
    if (!content.includes(pattern)) {
      console.log(`❌ ${filePath} - Padrao nao encontrado: ${pattern}`);
      allPatternsFound = false;
    }
  });
  
  if (allPatternsFound) {
    console.log(`✅ ${filePath} - Todas as correcoes aplicadas`);
  }
  
  return allPatternsFound;
}

// Lista de APIs para verificar
const apisToCheck = [
  {
    file: 'src/app/api/user-management/users/route.ts',
    patterns: [
      'createSupabaseAdminClient',
      'const supabaseAdmin = createSupabaseAdminClient(cookieStore)',
      'await supabaseAdmin.auth.admin.listUsers()'
    ]
  },
  {
    file: 'src/app/api/user-management/users/deleted/route.ts',
    patterns: [
      'createSupabaseAdminClient',
      'const supabaseAdmin = createSupabaseAdminClient(cookieStore)',
      'await supabaseAdmin.auth.admin.listUsers()'
    ]
  },
  {
    file: 'src/app/api/user-management/users/soft-delete/route.ts',
    patterns: [
      'createSupabaseAdminClient',
      'const supabaseAdmin = createSupabaseAdminClient(cookieStore)',
      'await supabaseAdmin.auth.admin.getUserById'
    ]
  },
  {
    file: 'src/app/api/user-management/users/restore/route.ts',
    patterns: [
      'createSupabaseAdminClient',
      'const supabaseAdmin = createSupabaseAdminClient(cookieStore)',
      'await supabaseAdmin.auth.admin.getUserById'
    ]
  },
  {
    file: 'src/app/api/user-management/users/deactivate/route.ts',
    patterns: [
      'createSupabaseAdminClient',
      'const supabaseAdmin = createSupabaseAdminClient(cookieStore)',
      'await supabaseAdmin.auth.admin.getUserById'
    ]
  }
];

console.log('📋 Verificando correcoes nas APIs:\n');

let allAPIsFixed = true;

apisToCheck.forEach(api => {
  const isFixed = checkAPIFile(api.file, api.patterns);
  if (!isFixed) {
    allAPIsFixed = false;
  }
});

console.log('\n' + '='.repeat(60));

if (allAPIsFixed) {
  console.log('🎉 SUCESSO: Todas as APIs foram corrigidas!');
  console.log('\n📋 Proximos passos:');
  console.log('1. Configure a variavel SUPABASE_SERVICE_ROLE_KEY no .env.local');
  console.log('2. Reinicie o servidor de desenvolvimento');
  console.log('3. Teste as APIs no frontend');
} else {
  console.log('⚠️  ATENCAO: Algumas APIs ainda precisam de correcao');
  console.log('\n📋 Verifique os arquivos marcados com ❌ acima');
}

console.log('\n🔧 Configuracao necessaria:');
console.log('Adicione no arquivo .env.local:');
console.log('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here');

console.log('\n📖 Para mais detalhes, consulte:');
console.log('- docs/API_FIX_REPORT.md');
console.log('- docs/API_ANALYSIS_AND_REORGANIZATION.md');

// Verificar se a variavel de ambiente esta configurada
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  if (envContent.includes('SUPABASE_SERVICE_ROLE_KEY')) {
    console.log('\n✅ Variavel SUPABASE_SERVICE_ROLE_KEY encontrada no .env.local');
  } else {
    console.log('\n⚠️  Variavel SUPABASE_SERVICE_ROLE_KEY nao encontrada no .env.local');
  }
} else {
  console.log('\n⚠️  Arquivo .env.local nao encontrado');
}

console.log('\n' + '='.repeat(60)); 