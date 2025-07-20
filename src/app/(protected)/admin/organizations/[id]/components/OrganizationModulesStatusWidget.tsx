'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Progress } from '@/shared/ui/progress';
import { Button } from '@/shared/ui/button';
import { Settings, CheckCircle, Clock, AlertTriangle, Package } from 'lucide-react';
import { getOrganizationModulesStatusData, OrganizationModulesStatusData } from '@/app/actions/admin/organization-approvals';

interface ModuleStatus {
  id: string;
  name: string;
  status: 'ENABLED' | 'PROVISIONING' | 'DISABLED' | 'ERROR';
  maturity: 'GA' | 'BETA' | 'ALPHA';
}

interface OrganizationModulesStatusWidgetProps {
  organizationId: string;
}

export function OrganizationModulesStatusWidget({ organizationId }: OrganizationModulesStatusWidgetProps) {
  const [modulesStatus, setModulesStatus] = useState<OrganizationModulesStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchModulesStatus();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchModulesStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [organizationId]);

  const fetchModulesStatus = async () => {
    try {
      setError(null);
      const result = await getOrganizationModulesStatusData(organizationId);
      
      if (result.success && result.data) {
        setModulesStatus(result.data);
      } else {
        setError(result.error || 'Erro ao carregar status dos módulos');
        console.error('Erro ao buscar status dos módulos:', result.error);
      }
    } catch (error) {
      console.error('Erro inesperado ao buscar status dos módulos:', error);
      setError('Erro inesperado ao carregar status dos módulos');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: ModuleStatus['status']) => {
    switch (status) {
      case 'ENABLED':
        return <CheckCircle className="h-3 w-3 text-green-600" />;
      case 'PROVISIONING':
        return <Clock className="h-3 w-3 text-amber-600" />;
      case 'DISABLED':
        return <Settings className="h-3 w-3 text-zinc-400" />;
      case 'ERROR':
        return <AlertTriangle className="h-3 w-3 text-red-600" />;
      default:
        return <Package className="h-3 w-3 text-zinc-400" />;
    }
  };

  const getStatusBadge = (status: ModuleStatus['status']) => {
    switch (status) {
      case 'ENABLED':
        return <Badge variant="success" className="text-xs">Ativo</Badge>;
      case 'PROVISIONING':
        return <Badge variant="warning" className="text-xs">Configurando</Badge>;
      case 'DISABLED':
        return <Badge variant="outline" className="text-xs">Inativo</Badge>;
      case 'ERROR':
        return <Badge variant="destructive" className="text-xs">Erro</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Desconhecido</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status dos Módulos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-zinc-200 rounded w-full"></div>
            <div className="h-2 bg-zinc-200 rounded w-3/4"></div>
            <div className="h-4 bg-zinc-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status dos Módulos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={fetchModulesStatus}
            className="mt-2 w-full"
          >
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!modulesStatus) return null;

  const enabledPercentage = (modulesStatus.enabled / modulesStatus.total) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Settings className="h-4 w-4 text-zinc-600" />
          Status dos Módulos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Overview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Módulos Ativos</span>
            <span className="font-medium">{modulesStatus.enabled}/{modulesStatus.total}</span>
          </div>
          <Progress value={enabledPercentage} className="h-2" />
          <div className="text-xs text-zinc-500 text-center">
            {enabledPercentage.toFixed(0)}% dos módulos estão ativos
          </div>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 p-2 bg-green-50 rounded border border-green-200">
            <CheckCircle className="h-3 w-3 text-green-600" />
            <div className="text-xs">
              <div className="font-medium">{modulesStatus.enabled}</div>
              <div className="text-zinc-600">Ativos</div>
            </div>
          </div>

          {modulesStatus.provisioning > 0 && (
            <div className="flex items-center gap-2 p-2 bg-amber-50 rounded border border-amber-200">
              <Clock className="h-3 w-3 text-amber-600" />
              <div className="text-xs">
                <div className="font-medium">{modulesStatus.provisioning}</div>
                <div className="text-zinc-600">Configurando</div>
              </div>
            </div>
          )}

          {modulesStatus.disabled > 0 && (
            <div className="flex items-center gap-2 p-2 bg-zinc-50 rounded border border-zinc-200">
              <Settings className="h-3 w-3 text-zinc-400" />
              <div className="text-xs">
                <div className="font-medium">{modulesStatus.disabled}</div>
                <div className="text-zinc-600">Inativos</div>
              </div>
            </div>
          )}

          {modulesStatus.error > 0 && (
            <div className="flex items-center gap-2 p-2 bg-red-50 rounded border border-red-200">
              <AlertTriangle className="h-3 w-3 text-red-600" />
              <div className="text-xs">
                <div className="font-medium">{modulesStatus.error}</div>
                <div className="text-zinc-600">Com Erro</div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Module Updates */}
        <div className="pt-3 border-t">
          <div className="text-xs font-medium text-zinc-700 mb-2">Módulos Recentes</div>
          <div className="space-y-1">
            {modulesStatus.modules.slice(0, 3).map((module) => (
              <div key={module.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {getStatusIcon(module.status)}
                  <span className="truncate">{module.name}</span>
                </div>
                {getStatusBadge(module.status)}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}