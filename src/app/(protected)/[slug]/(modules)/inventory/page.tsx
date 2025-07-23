/**
 * Inventory Module Page - FASE 3: Dynamic Loading
 * 
 * MIGRADO PARA SISTEMA DINÂMICO - Jan 2025
 * Carrega implementações baseado no component_path do banco
 */

import DynamicModulePage, { createModuleMetadata } from '../components/DynamicModulePage';

interface InventoryPageProps {
  params: Promise<{ slug: string }>;
}

export default async function InventoryPage({ params }: InventoryPageProps) {
  return <DynamicModulePage params={params} moduleSlug="inventory" />;
}

// Metadata dinâmica
export const generateMetadata = createModuleMetadata('inventory');