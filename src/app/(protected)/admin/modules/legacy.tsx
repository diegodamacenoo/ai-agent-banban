'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { RefreshCw, Plus } from 'lucide-react';
import { Layout } from '@/shared/components/Layout';
import { ModuleHealthCard } from './components/ModuleHealthCard';
import { getModuleHealthStats } from '@/app/actions/admin/modules';
import ModuleDiagnostics from './components/ModuleDiagnostics';
import DevelopmentDashboard from './components/DevelopmentDashboard';
import QualityAnalysis from './components/QualityAnalysis';
import { DevelopmentLogs } from './components/DevelopmentLogs';
import { ModuleAdoptionStatsWidget } from './components/ModuleAdoptionStatsWidget';
import { ModuleCatalogTable } from './components/ModuleCatalogTable';
import { useModuleData } from './hooks/useModuleData';

export default function ModulesPage() {
  const [healthStats, setHealthStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Use the custom hook for module data management
  const {
    modules,
    orphanModules,
    adoptionData,
    loading: moduleLoading,
    loadData,
    handleArchiveModule,
    handleUnarchiveModule,
    handleMaturityChange,
    handleDeleteModule
  } = useModuleData();

  const loadHealthData = useCallback(async () => {
    setIsLoading(true);
    const response = await getModuleHealthStats();
    if (response.success && response.data) {
      setHealthStats(response.data);
    }
    setIsLoading(false);
  }, []);

  const handleReload = useCallback(() => {
    loadData();
    loadHealthData();
  }, [loadData, loadHealthData]);

  useEffect(() => {
    loadHealthData();
  }, [loadHealthData]);

  const combinedLoading = isLoading || moduleLoading;

  // Sidebar content
  const sidebarContent = (
    <div className="flex flex-col gap-4">
      <h3 className="font-medium text-lg">Estatísticas</h3>
      <ModuleAdoptionStatsWidget />
    </div>
  );

  return (
    <Layout loading={combinedLoading}>
      <Layout.Header>
        <Layout.Breadcrumbs items={[{ title: 'Gerenciamento de Módulos' }]} />
        <Layout.Actions>
          <Button 
            variant="outline" 
            onClick={handleReload} 
            disabled={combinedLoading}
            leftIcon={<RefreshCw className={combinedLoading ? 'animate-spin' : ''} />}
          >
            Atualizar
          </Button>
        </Layout.Actions>
      </Layout.Header>
      <Layout.Body>
        <Layout.Sidebar width="w-80">
          {sidebarContent}
        </Layout.Sidebar>
        <Layout.Content>
          {/* ModuleHealthCard */}
          {healthStats && <ModuleHealthCard />}

          {/* Tabs */}
          <Tabs defaultValue="catalog" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="catalog">Catálogo de Módulos</TabsTrigger>
              <TabsTrigger value="development">Desenvolvimento</TabsTrigger>
              <TabsTrigger value="quality">Análise de Qualidade</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
            </TabsList>
            <TabsContent value="catalog">
              <Card size="sm">
                <CardHeader>
                  <div className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Catálogo de Módulos</CardTitle>
                      <CardDescription>
                        Explore e gerencie os módulos disponíveis no sistema.
                      </CardDescription>
                    </div>
                    <Button variant="outline" className="flex items-center gap-2" leftIcon={<Plus className="w-4 h-4" />}>
                      Planejar Novo Módulo
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ModuleCatalogTable
                    modules={modules}
                    orphanModules={orphanModules}
                    adoptionData={adoptionData}
                    loading={moduleLoading}
                    onArchive={handleArchiveModule}
                    onUnarchive={handleUnarchiveModule}
                    onMaturityChange={handleMaturityChange}
                    onDelete={handleDeleteModule}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="development">
              <DevelopmentDashboard />
            </TabsContent>
            <TabsContent value="quality">
              <QualityAnalysis />
            </TabsContent>
            <TabsContent value="logs">
              <DevelopmentLogs />
            </TabsContent>
          </Tabs>
        </Layout.Content>
      </Layout.Body>
    </Layout>
  );
}