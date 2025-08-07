'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/core/supabase/client';
import { SidebarInset, SidebarProvider } from "@/shared/ui/sidebar-provider";
import { DynamicSidebarWrapper } from '@/shared/components/DynamicSidebar';
import { Skeleton } from '@/shared/ui/skeleton';
import { migrateImplementationConfig, needsConfigMigration } from '@/shared/utils/module-mapping';
import { getVisibleModulesForTenant } from '@/app/actions/admin/tenant-modules';
import { useAuth } from '@/hooks/use-auth';
import { initSessionManager } from '@/core/auth/session-manager';

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
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  // Usar o hook simples de autenticação
  const { user, loading: authLoading, error: authError, isAuthenticated } = useAuth();

  // Inicializar o gerenciador de sessão simples
  useEffect(() => {
    initSessionManager();
  }, []);

  // Redirecionar se não autenticado
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      console.debug('Usuário não autenticado, redirecionando para login');
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Carregar dados do usuário quando autenticado
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      loadUserProfile();
    }
  }, [authLoading, isAuthenticated, user]);

  const loadUserProfile = async () => {
    try {
      console.debug('📋 Carregando perfil do usuário:', user.id);
      const supabase = createSupabaseBrowserClient();

      // Buscar perfil do usuário
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, organization_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile || !profile.organization_id) {
        console.warn('Perfil inválido ou sem organização, redirecionando para setup');
        router.push('/setup-account');
        return;
      }

      // Buscar organização
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .select('id, slug, client_type, implementation_config, company_trading_name, company_legal_name, is_implementation_complete')
        .eq('id', profile.organization_id)
        .single();

      if (orgError || !organization || !organization.slug) {
        console.warn('Organização inválida, redirecionando para setup');
        router.push('/setup-account');
        return;
      }

      // Verificar se o slug corresponde à organização do usuário
      if (slug !== organization.slug) {
        console.debug('Redirecionando para slug correto:', organization.slug);
        router.push(`/${organization.slug}`);
        return;
      }

      // Migrar configuração se necessário
      if (organization.implementation_config && needsConfigMigration(organization.implementation_config, organization.client_type)) {
        organization.implementation_config = migrateImplementationConfig(organization.implementation_config, organization.client_type);
      }

      // Buscar módulos visíveis
      let visibleModules: string[] = [];
      const visibleModulesResult = await getVisibleModulesForTenant(organization.id);
      if (visibleModulesResult.success && visibleModulesResult.data) {
        visibleModules = visibleModulesResult.data;
      }

      // Configurar perfil do usuário
      setUserProfile({ 
        ...profile, 
        organization: {
          ...organization,
          visible_modules: visibleModules
        }
      });

      console.debug('✅ Perfil carregado com sucesso');
    } catch (err) {
      console.error('Erro ao carregar perfil:', err);
      router.push('/login');
    }
  };

  // Estados de loading e erro
  if (authLoading || (isAuthenticated && !userProfile)) {
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

  // Se não autenticado, será redirecionado pelo useEffect
  if (!isAuthenticated) {
    return null;
  }

  // Se autenticado mas não tem perfil carregado, mostrar loading
  if (!userProfile) {
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

  return (
    <SidebarProvider>
      <DynamicSidebarWrapper 
        organization={userProfile.organization}
      />
      <SidebarInset>
        <main className="flex-1 overflow-y-auto">
            {children}
          </main>
      </SidebarInset>
    </SidebarProvider>
  );
}