'use client';

import { useState, useCallback } from 'react';
import { Tabs, TabsContent } from '@/shared/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Layout, AnalyticsCard, AnalyticsGrid } from '@/shared/components/Layout';
import { 
  RefreshCw, 
  Database, 
  Activity, 
  BarChart3, 
  Settings,
  Clock,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react';

// Import dos componentes existentes
import ModuleDetailHeader from './ModuleDetailHeader';
import { RealTimeMetrics, UsageChart, ModuleActivityLog } from '../monitoring';
import { TenantStatusTable } from '../assignments';
import { IssuesPanel, DebugToolsPanel } from '../diagnostics';

// Types
import type {
  ModuleDetail,
  TenantStatus,
  RealTimeMetrics as RealTimeMetricsType,
  UsageChartData,
  ActivityLog,
  ModuleIssue
} from '../../types/module-details';

interface ModuleDetailClientProps {
  moduleDetail: ModuleDetail;
  tenantStatus: TenantStatus[];
  realTimeMetrics: RealTimeMetricsType | null;
  usageChart: UsageChartData[];
  activityLog: ActivityLog[];
  issues: ModuleIssue[];
  moduleId: string;
}

export default function ModuleDetailClient({
  moduleDetail,
  tenantStatus: initialTenantStatus,
  realTimeMetrics: initialMetrics,
  usageChart: initialUsageChart,
  activityLog: initialActivityLog,
  issues: initialIssues,
  moduleId
}: ModuleDetailClientProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [tenantStatus, setTenantStatus] = useState(initialTenantStatus);
  const [realTimeMetrics, setRealTimeMetrics] = useState(initialMetrics);
  const [usageChart, setUsageChart] = useState(initialUsageChart);
  const [activityLog, setActivityLog] = useState(initialActivityLog);
  const [issues, setIssues] = useState(initialIssues);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.debug('Refreshing module data for:', moduleId);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [moduleId]);

  const tabItems = [
    { id: 'overview', label: 'Visão Geral', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'tenants', label: 'Tenants', icon: <Users className="w-4 h-4" /> },
    { id: 'usage', label: 'Uso', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'activity', label: 'Atividade', icon: <Clock className="w-4 h-4" /> },
    { id: 'debug', label: 'Debug', icon: <Settings className="w-4 h-4" /> },
  ];

  const sidebarContent = (
    <div className="flex flex-col gap-4">
      <h3 className="font-medium text-lg">Métricas Rápidas</h3>
      
      {realTimeMetrics && (
        <AnalyticsGrid>
          <AnalyticsCard
            title="Usuários Ativos"
            description="Agora"
            value={realTimeMetrics.current_usage}
            icon={<Users className="w-4 h-4" />}
            iconBgColor="bg-blue-100"
            textColor="text-blue-600"
          />
          <AnalyticsCard
            title="Tempo Resposta"
            description="Média"
            value={`${realTimeMetrics.avg_response_time}ms`}
            icon={<Zap className="w-4 h-4" />}
            iconBgColor="bg-green-100"
            textColor="text-green-600"
          />
          <AnalyticsCard
            title="Uptime"
            description="Últimas 24h"
            value={`${realTimeMetrics.uptime_percentage.toFixed(1)}%`}
            icon={<Activity className="w-4 h-4" />}
            iconBgColor="bg-emerald-100"
            textColor="text-emerald-600"
          />
          <AnalyticsCard
            title="Cache Hit"
            description="Taxa"
            value={`${realTimeMetrics.cache_hit_rate.toFixed(1)}%`}
            icon={<Database className="w-4 h-4" />}
            iconBgColor="bg-purple-100"
            textColor="text-purple-600"
          />
        </AnalyticsGrid>
      )}

      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-sm">Status dos Tenants</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Total Ativos:</span>
            <span className="font-semibold">{tenantStatus.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Online:</span>
            <span className="font-semibold text-green-600">
              {tenantStatus.filter(t => t.is_online).length}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Com Problemas:</span>
            <span className="font-semibold text-red-600">
              {tenantStatus.filter(t => !t.is_online || t.error_count > 0).length}
            </span>
          </div>
          {issues.length > 0 && (
            <div className="flex justify-between text-sm">
              <span>Issues Abertas:</span>
              <span className="font-semibold text-orange-600">{issues.length}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <Layout loading={isRefreshing}>
      <Layout.Header>
        <Layout.Breadcrumbs items={[
          { title: 'Admin', href: '/admin' },
          { title: 'Módulos', href: '/admin/modules' },
          { title: moduleDetail.name }
        ] || []} />
        <Layout.Actions>
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button>
            <Settings className="mr-2 h-4 w-4" />
            Configurar
          </Button>
        </Layout.Actions>
      </Layout.Header>
      
      <Layout.Body>
        <Layout.Sidebar width="w-80">
          {sidebarContent}
        </Layout.Sidebar>
        
        <Layout.Content>
          <ModuleDetailHeader module={moduleDetail} />
          
          {issues && issues.length > 0 && (
            <IssuesPanel 
              issues={issues} 
              moduleId={moduleId}
            />
          )}

          <RealTimeMetrics 
            metrics={realTimeMetrics} 
            moduleId={moduleId}
          />

          <Tabs
            items={tabItems}
            value={activeTab}
            onValueChange={setActiveTab}
            defaultValue="overview"
            className="w-full"
          />

          <div>
            <TabsContent value="overview" activeValue={activeTab} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Uso nos Últimos 7 Dias</CardTitle>
                    <CardDescription>
                      Análise de requests, tempo de resposta e usuários únicos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <UsageChart 
                      data={usageChart} 
                      moduleId={moduleId}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Status dos Tenants</CardTitle>
                    <CardDescription>
                      Status resumido das organizações que usam este módulo
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TenantStatusTable 
                      tenantStatus={tenantStatus} 
                      moduleId={moduleId}
                      compact={true}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="tenants" activeValue={activeTab}>
              <Card>
                <CardHeader>
                  <CardTitle>Status Detalhado dos Tenants</CardTitle>
                  <CardDescription>
                    Monitor em tempo real do status de todas as organizações usando este módulo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TenantStatusTable 
                    tenantStatus={tenantStatus} 
                    moduleId={moduleId}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="usage" activeValue={activeTab}>
              <Card>
                <CardHeader>
                  <CardTitle>Análise de Uso Detalhada</CardTitle>
                  <CardDescription>
                    Métricas detalhadas de performance e utilização do módulo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <UsageChart 
                    data={usageChart} 
                    moduleId={moduleId}
                    detailed={true}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" activeValue={activeTab}>
              <Card>
                <CardHeader>
                  <CardTitle>Log de Atividades</CardTitle>
                  <CardDescription>
                    Histórico detalhado de eventos e atividades do módulo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ModuleActivityLog 
                    logs={activityLog} 
                    moduleId={moduleId}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="debug" activeValue={activeTab}>
              <DebugToolsPanel 
                moduleId={moduleId}
                moduleDetail={moduleDetail}
              />
            </TabsContent>
          </div>
        </Layout.Content>
      </Layout.Body>
    </Layout>
  );
}
