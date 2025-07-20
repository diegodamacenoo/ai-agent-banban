/**
 * Página de demonstração da Navegação Dinâmica
 * Exemplo de integração complementar à interface existente
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { ExternalLink, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { DynamicNavigationConfig } from '../components/shared/DynamicNavigationConfig';

export default function DynamicNavigationPage() {
  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/admin/modules" className="hover:text-foreground">
              Módulos
            </Link>
            <span>/</span>
            <span>Navegação Dinâmica</span>
          </div>
          <h1 className="text-3xl font-bold">Navegação Dinâmica</h1>
          <p className="text-muted-foreground">
            Configure a estrutura de navegação baseada no banco de dados
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/modules">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/modules" target="_blank">
              <ExternalLink className="w-4 h-4 mr-2" />
              Ver Módulos
            </Link>
          </Button>
        </div>
      </div>

      {/* Informações sobre a funcionalidade */}
      <Card>
        <CardHeader>
          <CardTitle>Sobre a Navegação Dinâmica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            O sistema de navegação dinâmica carrega a estrutura da sidebar automaticamente 
            baseado nas configurações dos módulos no banco de dados. Esta funcionalidade 
            complementa o sistema de gestão de módulos existente.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">✨ Funcionalidades</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Carregamento automático da navegação</li>
                <li>• Cache inteligente para performance</li>
                <li>• Suporte a múltiplos tipos de cliente</li>
                <li>• Navegação hierárquica (submenus)</li>
                <li>• Sincronização com permissões</li>
                <li>• Fallbacks elegantes para erros</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">🔧 Integração</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Preserva design da sidebar existente</li>
                <li>• Compatível com sistema atual</li>
                <li>• Migração gradual possível</li>
                <li>• APIs para personalização</li>
                <li>• Monitoramento e debug</li>
                <li>• Configuração via interface gráfica</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Componente principal */}
      <DynamicNavigationConfig />

      {/* Exemplos de uso */}
      <Card>
        <CardHeader>
          <CardTitle>Exemplos de Uso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">1. Layout Básico</h4>
              <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`import { DynamicLayout } from '@/shared/components/DynamicLayout';

function MyPage() {
  const organization = {
    id: 'org-123',
    slug: 'minha-org',
    name: 'Minha Organização',
    client_type: 'banban'
  };

  return (
    <DynamicLayout organization={organization}>
      <h1>Conteúdo da página</h1>
    </DynamicLayout>
  );
}`}
              </pre>
            </div>

            <div>
              <h4 className="font-semibold mb-2">2. Sidebar Isolada</h4>
              <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`import { DynamicSidebar } from '@/shared/components/DynamicSidebar';

function MyLayout() {
  return (
    <div className="flex">
      <DynamicSidebar
        organizationId="org-123"
        organizationSlug="minha-org"
        organizationName="Minha Organização"
        clientType="banban"
      />
      <main>Conteúdo</main>
    </div>
  );
}`}
              </pre>
            </div>

            <div>
              <h4 className="font-semibold mb-2">3. Hook para Controle</h4>
              <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`import { useDynamicLayout } from '@/shared/hooks/useDynamicLayout';

function MyComponent() {
  const {
    sidebarCollapsed,
    setSidebarCollapsed,
    checkModuleAccess,
    refreshNavigation
  } = useDynamicLayout({ organization });

  return (
    <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
      Toggle Sidebar
    </button>
  );
}`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}