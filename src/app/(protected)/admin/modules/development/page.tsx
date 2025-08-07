'use client';

import Link from 'next/link';
import { Button } from '@/shared/ui/button';
import { ArrowLeft, Settings } from 'lucide-react';
import { Layout } from '@/shared/components/Layout';
import { SectionNavigator } from './components/SectionNavigator';
import { SectionCard } from './components/SectionCard';
import { StructuralTrackingPanel } from './components/StructuralTrackingPanel';
import { useDevelopmentGuide } from './hooks/useDevelopmentGuide';

/**
 * Página de Desenvolvimento Interativo de Módulos
 * 
 * Guia completo e interativo para desenvolvimento de módulos.
 * Inclui dashboard, wizard de criação, validação, templates, 
 * ferramentas de debug e monitoramento.
 */
export default function InteractiveDevelopmentGuidePage() {
  const {
    sections,
    currentSection,
    setCurrentSection,
    progress,
    isLoading,
    preferences,
    updatePreferences
  } = useDevelopmentGuide();

  const renderSectionContent = () => {
    switch (currentSection) {
      case 'dashboard':
        return (
          <SectionCard
            id="dashboard"
            title="Dashboard de Desenvolvimento"
            description="Visão geral das métricas e status do ambiente"
            status="completed"
            progress={{ current: 4, total: 4 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-medium text-green-800">Sistema</h3>
                <p className="text-sm text-green-600">Operacional</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-medium text-blue-800">Performance</h3>
                <p className="text-sm text-blue-600">Ótima</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h3 className="font-medium text-purple-800">Saúde</h3>
                <p className="text-sm text-purple-600">95%</p>
              </div>
            </div>
          </SectionCard>
        );


      case 'validation':
        return (
          <SectionCard
            id="validation"
            title="Validação Estrutural"
            description="Verificação de arquivos e configurações obrigatórias"
            status="completed"
            progress={{ current: 12, total: 12 }}
          >
            <StructuralTrackingPanel />
          </SectionCard>
        );

      case 'templates':
        return (
          <SectionCard
            id="templates"
            title="Templates e Preview"
            description="Visualização e customização de templates"
            status="pending"
            progress={{ current: 0, total: 6 }}
          >
            <div className="text-center py-8 text-muted-foreground">
              <p>Seção de templates em desenvolvimento</p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href="/admin/modules/development/templates">
                  Acessar Templates
                </Link>
              </Button>
            </div>
          </SectionCard>
        );

      case 'tools':
        return (
          <SectionCard
            id="tools"
            title="Ferramentas de Debug"
            description="Ferramentas integradas para diagnóstico e debug"
            status="pending"
            progress={{ current: 0, total: 8 }}
          >
            <div className="text-center py-8 text-muted-foreground">
              <p>Ferramentas de debug disponíveis</p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href="/admin/modules/development/tools">
                  Abrir Ferramentas
                </Link>
              </Button>
            </div>
          </SectionCard>
        );

      case 'deployment':
        return (
          <SectionCard
            id="deployment"
            title="Deploy e Monitoramento"
            description="Deployment e monitoramento em tempo real"
            status="pending"
            progress={{ current: 0, total: 7 }}
          >
            <div className="text-center py-8 text-muted-foreground">
              <p>Sistema de deploy e monitoramento</p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href="/admin/modules/development/monitoring">
                  Ver Monitoramento
                </Link>
              </Button>
            </div>
          </SectionCard>
        );

      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            <p>Seção não encontrada</p>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <Layout loading={true}>
        <Layout.Content>
          <div>Carregando guia de desenvolvimento...</div>
        </Layout.Content>
      </Layout>
    );
  }

  return (
    <Layout>
      <Layout.Header>
        <div>
          <nav className="text-sm text-muted-foreground mb-2">
            <span>Admin</span> / <Link href="/admin/modules" className="hover:text-foreground">Módulos</Link> / <span>Desenvolvimento</span>
          </nav>
          <Layout.Header.Title>Guia Interativo de Desenvolvimento</Layout.Header.Title>
          <Layout.Header.Description>
            Desenvolvimento completo de módulos com assistência guiada
          </Layout.Header.Description>
        </div>
        <Layout.Actions>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => updatePreferences({ showAnimations: !preferences.showAnimations })}
          >
            <Settings className="mr-2 h-4 w-4" />
            {preferences.showAnimations ? 'Desativar' : 'Ativar'} Animações
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/modules">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Módulos
            </Link>
          </Button>
        </Layout.Actions>
      </Layout.Header>

      <Layout.Body>
        <Layout.Sidebar width="w-80">
          <SectionNavigator
            sections={sections}
            currentSection={currentSection}
            onSectionChange={setCurrentSection}
            overallProgress={progress.percentage}
          />
        </Layout.Sidebar>

        <Layout.Content>
          <div className="max-w-4xl mx-auto">
            {renderSectionContent()}
          </div>
        </Layout.Content>
      </Layout.Body>
    </Layout>
  );
}