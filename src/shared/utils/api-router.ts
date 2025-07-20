import { createSupabaseBrowserClient } from '@/core/supabase/client';

export class APIRouter {
  private supabase = createSupabaseBrowserClient();
  private defaultCustomBackendUrl = 'http://localhost:4000';

  async routeRequest(
    module: string, 
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ) {
    try {
      // Buscar organizaÃ§Ã£o atual
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Primeiro, tentar com colunas multi-tenant
      let profile;
      try {
        const { data: profileData } = await this.supabase
          .from('profiles')
          .select(`
            organization_id,
            organizations (
              id,
              company_legal_name,
              company_trading_name,
              client_type,
              custom_backend_url,
              implementation_config,
              is_implementation_complete
            )
          `)
          .eq('id', user.id)
          .single();
        
        profile = profileData;
      } catch (error) {
        console.warn('âš ï¸ Colunas multi-tenant nÃ£o encontradas, usando fallback bÃ¡sico');
        
        // Fallback para schema bÃ¡sico (sem colunas multi-tenant)
        const { data: basicProfile } = await this.supabase
          .from('profiles')
          .select(`
            organization_id,
            organizations (
              id,
              company_legal_name,
              company_trading_name
            )
          `)
          .eq('id', user.id)
          .single();
        
        if (!basicProfile?.organizations) {
          throw new Error('Organization not found');
        }

        // Simular um cliente padrÃ£o quando nÃ£o hÃ¡ colunas multi-tenant
        const org = Array.isArray(basicProfile.organizations) ? basicProfile.organizations[0] : basicProfile.organizations;
        const simulatedOrg = {
          ...org,
          client_type: 'standard',
          custom_backend_url: null,
          implementation_config: {},
          is_implementation_complete: true
        };
        
        console.warn('🔍 APIRouter - Fallback organization detected (multi-tenant columns not available)');
        
        return this.routeToStandardModule(module, endpoint, method, data);
      }

      if (!profile?.organizations) {
        throw new Error('Organization not found');
      }

      // Handle both single organization and array of organizations
      const org = Array.isArray(profile.organizations) ? profile.organizations[0] : profile.organizations;

      console.info('🔍 APIRouter - Organization routing initialized');

      // Verificar se implementaÃ§Ã£o estÃ¡ completa para clientes customizados
      if (org.client_type === 'custom' && !org.is_implementation_complete) {
        throw new Error('Custom implementation not complete. Please contact support.');
      }

      // Rotear baseado no tipo de cliente
      if (org.client_type === 'custom') {
        return this.routeToCustomBackend(org, module, endpoint, method, data);
      } else {
        return this.routeToStandardModule(module, endpoint, method, data);
      }
    } catch (error) {
      console.error('ðŸš APIRouter Error:', error);
      throw error;
    }
  }

  private async routeToCustomBackend(
    org: any,
    module: string, 
    endpoint: string, 
    method: string, 
    data?: any
  ) {
    // Usar URL customizada ou fallback para backend local
    const baseUrl = org.custom_backend_url || this.defaultCustomBackendUrl;
    const url = `${baseUrl}/api/${module}${endpoint}`;
    
    console.info('🔄 Routing to custom backend');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Tenant-Id': org.id,
      'X-Client-Type': 'custom',
      'X-Organization-Name': org.company_trading_name || org.company_legal_name
    };

