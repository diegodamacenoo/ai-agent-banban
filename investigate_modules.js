const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.bopytcghbmuywfltmwhk:oT8U10d9MBRqhgCj@aws-0-sa-east-1.pooler.supabase.com:5432/postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

async function investigateModules() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 INVESTIGAÇÃO DA TABELA module_implementations');
    console.log('=' .repeat(60));
    
    // Consulta 1: Estrutura geral das implementações
    console.log('\n📋 1. ESTRUTURA GERAL DAS IMPLEMENTAÇÕES ATIVAS');
    console.log('-'.repeat(40));
    const query1 = `
      SELECT 
          mi.id,
          mi.implementation_key,
          mi.name,
          mi.component_path,
          mi.audience,
          mi.is_active,
          mi.template_type,
          mi.component_type,
          bm.slug as base_module_slug,
          bm.name as base_module_name,
          bm.category
      FROM module_implementations mi
      JOIN base_modules bm ON mi.base_module_id = bm.id
      WHERE mi.is_active = true
      ORDER BY mi.audience, mi.component_path
      LIMIT 20;
    `;
    const result1 = await client.query(query1);
    console.table(result1.rows);

    // Consulta 2: Implementações específicas para tenant banban
    console.log('\n🏢 2. IMPLEMENTAÇÕES PARA TENANT BANBAN-FASHION');
    console.log('-'.repeat(40));
    const query2 = `
      SELECT DISTINCT
          mi.component_path,
          mi.implementation_key,
          mi.name,
          mi.audience,
          bm.slug as base_module_slug,
          tma.tenant_id,
          tma.is_active as assignment_active
      FROM module_implementations mi
      JOIN base_modules bm ON mi.base_module_id = bm.id
      LEFT JOIN tenant_module_assignments tma ON (tma.base_module_id = bm.id AND tma.implementation_id = mi.id)
      WHERE tma.tenant_id = '2da2a9a7-89ec-48bf-a3bc-c46e58d5a9b4'
         OR mi.audience = 'banban'
      ORDER BY mi.component_path;
    `;
    const result2 = await client.query(query2);
    console.table(result2.rows);

    // Consulta 3: Padrões de component_path
    console.log('\n📁 3. PADRÕES DE COMPONENT_PATH');
    console.log('-'.repeat(40));
    const query3 = `
      SELECT 
          CASE 
              WHEN component_path LIKE '/clients/custom/%' THEN 'CUSTOM_CLIENT'
              WHEN component_path LIKE '/clients/banban/%' THEN 'BANBAN_CLIENT'  
              WHEN component_path LIKE '/core/%' THEN 'CORE_MODULE'
              WHEN component_path LIKE '/widgets/%' THEN 'WIDGET'
              WHEN component_path LIKE '@/clients/custom/%' THEN 'AT_CUSTOM_CLIENT'
              WHEN component_path LIKE '@/clients/banban/%' THEN 'AT_BANBAN_CLIENT'
              ELSE 'OTHER'
          END as path_pattern,
          COUNT(*) as count
      FROM module_implementations 
      WHERE is_active = true
      GROUP BY 1
      ORDER BY count DESC;
    `;
    const result3 = await client.query(query3);
    console.table(result3.rows);

    // Consulta 4: Verificar se existem paths com @/clients/custom/
    console.log('\n🔍 4. PATHS COM "custom" ou "@/clients/custom"');
    console.log('-'.repeat(40));
    const query4 = `
      SELECT 
          mi.component_path,
          mi.implementation_key,
          mi.name,
          mi.audience,
          bm.slug,
          mi.is_active
      FROM module_implementations mi
      JOIN base_modules bm ON mi.base_module_id = bm.id
      WHERE mi.component_path LIKE '%custom%' 
         OR mi.component_path LIKE '%@/clients/custom%'
      ORDER BY mi.component_path;
    `;
    const result4 = await client.query(query4);
    console.table(result4.rows);

    // Consulta 5: Todos os component_paths únicos
    console.log('\n📝 5. TODOS OS COMPONENT_PATHS ÚNICOS');
    console.log('-'.repeat(40));
    const query5 = `
      SELECT DISTINCT 
          component_path,
          COUNT(*) as usage_count
      FROM module_implementations 
      WHERE is_active = true
      GROUP BY component_path
      ORDER BY component_path;
    `;
    const result5 = await client.query(query5);
    console.table(result5.rows);
    
  } catch (error) {
    console.error('❌ Erro na consulta:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

investigateModules();