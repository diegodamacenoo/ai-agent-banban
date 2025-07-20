/**
 * Script para corrigir a tabela module_implementations
 * Este script popula os dados necessários para que o ModuleConfigurationService funcione corretamente
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configurações do Supabase (usar as mesmas do projeto)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bopytcghbmuywfltmwhk.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não está definida');
  console.log('💡 Use: export SUPABASE_SERVICE_ROLE_KEY=sua_chave_aqui');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function populateModuleImplementations() {
  try {
    console.log('🚀 Iniciando população da tabela module_implementations...');

    // 1. Verificar se as tabelas necessárias existem
    console.log('📋 Verificando tabelas...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['core_modules', 'module_implementations', 'module_navigation', 'tenant_modules']);

    if (tablesError) {
      throw new Error(`Erro ao verificar tabelas: ${tablesError.message}`);
    }

    const tableNames = tables.map(t => t.table_name);
    const requiredTables = ['core_modules', 'module_implementations', 'module_navigation', 'tenant_modules'];
    const missingTables = requiredTables.filter(table => !tableNames.includes(table));

    if (missingTables.length > 0) {
      throw new Error(`Tabelas não encontradas: ${missingTables.join(', ')}`);
    }

    console.log('✅ Todas as tabelas necessárias estão disponíveis');

    // 2. Verificar quantos módulos existem em core_modules
    const { data: coreModules, error: coreModulesError } = await supabase
      .from('core_modules')
      .select('module_id, name, slug');

    if (coreModulesError) {
      throw new Error(`Erro ao buscar core_modules: ${coreModulesError.message}`);
    }

    console.log(`📦 Encontrados ${coreModules.length} módulos em core_modules:`, coreModules.map(m => m.slug));

    // 3. Verificar implementações existentes
    const { data: existingImpls, error: existingImplsError } = await supabase
      .from('module_implementations')
      .select('module_id, client_type');

    if (existingImplsError) {
      console.warn(`⚠️ Erro ao verificar implementações existentes: ${existingImplsError.message}`);
    } else {
      console.log(`🔍 Implementações existentes: ${existingImpls.length}`);
    }

    // 4. Limpar implementações do cliente 'banban' para evitar duplicatas
    console.log('🧹 Limpando implementações existentes do cliente banban...');
    const { error: deleteError } = await supabase
      .from('module_implementations')
      .delete()
      .eq('client_type', 'banban');

    if (deleteError) {
      console.warn(`⚠️ Aviso ao limpar implementações: ${deleteError.message}`);
    }

    // 5. Criar implementações para os módulos BanBan
    const banbanModules = [
      {
        module_id: 'banban-insights',
        nav_title: 'Insights',
        route_path: '/insights',
        nav_order: 10
      },
      {
        module_id: 'banban-performance',
        nav_title: 'Performance',
        route_path: '/performance',
        nav_order: 20
      },
      {
        module_id: 'banban-alerts',
        nav_title: 'Alertas',
        route_path: '/alerts',
        nav_order: 30
      },
      {
        module_id: 'banban-inventory',
        nav_title: 'Estoque',
        route_path: '/inventory',
        nav_order: 40
      },
      {
        module_id: 'banban-data-processing',
        nav_title: 'Processamento',
        route_path: '/data-processing',
        nav_order: 50
      }
    ];

    console.log('➕ Criando implementações...');
    
    for (const module of banbanModules) {
      console.log(`  📝 Criando implementação para ${module.module_id}...`);
      
      // Verificar se o módulo existe em core_modules
      const coreModule = coreModules.find(cm => cm.module_id === module.module_id);
      if (!coreModule) {
        console.warn(`  ⚠️ Módulo ${module.module_id} não encontrado em core_modules, pulando...`);
        continue;
      }

      // Inserir implementação
      const { data: implementation, error: implError } = await supabase
        .from('module_implementations')
        .insert({
          module_id: module.module_id,
          client_type: 'banban',
          component_path: `/modules/banban/${module.module_id.replace('banban-', '')}`,
          is_available: true,
          configuration_schema: {
            type: 'object',
            properties: {
              refresh_interval: { type: 'number', default: 300 }
            }
          }
        })
        .select('id')
        .single();

      if (implError) {
        console.error(`  ❌ Erro ao criar implementação para ${module.module_id}: ${implError.message}`);
        continue;
      }

      // Inserir navegação
      const { error: navError } = await supabase
        .from('module_navigation')
        .insert({
          implementation_id: implementation.id,
          nav_type: 'primary',
          nav_title: module.nav_title,
          nav_order: module.nav_order,
          route_path: module.route_path,
          is_external: false
        });

      if (navError) {
        console.error(`  ❌ Erro ao criar navegação para ${module.module_id}: ${navError.message}`);
      } else {
        console.log(`  ✅ Implementação e navegação criadas para ${module.module_id}`);
      }
    }

    // 6. Verificar resultados
    console.log('🔍 Verificando resultados...');
    const { data: finalImpls, error: finalError } = await supabase
      .from('module_implementations')
      .select(`
        module_id,
        client_type,
        component_path,
        module_navigation (
          nav_title,
          route_path,
          nav_order
        )
      `)
      .eq('client_type', 'banban');

    if (finalError) {
      throw new Error(`Erro ao verificar resultados: ${finalError.message}`);
    }

    console.log('✅ Implementações criadas:');
    finalImpls.forEach(impl => {
      const nav = impl.module_navigation[0] || {};
      console.log(`  - ${impl.module_id}: ${nav.nav_title} -> ${nav.route_path}`);
    });

    console.log('🎉 População da tabela module_implementations concluída com sucesso!');
    console.log('💡 Agora o ModuleConfigurationService deve funcionar corretamente.');

  } catch (error) {
    console.error('❌ Erro durante a população:', error.message);
    process.exit(1);
  }
}

// Executar se for chamado diretamente
if (require.main === module) {
  populateModuleImplementations()
    .then(() => {
      console.log('✨ Script concluído');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script falhou:', error);
      process.exit(1);
    });
}

module.exports = { populateModuleImplementations };