    // Obter token de autenticação de forma segura
    try {
      const { data: { session }, error: sessionError } = await this.supabase.auth.getUser();
      if (sessionError) throw sessionError;
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
    } catch (error) {
      console.warn('Erro ao obter token de autenticação:', error);
    }

    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Custom backend error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  private async routeToStandardModule(
    module: string, 
    endpoint: string, 
    method: string, 
    data?: any
  ) {
    console.info('🔍 Routing to standard module');

    // Rotear para APIs padrÃ£o locais (Next.js API routes)
    const url = `/api/${module}${endpoint}`;
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: data ? JSON.stringify(data) : undefined
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Standard module error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  // MÃ©todo para testar conectividade com backend customizado
  async testCustomBackendConnection(organizationId?: string) {
    try {
      let backendUrl = this.defaultCustomBackendUrl;
      
      if (organizationId) {
        const { data: org } = await this.supabase
          .from('organizations')
          .select('custom_backend_url')
          .eq('id', organizationId)
          .single();
        
        if (org?.custom_backend_url) {
          backendUrl = org.custom_backend_url;
        }
      }

      console.info('🔍 Testing backend connection');

      // Adicionar timeout de 5 segundos
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${backendUrl}/health`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      console.info('✅ Backend connection successful');
      
      return {
        success: true,
        url: backendUrl,
        status: response.status,
        data: result
      };
    } catch (error) {
      console.error('â Backend connection failed:', error);
      
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Connection timeout (5s)';
        } else if (error.message.includes('fetch')) {
          errorMessage = 'Network error - Backend not reachable';
        } else {
          errorMessage = error.message;
        }
      }
      
      return {
        success: false,
        url: this.defaultCustomBackendUrl,
        error: errorMessage
      };
    }
  }

  // MÃ©todo para testar roteamento completo
  async testRouting() {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        return { error: 'User not authenticated' };
      }

      // Testar detecÃ§Ã£o de organizaÃ§Ã£o com fallback
      let profile;
      try {
        const { data: profileData } = await this.supabase
          .from('profiles')
          .select(`
            organization_id,
            organizations (
              id,
              company_legal_name,
              company_trading_name,
              client_type,
              custom_backend_url,
              is_implementation_complete
            )
          `)
          .eq('id', user.id)
          .single();
        
        profile = profileData;
      } catch (error) {
        console.warn('âš ï¸ Testando com schema bÃ¡sico');
        
        // Fallback para schema bÃ¡sico
        const { data: basicProfile } = await this.supabase
          .from('profiles')
          .select(`
            organization_id,
            organizations (
              id,
              company_legal_name,
              company_trading_name
            )
          `)
          .eq('id', user.id)
          .single();
        
        if (!basicProfile?.organizations) {
          return { error: 'Organization not found' };
        }

        const org = Array.isArray(basicProfile.organizations) ? basicProfile.organizations[0] : basicProfile.organizations;
        
        return {
          organizationType: 'standard',
          organization: {
            ...org,
            client_type: 'standard',
            custom_backend_url: null,
            is_implementation_complete: true
          },
          note: 'Using fallback mode - multi-tenant columns not available'
        };
      }

      if (!profile?.organizations) {
        return { error: 'Organization not found' };
      }

      const org = Array.isArray(profile.organizations) ? profile.organizations[0] : profile.organizations;

      // Testar conectividade baseada no tipo
      if (org.client_type === 'custom') {
        const backendTest = await this.testCustomBackendConnection(org.id);
        return {
          organizationType: 'custom',
          organization: org,
          backendTest
        };
      } else {
        return {
          organizationType: 'standard',
          organization: org,
          note: 'Standard clients use Next.js API routes'
        };
      }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getAvailableModules(organizationId: string) {
    // Buscar informaÃ§Ãµes da organizaÃ§Ã£o
    const { data: org } = await this.supabase
      .from('organizations')
      .select('id, client_type, implementation_config')
      .eq('id', organizationId)
      .single();

    if (!org) {
      throw new Error('Organization not found');
    }

    const config = org.implementation_config || {};

    if (org.client_type === 'custom') {
      // Buscar mÃ³dulos customizados
      const { data: customModules } = await this.supabase
        .from('custom_modules')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'active');

      return {
        type: 'custom',
        modules: customModules || [],
        standardModules: config.enabled_standard_modules || []
      };
    } else {
      // Retornar mÃ³dulos padrÃ£o disponÃ­veis
      return {
        type: 'standard',
        modules: [
          { name: 'analytics', version: '1.0.0', endpoints: ['/metrics', '/reports'] },
          { name: 'inventory', version: '1.0.0', endpoints: ['/products', '/stock'] },
          { name: 'alerts', version: '1.0.0', endpoints: ['/list', '/create'] }
        ],
        customModules: []
      };
    }
  }
}

// Singleton instance para uso na aplicaÃ§Ã£o
export const apiRouter = new APIRouter(); 
