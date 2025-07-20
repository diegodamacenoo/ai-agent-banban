import { notFound } from 'next/navigation';
import { 
  getModuleDetails, 
  getModuleTenantStatus, 
  getModuleRealTimeMetrics,
  getModuleUsageChart,
  getModuleActivityLog,
  getModuleIssues
} from '@/app/actions/admin/module-details';

import ModuleDetailClient from '../components/shared/ModuleDetailClient';

interface ModuleDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ModuleDetailPage({ params }: ModuleDetailPageProps) {
  const { id } = await params;
  
  // Buscar dados principais do módulo
  const { data: moduleDetail, error: moduleError } = await getModuleDetails(id);
  
  if (moduleError || !moduleDetail) {
    console.error('Module not found:', moduleError);
    notFound();
  }

  // Buscar dados paralelos
  const [
    { data: tenantStatus },
    { data: realTimeMetrics },
    { data: usageChart },
    { data: activityLog },
    { data: issues }
  ] = await Promise.all([
    getModuleTenantStatus(moduleDetail.id),
    getModuleRealTimeMetrics(moduleDetail.id),
    getModuleUsageChart(moduleDetail.id, 7),
    getModuleActivityLog(moduleDetail.id, 20),
    getModuleIssues(moduleDetail.id)
  ]);

  return (
    <ModuleDetailClient
      moduleDetail={moduleDetail}
      tenantStatus={tenantStatus || []}
      realTimeMetrics={realTimeMetrics}
      usageChart={usageChart || []}
      activityLog={activityLog || []}
      issues={issues || []}
      moduleId={moduleDetail.id}
    />
  );
}

// Metadata para a página
export async function generateMetadata({ params }: ModuleDetailPageProps) {
  const { id } = await params;
  const { data: moduleDetail } = await getModuleDetails(id);
  
  return {
    title: moduleDetail ? `${moduleDetail.name} - Detalhes do Módulo` : 'Módulo não encontrado',
    description: moduleDetail ? 
      `Monitoramento e debug detalhado do módulo ${moduleDetail.name}` : 
      'Página de detalhes do módulo'
  };
}