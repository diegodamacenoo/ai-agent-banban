/**
 * Performance Module Page - FASE 3: Dynamic Loading
 * 
 * MIGRADO PARA SISTEMA DINÂMICO - Jan 2025
 * Carrega implementações baseado no component_path do banco
 */

import DynamicModulePage, { createModuleMetadata } from '../components/DynamicModulePage';

interface PerformancePageProps {
  params: Promise<{ slug: string }>;
}

export default async function PerformancePage({ params }: PerformancePageProps) {
  return <DynamicModulePage params={params} moduleSlug="performance" />;
}

// Metadata dinâmica
export const generateMetadata = createModuleMetadata('performance');