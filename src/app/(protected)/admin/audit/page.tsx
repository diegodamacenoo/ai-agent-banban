'use client';

import { useState, useRef } from 'react';
import { Layout } from '@/shared/components/Layout';
import { Tabs, TabsContent } from '@/shared/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Shield, Monitor, FileText, Clock } from 'lucide-react';
import SessionsManagementContent from './components/sessions-management-content';

// ===============================================
// TYPES & INTERFACES
// ===============================================

type TabId = 'sessions' | 'logs' | 'audit' | 'security';

interface TabItem {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

// ===============================================
// CONSTANTS
// ===============================================

/**
 * Configuração das abas disponíveis na página de auditoria
 * Cada aba representa um módulo de monitoramento diferente
 */
const TAB_ITEMS: TabItem[] = [
  { 
    id: 'sessions', 
    label: 'Sessões', 
    icon: <Monitor className="w-4 h-4" /> 
  },
  { 
    id: 'logs', 
    label: 'Logs do Sistema', 
    icon: <FileText className="w-4 h-4" /> 
  },
  { 
    id: 'audit', 
    label: 'Trilha de Auditoria', 
    icon: <Clock className="w-4 h-4" /> 
  },
  { 
    id: 'security', 
    label: 'Segurança', 
    icon: <Shield className="w-4 h-4" /> 
  }
];

// ===============================================
// UTILITY FUNCTIONS
// ===============================================

/**
 * Verifica se o valor é um TabId válido
 * Garante type safety na troca de abas
 */
function isValidTabId(value: string): value is TabId {
  return ['sessions', 'logs', 'audit', 'security'].includes(value);
}

// ===============================================
// MAIN COMPONENT
// ===============================================

/**
 * Página principal de auditoria do sistema administrativo
 * 
 * Funcionalidades:
 * - Gerenciamento de sessões ativas (implementado)
 * - Logs do sistema (em desenvolvimento)
 * - Trilha de auditoria (em desenvolvimento)
 * - Monitoramento de segurança (em desenvolvimento)
 */
export default function AuditoriaPage() {
  // ===============================================
  // STATE & REFS
  // ===============================================
  
  // Controla qual aba está ativa no momento
  const [activeTab, setActiveTab] = useState<TabId>('sessions');
  
  // Referência para a função de refresh da aba de sessões
  const sessionsRefreshTrigger = useRef<(() => void) | null>(null);

  // ===============================================
  // EVENT HANDLERS
  // ===============================================

  /**
   * Manipula a mudança de aba ativa
   * Garante type safety ao converter string para TabId
   */
  const handleTabChange = (value: string) => {
    if (isValidTabId(value)) {
      setActiveTab(value);
    }
  };

  /**
   * Manipula a atualização de dados baseado na aba ativa
   * Cada aba pode ter sua própria lógica de refresh
   */
  const handleRefresh = () => {
    switch (activeTab) {
      case 'sessions':
        if (sessionsRefreshTrigger.current) {
          sessionsRefreshTrigger.current();
        }
        break;
      default:
        console.debug(`Atualizando dados da aba: ${activeTab}`);
    }
  };

  // ===============================================
  // RENDER
  // ===============================================

  return (
    <Layout width="container">
      {/* Header da página com título e descrição */}
      <Layout.Header>
        <Layout.Header.Title>
          Auditoria
          <Layout.Header.Description>
            Monitore sessões, logs do sistema e trilha de auditoria de forma centralizada.
          </Layout.Header.Description>
        </Layout.Header.Title>
        
        {/* 
        Ações do header (temporariamente comentadas)
        Futuro: incluir botão de atualização global
        */}
        {/* <Layout.Actions>
          <Button 
            variant="secondary" 
            leftIcon={<RefreshCw className="h-4 w-4" />}
            onClick={handleRefresh}
          >
            Atualizar
          </Button>
        </Layout.Actions> */}
      </Layout.Header>

      {/* Corpo principal da página */}
      <Layout.Body>
        <Layout.Content>
          <div className="w-full space-y-4">
            {/* Sistema de navegação por abas */}
            <Tabs
              items={TAB_ITEMS}
              value={activeTab}
              onValueChange={handleTabChange}
              variant="underline"
              className="w-full"
              defaultValue="sessions"
            />

            {/* Renderização condicional do conteúdo das abas */}
            <SessionsTabContent />
            <LogsTabContent />
            <AuditTabContent />
            <SecurityTabContent />
          </div>
        </Layout.Content>
      </Layout.Body>
    </Layout>
  );

  // ===============================================
  // TAB CONTENT COMPONENTS
  // ===============================================

  /**
   * Conteúdo da aba de Sessões
   * Aba principal com funcionalidade completa implementada
   */
  function SessionsTabContent() {
    return (
      <TabsContent value="sessions" activeValue={activeTab}>
        <SessionsManagementContent 
          onRefreshTrigger={(triggerFn) => {
            sessionsRefreshTrigger.current = triggerFn;
          }} 
        />
      </TabsContent>
    );
  }

  /**
   * Conteúdo da aba de Logs do Sistema
   * Estado: Em desenvolvimento
   * Futuro: Visualização de logs de erro, debug e operações
   */
  function LogsTabContent() {
    return (
      <TabsContent value="logs" activeValue={activeTab}>
        <PlaceholderCard
          icon={<FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />}
          title="Logs do Sistema"
          description="Visualize logs de erro, debug e operações do sistema."
          developmentMessage="Em breve você poderá visualizar logs detalhados do sistema, incluindo erros, debug e operações críticas."
        />
      </TabsContent>
    );
  }

  /**
   * Conteúdo da aba de Trilha de Auditoria
   * Estado: Em desenvolvimento
   * Futuro: Histórico completo de ações de usuários
   */
  function AuditTabContent() {
    return (
      <TabsContent value="audit" activeValue={activeTab}>
        <PlaceholderCard
          icon={<Clock className="h-12 w-12 mx-auto mb-4 opacity-30" />}
          title="Trilha de Auditoria"
          description="Acompanhe todas as ações realizadas por usuários no sistema."
          developmentMessage="Em breve você poderá visualizar um histórico completo de todas as ações realizadas por usuários, incluindo login, logout, mudanças de configuração e operações críticas."
        />
      </TabsContent>
    );
  }

  /**
   * Conteúdo da aba de Segurança
   * Estado: Em desenvolvimento
   * Futuro: Análises de segurança avançadas e detecção de anomalias
   */
  function SecurityTabContent() {
    return (
      <TabsContent value="security" activeValue={activeTab}>
        <PlaceholderCard
          icon={<Shield className="h-12 w-12 mx-auto mb-4 opacity-30" />}
          title="Monitoramento de Segurança"
          description="Alertas e análises de segurança avançadas."
          developmentMessage="Em breve você terá acesso a análises de segurança avançadas, detecção de anomalias e alertas automáticos para atividades suspeitas."
        />
      </TabsContent>
    );
  }
}

// ===============================================
// UTILITY COMPONENTS
// ===============================================

/**
 * Componente reutilizável para abas em desenvolvimento
 * Fornece uma interface consistente para funcionalidades futuras
 */
interface PlaceholderCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  developmentMessage: string;
}

function PlaceholderCard({ icon, title, description, developmentMessage }: PlaceholderCardProps) {
  return (
    <Card size="sm" variant="ghost">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          {icon}
          <p className="text-lg font-medium mb-2">Funcionalidade em Desenvolvimento</p>
          <p className="text-sm max-w-md mx-auto">{developmentMessage}</p>
        </div>
      </CardContent>
    </Card>
  );
}