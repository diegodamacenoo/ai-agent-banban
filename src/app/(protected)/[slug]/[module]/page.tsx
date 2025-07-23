import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ModuleConfigurationService } from '@/core/modules/services/ModuleConfigurationService';
import DynamicModulePage from './DynamicModulePage';

interface Organization {
  id: string;
  slug: string;
  client_type: string;
  company_trading_name: string;
  company_legal_name: string;
  is_implementation_complete: boolean;
}

interface ModulePageProps {
  params: Promise<{
    slug: string;
    module: string;
  }>;
}

export default async function ModulePage({ params }: ModulePageProps) {
  const { slug, module } = await params;

  // Filtrar rotas API que não são organizações
  if (slug === 'api' || slug.startsWith('_')) {
    console.debug(`🚫 ModulePage: Ignorando rota sistema: ${slug}/${module}`);
    notFound();
  }

  console.debug(`🎯 ModulePage: Acessando módulo "${module}" para organização "${slug}"`);

  // Buscar organização no servidor (usar cliente autenticado)
  const supabase = await createSupabaseServerClient();
  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .select('id, slug, client_type, company_trading_name, company_legal_name, is_implementation_complete')
    .eq('slug', slug)
    .single();

  if (orgError || !organization) {
    console.error(`❌ Organização não encontrada para slug: ${slug}`, orgError);
    notFound();
  }

  console.debug(`🏢 Organização encontrada:`, {
    id: organization.id,
    slug: organization.slug,
    client_type: organization.client_type
  });

  // Verificar se o módulo existe para este cliente usando o ModuleConfigurationService
  try {
    // Tentar carregar as configurações do módulo
    const moduleConfigs = await ModuleConfigurationService.loadModuleConfigurations(supabase, organization.id);
    const moduleConfig = moduleConfigs.find(m => m.slug === module);
    
    if (!moduleConfig) {
      console.error(`❌ Módulo "${module}" não encontrado para cliente "${organization.client_type}"`);
      console.debug(`🔍 Debug - Módulos disponíveis:`, moduleConfigs.map(m => m.slug));
      notFound();
    }

    console.debug(`✅ Módulo "${module}" encontrado para cliente "${organization.client_type}"`);
  } catch (error) {
    console.error(`❌ Erro ao verificar módulo "${module}":`, error);
    notFound();
  }

  // TESTE DIRETO: Verificar se existe a atribuição sem JOIN primeiro
  const { data: directCheck, error: directError } = await supabase
    .from('tenant_module_assignments')
    .select('*')
    .eq('tenant_id', organization.id);
  
  console.debug(`🧪 TESTE DIRETO - Todas as atribuições:`, {
    count: directCheck?.length || 0,
    assignments: directCheck?.map(a => ({ 
      base_module_id: a.base_module_id, 
      is_active: a.is_active 
    })),
    error: directError?.message
  });

  // TESTE ESPECÍFICO: Buscar módulo diego-henrique por ID
  if (module === 'diego-henrique') {
    const { data: specificCheck, error: specificError } = await supabase
      .from('tenant_module_assignments')
      .select('*')
      .eq('tenant_id', organization.id)
      .eq('base_module_id', '49d247a4-8478-4641-9514-f52c468c1e00');
    
    console.debug(`🎯 TESTE ESPECÍFICO - diego-henrique por ID:`, {
      found: !!specificCheck?.length,
      data: specificCheck,
      error: specificError?.message
    });
  }

  // Verificar se a organização tem acesso ao módulo
  // Usar JOIN com base_modules para buscar por slug em vez de UUID
  let { data: moduleAccessData, error: accessError } = await supabase
    .from('tenant_module_assignments')
    .select(`
      base_module_id,
      is_active,
      custom_config,
      base_modules!inner (
        id,
        slug,
        name,
        description
      )
    `)
    .eq('tenant_id', organization.id)
    .eq('base_modules.slug', module)
    .single();

  // Log detalhado para debug
  console.debug(`🔍 Verificando acesso ao módulo:`, {
    organization_id: organization.id,
    organization_slug: slug,
    module_slug: module,
    moduleAccess: moduleAccessData,
    accessError: accessError?.message,
    queryDetails: {
      tenant_id: organization.id,
      target_module_slug: module,
      query_executed: 'tenant_module_assignments + base_modules JOIN'
    }
  });

  // Buscar todos os módulos disponíveis para esta organização para debug
  const { data: allModules } = await supabase
    .from('tenant_module_assignments')
    .select(`
      base_module_id,
      is_active,
      custom_config,
      base_modules (
        id,
        slug,
        name
      )
    `)
    .eq('tenant_id', organization.id);

  console.debug(`📋 Todos os módulos da organização "${slug}":`, 
    allModules?.map(m => {
      const baseModule = Array.isArray(m.base_modules) ? m.base_modules[0] : m.base_modules;
      return `${baseModule?.slug || m.base_module_id} (active: ${m.is_active})`;
    })
  );

  if (accessError || !moduleAccessData) {
    console.error(`❌ Acesso negado ao módulo "${module}" para organização "${slug}"`, {
      error: accessError?.message,
      availableModules: allModules?.map(m => {
        const baseModule = Array.isArray(m.base_modules) ? m.base_modules[0] : m.base_modules;
        return `${baseModule?.slug || m.base_module_id} (active: ${m.is_active})`;
      })
    });
    
    // Tentar buscar com nomes alternativos (performance para banban-performance, etc.)
    const alternativeModuleSlugs = [
      module.includes('banban-') ? module.replace('banban-', '') : `banban-${module}`,
      module === 'performance' ? 'banban-performance' : 'performance',
      module === 'insights' ? 'banban-insights' : 'insights',
      module === 'alerts' ? 'banban-alerts' : 'alerts'
    ].filter(alt => alt !== module);
    
    for (const altModule of alternativeModuleSlugs) {
      const { data: altAccess } = await supabase
        .from('tenant_module_assignments')
        .select(`
          base_module_id,
          is_active,
          custom_config,
          base_modules!inner (
            id,
            slug,
            name,
            description
          )
        `)
        .eq('tenant_id', organization.id)
        .eq('base_modules.slug', altModule)
        .eq('is_active', true)
        .single();
      
      if (altAccess) {
        console.debug(`✅ Módulo alternativo "${altModule}" encontrado, usando-o...`);
        moduleAccessData = altAccess;
        break;
      }
    }
    
    if (!moduleAccessData) {
      notFound();
    }
  }

  if (moduleAccessData && !moduleAccessData.is_active) {
    console.error(`❌ Módulo "${module}" está desabilitado para organização "${slug}"`);
    notFound();
  }

  console.debug(`✅ Acesso autorizado ao módulo "${module}" para "${slug}"`);

  // Obter metadados do módulo usando o ModuleConfigurationService
  let moduleMetadata = null;
  try {
    const moduleConfigs = await ModuleConfigurationService.loadModuleConfigurations(supabase, organization.id);
    moduleMetadata = moduleConfigs.find(m => m.slug === module);
  } catch (error) {
    console.warn(`⚠️ Erro ao carregar metadados do módulo "${module}":`, error);
  }

  return (
    <DynamicModulePage
      params={{ slug, module }}
      organization={organization}
      moduleMetadata={moduleMetadata}
    />
  );
}