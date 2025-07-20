'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { 
  CheckCircle, 
  Settings, 
  RefreshCw, 
  Download,
  UserPlus,
  Package,
  Zap,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/shared/ui/toast';

interface OrganizationQuickActionsWidgetProps {
  organizationId: string;
}

export function OrganizationQuickActionsWidget({organizationId }: OrganizationQuickActionsWidgetProps) {
  const { toast } = useToast();
  const handleApproveAllPending = async () => {
    toast.info('Funcionalidade de aprovação em lote será implementada em breve');
  };

  const handleRefreshModules = async () => {
    toast.info('Atualizando status dos módulos...');
    // Simular refresh dos dados
    window.location.reload();
  };

  const handleExportData = () => {
    toast.info('Funcionalidade de exportação será implementada em breve');
  };

  const handleAddUser = () => {
    toast.info('Use o botão "Criar Usuário" na seção de usuários');
  };

  const handleConfigureModules = () => {
    toast.info('Use a seção "Configuração de Módulos" abaixo');
  };

  const handleProvisionModules = () => {
    toast.info('Funcionalidade de provisioning será implementada em breve');
  };

  const handleViewAnalytics = () => {
    toast.info('Analytics detalhados serão implementados em breve');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="h-4 w-4 text-zinc-600" />
          Ações Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Primary Actions */}
        <div className="space-y-2">
          <Button 
            size="sm" 
            className="w-full justify-start" 
            onClick={handleApproveAllPending}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Aprovar Pendentes
          </Button>
          
          <Button 
            size="sm" 
            variant="outline" 
            className="w-full justify-start"
            onClick={handleRefreshModules}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar Módulos
          </Button>
        </div>

        {/* Secondary Actions */}
        <div className="pt-2 border-t space-y-2">
          <Button 
            size="sm" 
            variant="ghost" 
            className="w-full justify-start text-xs"
            onClick={handleAddUser}
          >
            <UserPlus className="h-3 w-3 mr-2" />
            Adicionar Usuário
          </Button>
          
          <Button 
            size="sm" 
            variant="ghost" 
            className="w-full justify-start text-xs"
            onClick={handleConfigureModules}
          >
            <Settings className="h-3 w-3 mr-2" />
            Configurar Módulos
          </Button>
          
          <Button 
            size="sm" 
            variant="ghost" 
            className="w-full justify-start text-xs"
            onClick={handleProvisionModules}
          >
            <Package className="h-3 w-3 mr-2" />
            Provisionar Módulos
          </Button>
          
          <Button 
            size="sm" 
            variant="ghost" 
            className="w-full justify-start text-xs"
            onClick={handleViewAnalytics}
          >
            <BarChart3 className="h-3 w-3 mr-2" />
            Ver Analytics
          </Button>
          
          <Button 
            size="sm" 
            variant="ghost" 
            className="w-full justify-start text-xs"
            onClick={handleExportData}
          >
            <Download className="h-3 w-3 mr-2" />
            Exportar Dados
          </Button>
        </div>

        {/* Info */}
        <div className="pt-2 border-t">
          <div className="text-xs text-zinc-500 text-center">
            Organização: {organizationId.slice(-8)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}