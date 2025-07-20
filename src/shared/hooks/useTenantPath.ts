import { useParams } from 'next/navigation';
import { getTenantConfig } from '@/shared/utils/tenant-middleware';

export function useTenantPath() {
  const params = useParams();
  const slug = params?.slug as string | undefined;
  const tenantConfig = slug ? getTenantConfig(slug) : null;

  /**
   * Cria uma URL com o prefixo do tenant atual
   */
  const withTenantPath = (path: string): string => {
    // Remove leading slash se existir
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    
    if (slug) {
      return `/${slug}/${cleanPath}`;
    }
    
    // Se nÃ£o hÃ¡ tenant, retorna o path original
    return `/${cleanPath}`;
  };

  /**
   * Verifica se estamos em um contexto de tenant
   */
  const isInTenant = (): boolean => {
    return !!slug && !!tenantConfig;
  };

  /**
   * ObtÃ©m o slug do tenant atual
   */
  const getCurrentSlug = (): string | null => {
    return slug || null;
  };

  /**
   * ObtÃ©m a configuraÃ§Ã£o do tenant atual
   */
  const getCurrentTenantConfig = () => {
    return tenantConfig;
  };

  return {
    withTenantPath,
    isInTenant,
    getCurrentSlug,
    getCurrentTenantConfig,
    slug,
    tenantConfig
  };
} 
