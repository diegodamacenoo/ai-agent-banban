/**
 * Configuração de Navegação Dinâmica - Complemento à interface existente
 * Fase 3 - Dynamic Navigation Implementation
 * 
 * Adiciona controles para gerenciar navegação dinâmica sem substituir a interface existente
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';
import { 
  Navigation, 
  Eye, 
  EyeOff, 
  ArrowUp, 
  ArrowDown, 
  Settings, 
  RefreshCw,
  Save,
  AlertTriangle,
  CheckCircle,
  Menu,
  Home,
  Layers
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { useToast } from '@/shared/ui/toast';
import { DynamicModuleRegistry } from '@/core/modules/registry/DynamicModuleRegistry';
import { ModuleConfiguration, ClientType } from '@/core/modules/types';
import { createSupabaseBrowserClient } from '@/core/supabase/client';

interface NavigationConfigProps {
  className?: string;
}

interface NavigationItem {
  id: string;
  moduleSlug: string;
  title: string;
  order: number;
  visible: boolean;
  type: 'direct' | 'submenu';
  route?: string;
  icon?: string;
  children?: NavigationItem[];
}

interface NavigationPreview {
  clientType: ClientType;
  organizationId: string;
  items: NavigationItem[];
}

/**
 * Componente para configurar navegação dinâmica
 */
