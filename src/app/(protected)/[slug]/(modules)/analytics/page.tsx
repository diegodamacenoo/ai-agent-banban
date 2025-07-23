/**
 * Analytics Module Page - FASE 3: Dynamic Loading
 * 
 * MIGRADO PARA SISTEMA DINÂMICO - Jan 2025
 * Carrega implementações baseado no component_path do banco
 */

import DynamicModulePage, { createModuleMetadata } from '../components/DynamicModulePage';

interface AnalyticsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  return <DynamicModulePage params={params} moduleSlug="analytics" />;
}

// Metadata dinâmica
export const generateMetadata = createModuleMetadata('analytics');