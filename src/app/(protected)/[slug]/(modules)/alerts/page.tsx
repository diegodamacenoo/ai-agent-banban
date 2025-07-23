/**
 * Alerts Module Page - FASE 3: Dynamic Loading
 * 
 * MIGRADO PARA SISTEMA DINÂMICO - Jan 2025
 * Carrega implementações baseado no component_path do banco
 */

import DynamicModulePage, { createModuleMetadata } from '../components/DynamicModulePage';

interface AlertsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function AlertsPage({ params }: AlertsPageProps) {
  return <DynamicModulePage params={params} moduleSlug="alerts" />;
}

// Metadata dinâmica
export const generateMetadata = createModuleMetadata('alerts');