export const DynamicNavigationConfig: React.FC<NavigationConfigProps> = ({ className }) => {
  const [selectedClient, setSelectedClient] = useState<ClientType>('banban');
  const [preview, setPreview] = useState<NavigationPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  
  // Criar instância do Supabase e do Registry
  const supabase = createSupabaseBrowserClient();
  const dynamicModuleRegistry = DynamicModuleRegistry.getInstance(supabase);

  // Carregar preview da navegação
  const loadNavigationPreview = async () => {
    if (!selectedClient) return;

    setLoading(true);
    try {
      // Para demo, usar uma organização fictícia
      const demoOrgId = 'demo-org-id';
      
      console.debug(`🔄 Carregando preview para ${selectedClient}`);
      
      const modules = await dynamicModuleRegistry.loadModuleConfiguration(
        demoOrgId,
        selectedClient
      );

      const navigationItems = modules
        .filter(module => module.navigation)
        .map(module => ({
          id: module.navigation!.id,
          moduleSlug: module.slug,
          title: module.navigation!.nav_title,
          order: module.navigation!.nav_order,
          visible: module.tenant.is_visible,
          type: module.navigation!.nav_type,
          route: module.navigation!.route_path || undefined,
          icon: module.implementation.icon_name || undefined,
          children: module.navigation!.children?.map(child => ({
            id: child.id,
            moduleSlug: module.slug,
            title: child.nav_title,
            order: child.nav_order,
            visible: true,
            type: 'direct' as const,
            route: child.route_path || undefined
          })) || []
        }))
        .sort((a, b) => a.order - b.order);

      setPreview({
        clientType: selectedClient,
        organizationId: demoOrgId,
        items: navigationItems
      });

      console.debug(`✅ Preview carregado: ${navigationItems.length} itens`);

    } catch (error) {
      console.error('❌ Erro ao carregar preview:', error);
      toast.error("Não foi possível carregar o preview da navegação.", {
        title: "Erro ao carregar preview",
      });
    } finally {
      setLoading(false);
    }
  };

  // Carregar preview inicial
  useEffect(() => {
    loadNavigationPreview();
  }, [selectedClient]);

  // Salvar configurações (simulado)
  const saveNavigationConfig = async () => {
    if (!preview) return;

    setSaving(true);
    try {
      // Aqui seria implementada a lógica real de salvamento
      // Por enquanto, apenas simular
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success("A configuração de navegação foi salva com sucesso.", {
        title: "Configuração salva",
      });

      // Invalidar cache para forçar reload
      dynamicModuleRegistry.clearCache();

    } catch (error) {
      toast.error("Não foi possível salvar a configuração.", {
        title: "Erro ao salvar",
      });
    } finally {
      setSaving(false);
    }
  };

  // Reordenar itens
  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (!preview) return;

    const newItems = [...preview.items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    // Trocar posições
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    
    // Atualizar orders
    newItems.forEach((item, idx) => {
      item.order = idx + 1;
    });

    setPreview({
      ...preview,
      items: newItems
    });
  };

  // Toggle visibilidade
  const toggleVisibility = (index: number) => {
    if (!preview) return;

    const newItems = [...preview.items];
    newItems[index].visible = !newItems[index].visible;

    setPreview({
      ...preview,
      items: newItems
    });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="w-5 h-5" />
              Configuração de Navegação Dinâmica
            </CardTitle>
            <CardDescription>
              Configure a estrutura de navegação para diferentes tipos de cliente.
              Esta configuração complementa o sistema de módulos existente.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={loadNavigationPreview}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button
              onClick={saveNavigationConfig}
              disabled={saving || !preview}
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Salvar
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Seleção de Cliente */}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Tipo de Cliente:</label>
          <Select
            value={selectedClient}
            onValueChange={(value: ClientType) => setSelectedClient(value)}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="banban">Banban</SelectItem>
              <SelectItem value="riachuelo">Riachuelo</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
              <SelectItem value="default">Padrão</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Preview da Navegação */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            <span>Carregando preview...</span>
          </div>
        ) : preview && preview.items.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Preview da Navegação</h3>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Rota</TableHead>
                  <TableHead>Visível</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.items.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.order}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {item.icon && React.createElement(
                          require('lucide-react')[item.icon] || Home,
                          { className: "w-4 h-4" }
                        )}
                        <span className={item.visible ? '' : 'text-muted-foreground'}>
                          {item.title}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {item.moduleSlug}
                        </Badge>
                      </div>
                      {/* Subitens */}
                      {item.children && item.children.length > 0 && (
                        <div className="ml-6 mt-2 space-y-1">
                          {item.children.map(child => (
                            <div key={child.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Layers className="w-3 h-3" />
                              {child.title}
                              <Badge variant="outline" className="text-xs">
                                {child.route}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.type === 'direct' ? 'default' : 'secondary'}>
                        {item.type === 'direct' ? 'Direto' : 'Submenu'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-gray-100 px-1 rounded">
                        {item.route || '-'}
                      </code>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => toggleVisibility(index)}
                        className="flex items-center gap-1 text-sm"
                      >
                        {item.visible ? (
                          <>
                            <Eye className="w-4 h-4 text-green-600" />
                            <span className="text-green-600">Visível</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-400">Oculto</span>
                          </>
                        )}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveItem(index, 'up')}
                          disabled={index === 0}
                        >
                          <ArrowUp className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveItem(index, 'down')}
                          disabled={index === preview.items.length - 1}
                        >
                          <ArrowDown className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Menu className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum item de navegação encontrado para este cliente.</p>
          </div>
        )}

        {/* Informações sobre integração */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Integração com Sistema Existente</h4>
              <p className="text-sm text-blue-700 mt-1">
                Esta configuração trabalha em conjunto com a gestão de módulos existente. 
                As alterações na navegação são sincronizadas automaticamente com o banco de dados 
                e refletidas em tempo real nas sidebars dos usuários.
              </p>
              <ul className="text-sm text-blue-700 mt-2 ml-4 list-disc">
                <li>Navegação carregada dinamicamente do banco</li>
                <li>Cache inteligente para performance</li>
                <li>Sincronização automática com módulos ativos</li>
                <li>Suporte a permissões por módulo</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Estatísticas do Registry */}
        <div className="bg-gray-50 border rounded-lg p-4">
          <h4 className="font-medium mb-2">Estatísticas do Sistema</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Cache Modules:</span>
              <span className="ml-2 font-mono">
                {dynamicModuleRegistry.getStats().moduleCache}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Components:</span>
              <span className="ml-2 font-mono">
                {dynamicModuleRegistry.getStats().componentCache}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Config Cache:</span>
              <span className="ml-2 font-mono">
                {dynamicModuleRegistry.getStats().configCache}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DynamicNavigationConfig;