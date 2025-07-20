'use client';

import { useState, useEffect } from 'react';
import { ClientTypeIndicator } from '@/features/multi-tenant/ClientTypeIndicator';
import { APITester } from '@/features/multi-tenant/APITester';
import { OrganizationSetup } from '@/features/multi-tenant/OrganizationSetup';
import { MetricsDashboard } from '@/features/monitoring/MetricsDashboard';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { CheckCircle, XCircle, Loader2, Zap, Settings, Database } from 'lucide-react';
import { apiRouter } from '@/shared/utils/api-router';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'loading';
  message: string;
  data?: any;
  duration?: number;
}

export default function MultiTenantDemoPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline' | 'error'>('checking');
  const [backendMessage, setBackendMessage] = useState('Verificando...');

  const checkBackendStatus = async () => {
    try {
      setBackendStatus('checking');
      setBackendMessage('Verificando...');
      
      const result = await apiRouter.testCustomBackendConnection();
      
      if (result.success) {
        setBackendStatus('online');
        setBackendMessage(`Online (${result.status})`);
      } else {
        setBackendStatus('offline');
        setBackendMessage(result.error || 'Offline');
      }
    } catch (error) {
      setBackendStatus('error');
      setBackendMessage(error instanceof Error ? error.message : 'Erro de conexÃ£o');
    }
  };

  // Verificar status do backend ao carregar a pÃ¡gina
  useEffect(() => {
    checkBackendStatus();
  }, []);

  const runIntegrationTests = async () => {
    setIsRunningTests(true);
    setTestResults([]);

    const tests = [
      {
        name: 'Backend Connectivity',
        test: () => apiRouter.testCustomBackendConnection()
      },
      {
        name: 'Organization Detection',
        test: () => apiRouter.testRouting()
      },
      {
        name: 'API Test Endpoint',
        test: () => apiRouter.routeRequest('', '/test', 'GET')
      },
      {
        name: 'Integration Test Endpoint',
        test: () => apiRouter.routeRequest('', '/integration/test', 'GET')
      },
      {
        name: 'Dynamic Routing',
        test: () => apiRouter.routeRequest('route/analytics', '/performance', 'GET')
      }
    ];

    for (const { name, test } of tests) {
      const startTime = Date.now();
      
      setTestResults(prev => [...prev, {
        name,
        status: 'loading',
        message: 'Executando...'
      }]);

      try {
        const result = await test();
        const duration = Date.now() - startTime;
        
        setTestResults(prev => prev.map(r => 
          r.name === name 
            ? {
                name,
                status: 'success',
                message: 'Teste executado com sucesso',
                data: result,
                duration
              }
            : r
        ));
      } catch (error) {
        const duration = Date.now() - startTime;
        
        setTestResults(prev => prev.map(r => 
          r.name === name 
            ? {
                name,
                status: 'error',
                message: error instanceof Error ? error.message : 'Erro desconhecido',
                duration
              }
            : r
        ));
      }

      // Pequena pausa entre testes
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsRunningTests(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'loading':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500">Sucesso</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
      case 'loading':
        return <Badge variant="secondary">Executando</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Zap className="h-8 w-8 text-blue-500" />
          Sistema Multi-Tenant - Demo & Testes
        </h1>
        <p className="text-gray-600">
          DemonstraÃ§Ã£o e validaÃ§Ã£o do sistema dual que suporta clientes customizados e padrÃ£o
        </p>
      </div>

      <Tabs defaultValue="setup" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="setup">ConfiguraÃ§Ã£o</TabsTrigger>
          <TabsTrigger value="overview">VisÃ£o Geral</TabsTrigger>
          <TabsTrigger value="testing">Testes de IntegraÃ§Ã£o</TabsTrigger>
          <TabsTrigger value="api">Testador de API</TabsTrigger>
          <TabsTrigger value="metrics">MÃ©tricas</TabsTrigger>
          <TabsTrigger value="docs">DocumentaÃ§Ã£o</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-4">
          <OrganizationSetup 
            onOrganizationCreated={() => {
              // Refresh da pÃ¡gina ou atualizaÃ§Ã£o de estado quando organizaÃ§Ã£o for criada
              window.location.reload();
            }}
          />
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  InformaÃ§Ãµes do Cliente
                </CardTitle>
                <CardDescription>
                  DetecÃ§Ã£o automÃ¡tica do tipo de cliente e configuraÃ§Ãµes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ClientTypeIndicator />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Status do Sistema
                </CardTitle>
                <CardDescription>
                  Conectividade e status dos componentes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Frontend (Next.js)</span>
                  <Badge variant="default" className="bg-green-500">Online</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Backend (Fastify)</span>
                  <Badge 
                    variant={
                      backendStatus === 'online' ? 'default' : 
                      backendStatus === 'checking' ? 'secondary' : 
                      'destructive'
                    }
                    className={
                      backendStatus === 'online' ? 'bg-green-500' : 
                      backendStatus === 'checking' ? '' : 
                      'bg-red-500'
                    }
                  >
                    {backendMessage}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Database (Supabase)</span>
                  <Badge variant="default" className="bg-green-500">Online</Badge>
                </div>
                <div className="space-y-2">
                  <Button 
                    onClick={checkBackendStatus} 
                    disabled={backendStatus === 'checking'}
                    variant="outline"
                    className="w-full"
                  >
                    {backendStatus === 'checking' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verificando Backend...
                      </>
                    ) : (
                      'Verificar Status do Backend'
                    )}
                  </Button>
                  <Button 
                    onClick={runIntegrationTests} 
                    disabled={isRunningTests}
                    className="w-full"
                  >
                    {isRunningTests ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Executando Testes...
                      </>
                    ) : (
                      'Executar Testes de Conectividade'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Testes de IntegraÃ§Ã£o End-to-End</CardTitle>
              <CardDescription>
                ValidaÃ§Ã£o completa do sistema multi-tenant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={runIntegrationTests} 
                disabled={isRunningTests}
                className="w-full"
              >
                {isRunningTests ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Executando Testes...
                  </>
                ) : (
                  'Executar Todos os Testes'
                )}
              </Button>

              {testResults.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Resultados dos Testes</h3>
                  {testResults.map((result, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(result.status)}
                          <span className="font-medium">{result.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {result.duration && (
                            <span className="text-xs text-gray-500">
                              {result.duration}ms
                            </span>
                          )}
                          {getStatusBadge(result.status)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{result.message}</p>
                      {result.data && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-blue-500 hover:text-blue-700">
                            Ver dados detalhados
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Testador de API</CardTitle>
              <CardDescription>
                Teste manual de endpoints e roteamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <APITester />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <MetricsDashboard />
        </TabsContent>

        <TabsContent value="docs" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Clientes PadrÃ£o (SaaS)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>CaracterÃ­sticas</AlertTitle>
                  <AlertDescription>
                    Infraestrutura compartilhada com mÃ³dulos padronizados
                  </AlertDescription>
                </Alert>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>MÃ³dulos via Next.js API Routes</li>
                  <li>Edge Functions para processamento</li>
                  <li>ConfiguraÃ§Ã£o padrÃ£o: analytics, reports, alerts</li>
                  <li>Fallback automÃ¡tico para webhooks existentes</li>
                  <li>Suporte comunitÃ¡rio</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Clientes Customizados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Alert>
                  <Zap className="h-4 w-4" />
                  <AlertTitle>CaracterÃ­sticas</AlertTitle>
                  <AlertDescription>
                    Backend dedicado com mÃ³dulos personalizados
                  </AlertDescription>
                </Alert>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Backend Fastify dedicado (porta 4000)</li>
                  <li>MÃ³dulos especÃ­ficos por cliente</li>
                  <li>URL customizada configurÃ¡vel</li>
                  <li>AutenticaÃ§Ã£o via JWT token</li>
                  <li>VerificaÃ§Ã£o de implementaÃ§Ã£o completa</li>
                  <li>Suporte prioritÃ¡rio</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Fluxo de Roteamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold mb-2">1. DetecÃ§Ã£o de Cliente</h4>
                  <p className="text-sm">APIRouter detecta o tipo de cliente via organizaÃ§Ãµes no Supabase</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold mb-2">2. Roteamento Inteligente</h4>
                  <p className="text-sm">
                    <strong>Custom:</strong> Redireciona para backend Fastify com headers multi-tenant<br/>
                    <strong>Standard:</strong> Usa Next.js API Routes locais
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold mb-2">3. Processamento</h4>
                  <p className="text-sm">Backend processa requisiÃ§Ã£o com contexto de tenant e retorna resposta</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 
