/**
 * Script de teste para verificar a propagação de estado dos base_modules
 * para tenant_module_assignments
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessários');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPropagation() {
  console.log('🔍 Iniciando teste de propagação...\n');

  try {
    // 1. Verificar estrutura da tabela tenant_module_assignments
    console.log('1. Verificando estrutura da tabela tenant_module_assignments...');
    
    const { data: assignments, error: assignError } = await supabase
      .from('tenant_module_assignments')
      .select('*')
      .limit(1);

    if (assignError) {
      console.error('❌ Erro ao acessar tenant_module_assignments:', assignError);
      return;
    }

    if (assignments && assignments.length > 0) {
      console.log('✅ Estrutura da tabela:');
      console.log('   Colunas:', Object.keys(assignments[0]));
      console.log('   Tem assigned_by?', 'assigned_by' in assignments[0]);
    }

    // 2. Buscar um módulo base para teste
    console.log('\n2. Buscando módulo base para teste...');
    
    const { data: baseModules, error: moduleError } = await supabase
      .from('base_modules')
      .select('id, name, is_active')
      .is('deleted_at', null)
      .limit(1);

    if (moduleError || !baseModules || baseModules.length === 0) {
      console.error('❌ Nenhum módulo base encontrado:', moduleError);
      return;
    }

    const testModule = baseModules[0];
    console.log('✅ Módulo encontrado:', testModule.name, `(${testModule.id})`);

    // 3. Verificar assignments existentes
    console.log('\n3. Verificando assignments existentes...');
    
    const { data: existingAssignments, error: existingError } = await supabase
      .from('tenant_module_assignments')
      .select('tenant_id, is_active, assigned_by, updated_at')
      .eq('base_module_id', testModule.id);

    if (existingError) {
      console.error('❌ Erro ao buscar assignments:', existingError);
      return;
    }

    console.log(`✅ Encontrados ${existingAssignments?.length || 0} assignments para este módulo`);
    if (existingAssignments && existingAssignments.length > 0) {
      existingAssignments.forEach((assignment, index) => {
        console.log(`   Assignment ${index + 1}:`, {
          tenant_id: assignment.tenant_id,
          is_active: assignment.is_active,
          assigned_by: assignment.assigned_by,
          updated_at: assignment.updated_at
        });
      });
    }

    // 4. Testar UPDATE direto (sem assigned_by)
    console.log('\n4. Testando UPDATE direto (sem assigned_by)...');
    
    const { error: directUpdateError, count: directCount } = await supabase
      .from('tenant_module_assignments')
      .update({ 
        is_active: !testModule.is_active,  // Alternar estado
        updated_at: new Date().toISOString(),
      })
      .eq('base_module_id', testModule.id);

    if (directUpdateError) {
      console.log('❌ UPDATE direto falhou:', directUpdateError.message);
      console.log('   Código:', directUpdateError.code);
      
      // 5. Testar UPDATE com assigned_by
      console.log('\n5. Testando UPDATE com assigned_by...');
      
      const { error: withAssignedByError, count: withAssignedByCount } = await supabase
        .from('tenant_module_assignments')
        .update({ 
          is_active: !testModule.is_active,
          updated_at: new Date().toISOString(),
          assigned_by: 'system-test'  // Valor fictício para teste
        })
        .eq('base_module_id', testModule.id);

      if (withAssignedByError) {
        console.log('❌ UPDATE com assigned_by também falhou:', withAssignedByError.message);
      } else {
        console.log('✅ UPDATE com assigned_by teve sucesso!');
        console.log(`   Registros atualizados: ${withAssignedByCount}`);
      }
    } else {
      console.log('✅ UPDATE direto teve sucesso!');
      console.log(`   Registros atualizados: ${directCount}`);
    }

    // 6. Verificar estado final
    console.log('\n6. Verificando estado final...');
    
    const { data: finalAssignments } = await supabase
      .from('tenant_module_assignments')
      .select('tenant_id, is_active, assigned_by, updated_at')
      .eq('base_module_id', testModule.id);

    if (finalAssignments && finalAssignments.length > 0) {
      finalAssignments.forEach((assignment, index) => {
        console.log(`   Assignment ${index + 1} (final):`, {
          tenant_id: assignment.tenant_id,
          is_active: assignment.is_active,
          assigned_by: assignment.assigned_by,
          updated_at: assignment.updated_at
        });
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testPropagation();