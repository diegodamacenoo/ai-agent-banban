import { createSupabaseServerClient } from '@/core/supabase/server';
import { getAssignedModulesForOrg, TenantModuleDetails } from '@/app/actions/admin/tenant-modules';
import TenantClientPage from './client-page';
import { notFound } from 'next/navigation';

interface Organization {
  id: string;
  slug: string;
  client_type: string;
  company_trading_name: string;
}

interface TenantPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function TenantPage({ params }: TenantPageProps) {
  const { slug } = await params;

  // Buscar organização no servidor
  const supabase = await createSupabaseServerClient();
  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .select('id, slug, client_type, company_trading_name')
    .eq('slug', slug)
    .single();

  if (orgError || !organization) {
    notFound();
  }

  // Buscar módulos atribuídos à organização
  const modulesResult = await getAssignedModulesForOrg(organization.id);
  
  // Filtrar apenas módulos ativos (visíveis e com status operacional habilitado)
  const activeModules = modulesResult.success && modulesResult.data
    ? modulesResult.data.filter((module: TenantModuleDetails) => 
        module.is_visible && 
        (!module.operational_status || module.operational_status === 'ENABLED')
      )
    : [];

  return (
    <TenantClientPage 
      slug={slug}
      organization={organization}
      activeModules={activeModules}
    />
  );
}