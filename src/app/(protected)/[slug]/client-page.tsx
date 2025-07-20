'use client';

import { useClientComponents } from '@/clients/registry';
import { DefaultTenantDashboard } from './components/default-tenant-dashboard';
import { TenantModuleDetails } from '@/app/actions/admin/tenant-modules';

interface Organization {
  id: string;
  slug: string;
  client_type: string;
  company_trading_name: string;
}

interface TenantClientPageProps {
  slug: string;
  organization: Organization;
  activeModules: TenantModuleDetails[];
}

export default function TenantClientPage({ slug, organization, activeModules }: TenantClientPageProps) {
  const { components, loading: loadingComponents } = useClientComponents(organization.client_type);

  // Garantir que is_visible sempre tem um valor booleano
  const normalizedModules = activeModules.map(module => ({
    ...module,
    is_visible: module.is_visible ?? true // Default para true se undefined
  }));

  if (loadingComponents) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-4 gap-6">
          <div className="h-32 bg-gray-200 animate-pulse rounded" />
          <div className="h-32 bg-gray-200 animate-pulse rounded" />
          <div className="h-32 bg-gray-200 animate-pulse rounded" />
          <div className="h-32 bg-gray-200 animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div className="h-64 bg-gray-200 animate-pulse rounded col-span-2" />
          <div className="h-64 bg-gray-200 animate-pulse rounded" />
        </div>
      </div>
    );
  }

  const CustomDashboard = components?.Dashboard;

  return CustomDashboard ? (
    <CustomDashboard 
      slug={slug} 
      organization={organization}
      activeModules={normalizedModules}
    />
  ) : (
    <DefaultTenantDashboard 
      slug={slug} 
      organization={organization}
      activeModules={normalizedModules}
    />
  );
}
