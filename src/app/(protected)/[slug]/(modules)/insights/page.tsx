/**
 * Insights Module Page - FASE 3: Dynamic Loading
 * 
 * MIGRADO PARA SISTEMA DINÂMICO - Jan 2025
 * Carrega implementações baseado no component_path do banco
 */

import DynamicModulePage, { createModuleMetadata } from '../components/DynamicModulePage';

interface InsightsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function InsightsPage({ params }: InsightsPageProps) {
  return <DynamicModulePage params={params} moduleSlug="insights" />;
}

// Metadata dinâmica
export const generateMetadata = createModuleMetadata('insights');