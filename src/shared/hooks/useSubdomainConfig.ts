'use client';

import { useState, useEffect } from 'react';
import { SUBDOMAIN_CONFIG, SubdomainConfig, getSubdomainConfig } from '@/shared/utils/subdomain-middleware';

export function useSubdomainConfig() {
  const [config, setConfig] = useState<SubdomainConfig | null>(null);
  const [subdomain, setSubdomain] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const detectSubdomain = () => {
      if (typeof window === 'undefined') return;

      const hostname = window.location.hostname;
      
      // Para desenvolvimento local (ex: banban.localhost:3000)
      if (hostname.includes('localhost')) {
        const parts = hostname.split('.');
        if (parts.length > 1 && parts[0] !== 'localhost') {
          const detectedSubdomain = parts[0];
          setSubdomain(detectedSubdomain);
          setConfig(getSubdomainConfig(detectedSubdomain));
        } else {
          setSubdomain(null);
          setConfig(null);
        }
      } else {
        // Para produÃ§Ã£o (ex: banban.seudominio.com)
        const parts = hostname.split('.');
        if (parts.length > 2) {
          const detectedSubdomain = parts[0];
          setSubdomain(detectedSubdomain);
          setConfig(getSubdomainConfig(detectedSubdomain));
        } else {
          setSubdomain(null);
          setConfig(null);
        }
      }
      
      setIsLoading(false);
    };

    detectSubdomain();
  }, []);

  return {
    config,
    subdomain,
    isLoading,
    isCustomClient: config !== null,
    clientType: config?.clientType || 'standard',
    organizationName: config?.organizationName || 'Standard Client',
    customBackendUrl: config?.customBackendUrl || '',
    isImplementationComplete: config?.isImplementationComplete || false,
    theme: config?.theme || null,
    features: config?.features || [],
    sector: config?.sector || 'standard'
  };
} 
