'use client';

import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { 
  GitBranch, 
  Package, 
  Upload, 
  Download, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Settings,
  Rocket,
  History,
  Shield,
  Zap
} from 'lucide-react';

// Componente principal
export default function ModuleVersioningPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sistema de Versionamento</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie versões e deployments de módulos com controle total
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open('/admin/modules/integration', '_blank')}
          >
            <Package className="h-4 w-4 mr-2" />
            Integração
          </Button>
          <Button variant="outline" size="sm">
            <History className="h-4 w-4 mr-2" />
            Histórico
          </Button>
          <Button size="sm">
            <GitBranch className="h-4 w-4 mr-2" />
            Nova Versão
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Módulos Ativos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6</div>
            <p className="text-xs text-muted-foreground">+2 desde último mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Versões Released</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">12 este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deployments Hoje</CardTitle>
            <Rocket className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">100% sucesso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rollbacks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Nenhum hoje</p>
          </CardContent>
        </Card>
      </div>

      {/* Conteúdo Principal */}
      <Tabs defaultValue="versions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="versions">Versões</TabsTrigger>
          <TabsTrigger value="deployments">Deployments</TabsTrigger>
          <TabsTrigger value="create">Criar Versão</TabsTrigger>
          <TabsTrigger value="deploy">Deploy</TabsTrigger>
        </TabsList>

        {/* Tab: Versões */}
        <TabsContent value="versions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Gerenciar Versões
              </CardTitle>
              <CardDescription>
                Visualize e gerencie todas as versões dos módulos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div>Carregando versões...</div>}>
                <ModuleVersionsList />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Deployments */}
        <TabsContent value="deployments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5" />
                Histórico de Deployments
              </CardTitle>
              <CardDescription>
                Acompanhe todos os deployments e seus status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div>Carregando deployments...</div>}>
                <DeploymentHistory />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Criar Versão */}
        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Criar Nova Versão
              </CardTitle>
              <CardDescription>
                Crie uma nova versão de módulo com changelog e scripts de migração
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreateVersionForm />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Deploy */}
        <TabsContent value="deploy">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Executar Deployment
              </CardTitle>
              <CardDescription>
                Faça deploy de módulos para organizações específicas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DeploymentForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Componente: Lista de Versões
