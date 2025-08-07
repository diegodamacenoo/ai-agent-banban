'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Badge } from '@/shared/ui/badge';
import { Switch } from '@/shared/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { 
  Database, 
  Globe, 
  Monitor, 
  Package, 
  Plus, 
  X, 
  Settings,
  Rocket,
  Shield,
  Code2
} from 'lucide-react';
import { useModuleWizard } from '../../hooks/useModuleWizard';

/**
 * Step 4: Opções avançadas do módulo.
 */
export function AdvancedOptionsStep() {
  const { state, updateConfig } = useModuleWizard();
  const [externalDepInput, setExternalDepInput] = useState('');
  const [internalDepInput, setInternalDepInput] = useState('');
  const [tableInput, setTableInput] = useState('');
  const [endpointInput, setEndpointInput] = useState('');
  const [permissionInput, setPermissionInput] = useState('');

  const advancedConfig = state.config.advanced || {
    database: { requiresNewTables: false, migrations: false },
    api: { hasEndpoints: false, requiresAuth: true },
    frontend: { hasUI: true, pageType: 'single' },
    dependencies: { external: [], internal: [] },
    deployment: { environment: 'development', autoValidation: true, runTests: true }
  };

  const updateAdvancedConfig = (section: keyof typeof advancedConfig, updates: any) => {
    updateConfig('advanced', {
      ...advancedConfig,
      [section]: { ...advancedConfig[section], ...updates }
    });
  };

  const addToArray = (section: keyof typeof advancedConfig, field: string, value: string, inputSetter: (value: string) => void) => {
    if (value.trim()) {
      const currentSection = advancedConfig[section] as any;
      const currentArray = currentSection[field] || [];
      if (!currentArray.includes(value.trim())) {
        updateAdvancedConfig(section, {
          [field]: [...currentArray, value.trim()]
        });
        inputSetter('');
      }
    }
  };

  const removeFromArray = (section: keyof typeof advancedConfig, field: string, valueToRemove: string) => {
    const currentSection = advancedConfig[section] as any;
    const currentArray = currentSection[field] || [];
    updateAdvancedConfig(section, {
      [field]: currentArray.filter((item: string) => item !== valueToRemove)
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Opções Avançadas</h3>
        <p className="text-muted-foreground">
          Configure detalhes técnicos específicos do módulo
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Database Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Configuração de Banco de Dados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="requiresNewTables">Requer Novas Tabelas</Label>
              <Switch
                id="requiresNewTables"
                checked={advancedConfig.database.requiresNewTables}
                onCheckedChange={(checked) => updateAdvancedConfig('database', { requiresNewTables: checked })}
              />
            </div>

            {advancedConfig.database.requiresNewTables && (
              <>
                <div className="space-y-2">
                  <Label>Tabelas Necessárias</Label>
                  <div className="flex gap-2">
                    <Input
                      value={tableInput}
                      onChange={(e) => setTableInput(e.target.value)}
                      placeholder="Nome da tabela..."
                      onKeyPress={(e) => e.key === 'Enter' && addToArray('database', 'tables', tableInput, setTableInput)}
                    />
                    <Button 
                      type="button" 
                      size="sm" 
                      onClick={() => addToArray('database', 'tables', tableInput, setTableInput)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {advancedConfig.database.tables && advancedConfig.database.tables.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {advancedConfig.database.tables.map((table) => (
                        <Badge key={table} variant="outline" className="text-xs">
                          {table}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 ml-1"
                            onClick={() => removeFromArray('database', 'tables', table)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="migrations">Gerar Migrações</Label>
                  <Switch
                    id="migrations"
                    checked={advancedConfig.database.migrations}
                    onCheckedChange={(checked) => updateAdvancedConfig('database', { migrations: checked })}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* API Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Configuração da API
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="hasEndpoints">Possui Endpoints</Label>
              <Switch
                id="hasEndpoints"
                checked={advancedConfig.api.hasEndpoints}
                onCheckedChange={(checked) => updateAdvancedConfig('api', { hasEndpoints: checked })}
              />
            </div>

            {advancedConfig.api.hasEndpoints && (
              <>
                <div className="space-y-2">
                  <Label>Endpoints Necessários</Label>
                  <div className="flex gap-2">
                    <Input
                      value={endpointInput}
                      onChange={(e) => setEndpointInput(e.target.value)}
                      placeholder="/api/endpoint..."
                      onKeyPress={(e) => e.key === 'Enter' && addToArray('api', 'endpoints', endpointInput, setEndpointInput)}
                    />
                    <Button 
                      type="button" 
                      size="sm" 
                      onClick={() => addToArray('api', 'endpoints', endpointInput, setEndpointInput)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {advancedConfig.api.endpoints && advancedConfig.api.endpoints.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {advancedConfig.api.endpoints.map((endpoint) => (
                        <Badge key={endpoint} variant="secondary" className="text-xs">
                          {endpoint}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 ml-1"
                            onClick={() => removeFromArray('api', 'endpoints', endpoint)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="requiresAuth">Requer Autenticação</Label>
                  <Switch
                    id="requiresAuth"
                    checked={advancedConfig.api.requiresAuth}
                    onCheckedChange={(checked) => updateAdvancedConfig('api', { requiresAuth: checked })}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Frontend Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Configuração do Frontend
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="hasUI">Possui Interface</Label>
              <Switch
                id="hasUI"
                checked={advancedConfig.frontend.hasUI}
                onCheckedChange={(checked) => updateAdvancedConfig('frontend', { hasUI: checked })}
              />
            </div>

            {advancedConfig.frontend.hasUI && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="pageType">Tipo de Página</Label>
                  <Select
                    value={advancedConfig.frontend.pageType}
                    onValueChange={(value) => updateAdvancedConfig('frontend', { pageType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Página Única</SelectItem>
                      <SelectItem value="multi">Múltiplas Páginas</SelectItem>
                      <SelectItem value="widget">Widget/Componente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Permissões Necessárias</Label>
                  <div className="flex gap-2">
                    <Input
                      value={permissionInput}
                      onChange={(e) => setPermissionInput(e.target.value)}
                      placeholder="Nome da permissão..."
                      onKeyPress={(e) => e.key === 'Enter' && addToArray('frontend', 'permissions', permissionInput, setPermissionInput)}
                    />
                    <Button 
                      type="button" 
                      size="sm" 
                      onClick={() => addToArray('frontend', 'permissions', permissionInput, setPermissionInput)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {advancedConfig.frontend.permissions && advancedConfig.frontend.permissions.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {advancedConfig.frontend.permissions.map((permission) => (
                        <Badge key={permission} variant="destructive" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          {permission}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 ml-1"
                            onClick={() => removeFromArray('frontend', 'permissions', permission)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Dependencies */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Dependências
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* External Dependencies */}
            <div className="space-y-2">
              <Label>Dependências Externas</Label>
              <div className="flex gap-2">
                <Input
                  value={externalDepInput}
                  onChange={(e) => setExternalDepInput(e.target.value)}
                  placeholder="react, lodash, axios..."
                  onKeyPress={(e) => e.key === 'Enter' && addToArray('dependencies', 'external', externalDepInput, setExternalDepInput)}
                />
                <Button 
                  type="button" 
                  size="sm" 
                  onClick={() => addToArray('dependencies', 'external', externalDepInput, setExternalDepInput)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {advancedConfig.dependencies.external.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {advancedConfig.dependencies.external.map((dep) => (
                    <Badge key={dep} variant="outline" className="text-xs">
                      {dep}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-1"
                        onClick={() => removeFromArray('dependencies', 'external', dep)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Internal Dependencies */}
            <div className="space-y-2">
              <Label>Dependências Internas</Label>
              <div className="flex gap-2">
                <Input
                  value={internalDepInput}
                  onChange={(e) => setInternalDepInput(e.target.value)}
                  placeholder="@/shared/ui, @/core/auth..."
                  onKeyPress={(e) => e.key === 'Enter' && addToArray('dependencies', 'internal', internalDepInput, setInternalDepInput)}
                />
                <Button 
                  type="button" 
                  size="sm" 
                  onClick={() => addToArray('dependencies', 'internal', internalDepInput, setInternalDepInput)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {advancedConfig.dependencies.internal.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {advancedConfig.dependencies.internal.map((dep) => (
                    <Badge key={dep} variant="secondary" className="text-xs">
                      <Code2 className="h-3 w-3 mr-1" />
                      {dep}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-1"
                        onClick={() => removeFromArray('dependencies', 'internal', dep)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Deployment Configuration */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5" />
              Configuração de Deploy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="environment">Ambiente Inicial</Label>
                <Select
                  value={advancedConfig.deployment.environment}
                  onValueChange={(value) => updateAdvancedConfig('deployment', { environment: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="development">Desenvolvimento</SelectItem>
                    <SelectItem value="staging">Homologação</SelectItem>
                    <SelectItem value="production">Produção</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="autoValidation">Validação Automática</Label>
                <Switch
                  id="autoValidation"
                  checked={advancedConfig.deployment.autoValidation}
                  onCheckedChange={(checked) => updateAdvancedConfig('deployment', { autoValidation: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="runTests">Executar Testes</Label>
                <Switch
                  id="runTests"
                  checked={advancedConfig.deployment.runTests}
                  onCheckedChange={(checked) => updateAdvancedConfig('deployment', { runTests: checked })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Resumo das Configurações Avançadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Banco de Dados:</h4>
              <p className="text-muted-foreground">
                {advancedConfig.database.requiresNewTables 
                  ? `${advancedConfig.database.tables?.length || 0} tabela(s) nova(s)` 
                  : 'Não requer novas tabelas'
                }
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">API:</h4>
              <p className="text-muted-foreground">
                {advancedConfig.api.hasEndpoints 
                  ? `${advancedConfig.api.endpoints?.length || 0} endpoint(s)` 
                  : 'Sem endpoints'
                }
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Frontend:</h4>
              <p className="text-muted-foreground">
                {advancedConfig.frontend.hasUI 
                  ? `Interface ${advancedConfig.frontend.pageType}` 
                  : 'Sem interface'
                }
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Dependências:</h4>
              <p className="text-muted-foreground">
                {advancedConfig.dependencies.external.length + advancedConfig.dependencies.internal.length} dependências totais
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}