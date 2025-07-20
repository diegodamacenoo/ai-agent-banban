/**
 * Exemplo de página universal usando o novo sistema de módulos
 * Fase 2 - Core Registry Implementation
 * 
 * Esta página substitui as páginas específicas por módulo
 */

'use client';

import { notFound } from 'next/navigation';
import { DynamicModuleLoader } from '../loader/DynamicModuleLoader';
import { ClientType } from '../types';

interface UniversalModulePageProps {
  params: {
    slug: string;      // slug da organização
    module: string;    // slug do módulo
  };
}

/**
 * Função para buscar organização (exemplo)
 * Em produção, isso viria do seu sistema de organizações
 */
async function getOrganizationBySlug(slug: string) {
  // Simulação - substituir pela sua implementação
  const mockOrganizations = [
    {
      id: 'org-1',
      slug: 'demo-banban',
      name: 'Demo Banban',
      client_type: 'banban' as ClientType
    },
    {
      id: 'org-2', 
      slug: 'demo-custom',
      name: 'Demo Custom',
      client_type: 'custom' as ClientType
    }
  ];

  return mockOrganizations.find(org => org.slug === slug) || null;
}

/**
 * Função para verificar acesso ao módulo (exemplo)
 */
async function verifyModuleAccess(organizationId: string, moduleSlug: string) {
  // Simulação - substituir pela sua implementação de verificação de acesso
  // Pode usar o moduleConfigurationService.hasModuleAccess()
  return true;
}

/**
 * Página universal que carrega qualquer módulo dinamicamente
 */
export default async function UniversalModulePage({ params }: UniversalModulePageProps) {
  const { slug, module } = params;

  // Buscar organização
  const organization = await getOrganizationBySlug(slug);
  if (!organization) {
    notFound();
  }

  // Verificar acesso ao módulo
  const hasAccess = await verifyModuleAccess(organization.id, module);
  if (!hasAccess) {
    notFound();
  }

  // Renderizar com o ModuleLoader
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header da página (opcional) */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {organization.name}
              </h1>
              <span className="text-sm text-gray-500">
                Módulo: {module}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo do módulo */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DynamicModuleLoader
          organizationId={organization.id}
          clientType={organization.client_type}
          moduleSlug={module}
          params={params}
          organization={organization}
          onError={(error) => {
            console.error(`Erro ao carregar módulo ${module}:`, error);
          }}
          onLoaded={(config) => {
            console.debug(`Módulo ${module} carregado:`, config);
            // Opcional: tracking de analytics
          }}
        />
      </div>
    </div>
  );
}

/**
 * Exemplo de como usar em um layout
 */
export function ModuleLayoutExample({ 
  children, 
  organizationSlug 
}: { 
  children: React.ReactNode;
  organizationSlug: string;
}) {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar seria gerada dinamicamente aqui */}
      <aside className="w-64 bg-white shadow-lg">
        <div className="p-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Navegação Dinâmica
          </h2>
          <p className="text-sm text-gray-600">
            A sidebar seria gerada pelo DynamicSidebar na Fase 3
          </p>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}

/**
 * Exemplo de rota Next.js app router
 * Arquivo: src/app/(protected)/[slug]/[module]/page.tsx
 */
export const NextJSRouteExample = `
// src/app/(protected)/[slug]/[module]/page.tsx
import { UniversalModulePage } from '@/core/modules/examples/UniversalModulePage';

export default UniversalModulePage;

// Opcional: generateStaticParams para ISR
export async function generateStaticParams() {
  // Retornar combinações de slug/module para pré-renderização
  return [
    { slug: 'demo-banban', module: 'performance' },
    { slug: 'demo-banban', module: 'insights' },
    { slug: 'demo-custom', module: 'performance' }
  ];
}

// Opcional: metadata dinâmica
export async function generateMetadata({ params }: { params: { slug: string, module: string } }) {
  const organization = await getOrganizationBySlug(params.slug);
  
  return {
    title: \`\${params.module} - \${organization?.name || 'Dashboard'}\`,
    description: \`Módulo \${params.module} para \${organization?.name}\`
  };
}
`;

/**
 * Exemplo de middleware para verificação de acesso
 */
export const MiddlewareExample = `
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { moduleConfigurationService } from '@/core/modules/services/ModuleConfigurationService';

export async function middleware(request: NextRequest) {
  // Extrair parâmetros da URL
  const url = request.nextUrl.pathname;
  const matches = url.match(/^\/([^\/]+)\/([^\/]+)/);
  
  if (matches) {
    const [, orgSlug, moduleSlug] = matches;
    
    // Verificar se organização existe
    const organization = await getOrganizationBySlug(orgSlug);
    if (!organization) {
      return NextResponse.redirect(new URL('/not-found', request.url));
    }
    
    // Verificar acesso ao módulo
    const hasAccess = await moduleConfigurationService.hasModuleAccess(
      organization.id, 
      moduleSlug
    );
    
    if (!hasAccess) {
      return NextResponse.redirect(new URL('/access-denied', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};
`;