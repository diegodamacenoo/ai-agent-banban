'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/core/supabase/client';
import { SidebarInset, SidebarProvider } from "@/shared/ui/sidebar-provider";
import { DynamicSidebarWrapper } from '@/shared/components/DynamicSidebar';
import { Skeleton } from '@/shared/ui/skeleton';
import { migrateImplementationConfig, needsConfigMigration } from '@/shared/utils/module-mapping';
import { getVisibleModulesForTenant } from '@/app/actions/admin/tenant-modules';

interface Organization {
  id?: string;
  slug: string;
  client_type: string;
  company_trading_name?: string;
  company_legal_name?: string;
  is_implementation_complete?: boolean;
  implementation_config?: {
    subscribed_modules?: string[];
    custom_modules?: string[];
    enabled_standard_modules?: string[];
    features?: string[];
  };
  visible_modules?: string[]; // Módulos realmente visíveis baseados em tenant_module_assignments.is_visible
}

interface UserProfile {
  id: string;
  organization_id: string | null;
  organization?: Organization;
}

interface ProtectedLayoutProps {
  children: ReactNode;
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;
  
  const [authStatus, setAuthStatus] = useState<'loading' | 'authorized' | 'unauthorized'>('loading');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.debug('🔐 Iniciando verificação de autenticação...');
      const supabase = createSupabaseBrowserClient();
      
      console.debug('👤 Buscando usuário autenticado...');
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        console.warn('Usuário não autenticado:', userError?.message);
        setAuthStatus('unauthorized');
        router.push('/login');
        return;
      }

      // Primeiro buscar o perfil do usuário
      console.debug('📋 Buscando perfil do usuário:', user.id);
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, organization_id')
        .eq('id', user.id)
        .single();
      console.debug('📋 Resultado do perfil:', { profile, profileError });

      // Validações detalhadas do perfil
      if (profileError) {
        console.error('Erro ao buscar perfil:', profileError.message);
        setAuthStatus('unauthorized');
        router.push('/setup-account');
        return;
      }

      if (!profile) {
        console.warn('Perfil não encontrado para o usuário:', user.id);
        setAuthStatus('unauthorized');
        router.push('/setup-account');
        return;
      }

      if (!profile.organization_id) {
        console.warn('Usuário sem organização vinculada');
        setAuthStatus('unauthorized');
        router.push('/setup-account');
        return;
      }

      // Agora buscar a organização separadamente
      console.debug('🏢 Buscando organização:', profile.organization_id);
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .select('id, slug, client_type, implementation_config, company_trading_name, company_legal_name, is_implementation_complete')
        .eq('id', profile.organization_id)
        .single();
      console.debug('🏢 Resultado da organização:', { organization, orgError });

      // Verificar se a configuração precisa ser migrada (IDs incorretos)
      if (organization && organization.implementation_config && needsConfigMigration(organization.implementation_config, organization.client_type)) {
        console.debug('🔄 Migrando IDs de módulos para formato correto...');
        const originalConfig = { ...organization.implementation_config };
        organization.implementation_config = migrateImplementationConfig(organization.implementation_config, organization.client_type);
        
        console.debug('📋 Migração de módulos aplicada:', {
          antes: originalConfig.subscribed_modules,
          depois: organization.implementation_config.subscribed_modules
        });
      }

      // Buscar módulos realmente visíveis da tabela tenant_module_assignments
      let visibleModules: string[] = [];
      if (organization?.id) {
        const visibleModulesResult = await getVisibleModulesForTenant(organization.id);
        if (visibleModulesResult.success && visibleModulesResult.data) {
          visibleModules = visibleModulesResult.data;
          console.debug('🔍 Módulos visíveis carregados:', visibleModules);
        } else {
          console.warn('⚠️ Erro ao carregar módulos visíveis:', visibleModulesResult.error);
        }
      }

      console.debug('🔍 Organização carregada no tenant:', {
        organization_id: profile.organization_id,
        has_organization: !!organization,
        has_implementation_config: !!organization?.implementation_config,
        subscribed_modules_count: organization?.implementation_config?.subscribed_modules?.length || 0,
        visible_modules_count: visibleModules.length,
        error: orgError?.message
      });

      // Log específico para debug de módulos
      if (visibleModules.length > 0) {
        console.debug('✅ Módulos visíveis encontrados:', visibleModules);
      } else {
        console.warn('⚠️ Nenhum módulo visível para esta organização');
      }

      if (orgError) {
        console.error('Erro ao buscar organização:', orgError.message);
        setAuthStatus('unauthorized');
        router.push('/setup-account');
        return;
      }

      if (!organization) {
        console.error('Organização não encontrada', {
          organization_id: profile.organization_id
        });
        setAuthStatus('unauthorized');
        router.push('/setup-account');
        return;
      }

      if (!organization.slug) {
        console.error('Organização sem slug definido', {
          organization_id: profile.organization_id,
          organization
        });
        setAuthStatus('unauthorized');
        router.push('/setup-account');
        return;
      }

      // Verificar se o slug corresponde à organização do usuário
      if (slug !== organization.slug) {
        console.warn('Slug não corresponde à organização do usuário, redirecionando...', {
          currentSlug: slug,
          organizationSlug: organization.slug
        });
        router.push(`/${organization.slug}`);
        return;
      }

      // Adicionar os módulos visíveis à organização
      const organizationWithVisibleModules = {
        ...organization,
        visible_modules: visibleModules
      };

      setAuthStatus('authorized');
      setUserProfile({ ...profile, organization: organizationWithVisibleModules });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('Erro ao verificar autenticação:', errorMessage);
      setAuthStatus('unauthorized');
      router.push('/login');
    }
  };

  if (authStatus === 'loading') {
    return (
      <div className="flex h-screen">
        <Skeleton className="w-64 h-full" />
        <div className="flex-1">
          <Skeleton className="h-16 w-full" />
          <div className="p-4">
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (authStatus === 'unauthorized') {
    return null;
  }

  return (
    <SidebarProvider>
      <DynamicSidebarWrapper 
        organization={userProfile?.organization}
      />
      <SidebarInset>
        <main className="flex-1 overflow-y-auto">
            {children}
          </main>
      </SidebarInset>
    </SidebarProvider>
  );
}