function ModuleVersionsList() {
  const mockVersions = [
    {
      id: '1',
      module_name: 'banban-insights',
      version: '2.1.0',
      status: 'released',
      is_latest: true,
      is_stable: true,
      breaking_changes: false,
      created_at: '2025-01-15T10:00:00Z',
      released_at: '2025-01-15T14:00:00Z'
    },
    {
      id: '2',
      module_name: 'banban-performance',
      version: '2.0.1',
      status: 'released',
      is_latest: true,
      is_stable: true,
      breaking_changes: false,
      created_at: '2025-01-14T16:00:00Z',
      released_at: '2025-01-14T18:00:00Z'
    },
    {
      id: '3',
      module_name: 'banban-insights',
      version: '2.2.0-beta',
      status: 'testing',
      is_latest: false,
      is_stable: false,
      breaking_changes: true,
      created_at: '2025-01-16T09:00:00Z'
    }
  ];

  return (
    <div className="space-y-4">
      {mockVersions.map((version) => (
        <div key={version.id} className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-medium">{version.module_name}</span>
                <Badge variant="outline">{version.version}</Badge>
                {version.is_latest && (
                  <Badge variant="default">Latest</Badge>
                )}
                {version.is_stable && (
                  <Badge variant="secondary">Stable</Badge>
                )}
                {version.breaking_changes && (
                  <Badge variant="destructive">Breaking</Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Status: {version.status}</span>
                <span>•</span>
                <span>Criado: {new Date(version.created_at).toLocaleDateString()}</span>
                {version.released_at && (
                  <>
                    <span>•</span>
                    <span>Released: {new Date(version.released_at).toLocaleDateString()}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4" />
            </Button>
            {version.status === 'testing' && (
              <Button size="sm">
                <CheckCircle className="h-4 w-4 mr-2" />
                Release
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Componente: Histórico de Deployments
function DeploymentHistory() {
  const mockDeployments = [
    {
      id: '1',
      module_name: 'banban-insights',
      version: '2.1.0',
      organization_name: 'BanBan Fashion',
      deployment_type: 'upgrade',
      status: 'completed',
      started_at: '2025-01-15T15:00:00Z',
      completed_at: '2025-01-15T15:05:00Z'
    },
    {
      id: '2',
      module_name: 'banban-performance',
      version: '2.0.1',
      organization_name: 'BanBan Fashion',
      deployment_type: 'upgrade',
      status: 'completed',
      started_at: '2025-01-14T19:00:00Z',
      completed_at: '2025-01-14T19:03:00Z'
    },
    {
      id: '3',
      module_name: 'banban-alerts',
      version: '1.5.0',
      organization_name: 'Demo Corp',
      deployment_type: 'install',
      status: 'failed',
      started_at: '2025-01-16T10:00:00Z',
      completed_at: '2025-01-16T10:02:00Z'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Concluído</Badge>;
      case 'failed':
        return <Badge variant="destructive">Falhou</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'deploying':
        return <Badge className="bg-blue-100 text-blue-800">Executando</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {mockDeployments.map((deployment) => (
        <div key={deployment.id} className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-medium">{deployment.module_name}</span>
                <Badge variant="outline">{deployment.version}</Badge>
                <span className="text-sm text-muted-foreground">→</span>
                <span className="text-sm">{deployment.organization_name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Tipo: {deployment.deployment_type}</span>
                <span>•</span>
                <span>Iniciado: {new Date(deployment.started_at).toLocaleString()}</span>
                {deployment.completed_at && (
                  <>
                    <span>•</span>
                    <span>Concluído: {new Date(deployment.completed_at).toLocaleString()}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(deployment.status)}
            <Button variant="outline" size="sm">
              <History className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

// Componente: Formulário de Criar Versão
function CreateVersionForm() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="module">Módulo</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um módulo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="banban-insights">banban-insights</SelectItem>
              <SelectItem value="banban-performance">banban-performance</SelectItem>
              <SelectItem value="banban-inventory">banban-inventory</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="version">Versão</Label>
          <Input 
            id="version" 
            placeholder="Ex: 2.1.0" 
            pattern="^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="changelog">Changelog</Label>
        <Textarea 
          id="changelog"
          placeholder="Descreva as mudanças nesta versão..."
          rows={4}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select defaultValue="draft">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="testing">Testing</SelectItem>
              <SelectItem value="released">Released</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <input type="checkbox" id="breaking_changes" />
            <Label htmlFor="breaking_changes">Breaking Changes</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input type="checkbox" id="is_stable" />
            <Label htmlFor="is_stable">Versão Estável</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input type="checkbox" id="is_latest" />
            <Label htmlFor="is_latest">Marcar como Latest</Label>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="migration_scripts">Scripts de Migração</Label>
        <Textarea 
          id="migration_scripts"
          placeholder="Liste os scripts de migração (um por linha)..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline">Cancelar</Button>
        <Button>
          <Package className="h-4 w-4 mr-2" />
          Criar Versão
        </Button>
      </div>
    </div>
  );
}

// Componente: Formulário de Deployment
function DeploymentForm() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="org">Organização</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma organização" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="banban">BanBan Fashion</SelectItem>
              <SelectItem value="demo">Demo Corp</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="module_deploy">Módulo</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um módulo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="banban-insights">banban-insights</SelectItem>
              <SelectItem value="banban-performance">banban-performance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="target_version">Versão Target</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma versão" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2.1.0">2.1.0 (Latest)</SelectItem>
              <SelectItem value="2.0.1">2.0.1</SelectItem>
              <SelectItem value="2.0.0">2.0.0</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="deployment_type">Tipo de Deployment</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="install">Install</SelectItem>
              <SelectItem value="upgrade">Upgrade</SelectItem>
              <SelectItem value="downgrade">Downgrade</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <input type="checkbox" id="force_deploy" />
          <Label htmlFor="force_deploy">Forçar Deploy (ignorar validações)</Label>
        </div>
        <div className="flex items-center space-x-2">
          <input type="checkbox" id="skip_validation" />
          <Label htmlFor="skip_validation">Pular Validação</Label>
        </div>
        <div className="flex items-center space-x-2">
          <input type="checkbox" id="rollback_on_failure" defaultChecked />
          <Label htmlFor="rollback_on_failure">Rollback Automático em Falha</Label>
        </div>
      </div>

      <div className="bg-muted p-4 rounded-lg">
        <h4 className="font-medium mb-2 flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Plano de Deployment
        </h4>
        <div className="text-sm space-y-1">
          <p>• Validação de compatibilidade</p>
          <p>• Verificação de dependências</p>
          <p>• Execução de scripts de migração</p>
          <p>• Testes pós-deployment</p>
          <p>• Ativação do módulo</p>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline">Simular</Button>
        <Button>
          <Rocket className="h-4 w-4 mr-2" />
          Executar Deployment
        </Button>
      </div>
    </div>
  );
} 