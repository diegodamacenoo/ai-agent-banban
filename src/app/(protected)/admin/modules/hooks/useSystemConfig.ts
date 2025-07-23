'use client';

/**
 * Hook para acessar configurações do sistema no lado cliente
 * UPDATED: Agora usa a versão otimizada do SystemConfigContext.
 * Mantém compatibilidade com componentes existentes.
 */

// Re-export do hook otimizado para manter compatibilidade
export { useSystemConfig } from '../contexts/SystemConfigContext';