'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import { Progress } from '@/shared/ui/progress';
import { Tabs, TabsContent } from '@/shared/ui/tabs';
import { 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Package, 
  GitBranch,
  Database,
  Settings,
  Play,
  RotateCcw
} from 'lucide-react';

interface IntegrationStatus {
  totalModules: number;
  integratedModules: number;
  pendingModules: string[];
  details: Array<{
    moduleId: string;
    name: string;
    registered: boolean;
    versioned: boolean;
    currentVersion?: string;
    status: string;
  }>;
}

interface IntegrationResult {
  action: string;
  results?: Array<{
    moduleId: string;
    registered: boolean;
    versioned: boolean;
    error?: string;
  }>;
  summary?: {
    total: number;
    successful: number;
    failed: number;
  };
  moduleId?: string;
  message?: string;
}

export default function ModuleIntegrationPage() {
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [integrating, setIntegrating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [activeTab, setActiveTab] = useState('modules');

  // Carregar status inicial
  useEffect(() => {
    loadIntegrationStatus();
  }, []);

  const loadIntegrationStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/modules/integration');
      const data = await response.json();

      if (data.success) {
        setStatus(data.data);
        setLastUpdate(new Date().toLocaleString());
      } else {
        setMessage({ type: 'error', text: data.error || 'Erro ao carregar status' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro de conexão com o servidor' });
    } finally {
      setLoading(false);
    }
  };

  const executeIntegration = async (action: string, moduleId?: string) => {
    try {
      setIntegrating(true);
      setMessage(null);

      const response = await fetch('/api/admin/modules/integration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, moduleId }),
      });

      const data = await response.json();

      if (data.success) {
        const result = data.data as IntegrationResult;
        
        if (action === 'integrate_all' && result.summary) {
          setMessage({
            type: 'success',
            text: `Integração concluída: ${result.summary.successful}/${result.summary.total} módulos integrados com sucesso`,
          });
        } else if (action === 'reintegrate_module') {
          setMessage({
            type: 'success',
            text: result.message || 'Módulo re-integrado com sucesso',
          });
        }

        // Recarregar status após integração
        await loadIntegrationStatus();
      } else {
        setMessage({ type: 'error', text: data.error || 'Erro na integração' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro de conexão durante integração' });
    } finally {
      setIntegrating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'integrated':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Integrado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><AlertTriangle className="w-3 h-3 mr-1" />Pendente</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><XCircle className="w-3 h-3 mr-1" />Erro</Badge>;
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  const integrationProgress = status ? (status.integratedModules / status.totalModules) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Carregando status de integração...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Integração de Módulos</h1>
          <p className="text-muted-foreground mt-1">
            Integração dos módulos Banban com o sistema de versionamento
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={loadIntegrationStatus}
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Mensagens */}
      {message && (
        <Alert className={message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Status Overview */}
      {status && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Módulos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-blue-500" />
                <span className="text-2xl font-bold">{status.totalModules}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Integrados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-2xl font-bold text-green-600">{status.integratedModules}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <span className="text-2xl font-bold text-yellow-600">{status.pendingModules.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Progresso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{Math.round(integrationProgress)}%</span>
                  <span className="text-muted-foreground">{status.integratedModules}/{status.totalModules}</span>
                </div>
                <Progress value={integrationProgress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs 
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
        items={[
          { id: 'modules', label: 'Módulos', icon: <Package className="w-4 h-4" /> },
          { id: 'actions', label: 'Ações', icon: <Settings className="w-4 h-4" /> }
        ]}
      />

      <div className="mt-6 space-y-4">

        {/* Tab: Módulos */}
        <TabsContent value="modules" activeValue={activeTab} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <GitBranch className="w-5 h-5" />
                <span>Status dos Módulos</span>
              </CardTitle>
              <CardDescription>
                Status de integração de cada módulo Banban
                {lastUpdate && <span className="ml-2 text-xs">• Última atualização: {lastUpdate}</span>}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {status?.details && status.details.length > 0 ? (
                <div className="space-y-3">
                  {status.details.map((module) => (
                    <div key={module.moduleId} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div>
                            <h4 className="font-medium">{module.name}</h4>
                            <p className="text-sm text-muted-foreground">{module.moduleId}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-sm">
                          <div className="flex items-center space-x-2">
                            <Database className="w-4 h-4" />
                            <span className={module.registered ? 'text-green-600' : 'text-red-600'}>
                              {module.registered ? 'Registrado' : 'Não registrado'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <GitBranch className="w-4 h-4" />
                            <span className={module.versioned ? 'text-green-600' : 'text-red-600'}>
                              {module.versioned ? `v${module.currentVersion || '1.0.0'}` : 'Sem versão'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(module.status)}
                          {module.status !== 'integrated' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => executeIntegration('reintegrate_module', module.moduleId)}
                              disabled={integrating}
                            >
                              <RotateCcw className="w-3 h-3 mr-1" />
                              Re-integrar
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum módulo encontrado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Ações */}
        <TabsContent value="actions" activeValue={activeTab} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Play className="w-5 h-5" />
                  <span>Integração Completa</span>
                </CardTitle>
                <CardDescription>
                  Integra todos os módulos Banban com o sistema de versionamento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p>Esta ação irá:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Registrar módulos no core_modules</li>
                    <li>Criar versões iniciais (v1.0.0)</li>
                    <li>Marcar como released e stable</li>
                    <li>Gerar scripts de upgrade/downgrade</li>
                  </ul>
                </div>
                
                <Button
                  onClick={() => executeIntegration('integrate_all')}
                  disabled={integrating}
                  className="w-full"
                >
                  {integrating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Integrando...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Executar Integração Completa
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <RefreshCw className="w-5 h-5" />
                  <span>Atualização de Status</span>
                </CardTitle>
                <CardDescription>
                  Verifica o status atual da integração dos módulos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p>Esta ação irá:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Verificar módulos registrados</li>
                    <li>Validar versões existentes</li>
                    <li>Atualizar status de integração</li>
                    <li>Identificar módulos pendentes</li>
                  </ul>
                </div>
                
                <Button
                  variant="outline"
                  onClick={loadIntegrationStatus}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Verificar Status
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </div>
    </div>
  );
} 