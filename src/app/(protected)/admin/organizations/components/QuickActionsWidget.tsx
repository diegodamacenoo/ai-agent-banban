'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { 
  CheckCircle, 
  GitBranch, 
  FileText, 
  Settings, 
  Download,
  Zap 
} from 'lucide-react';
import { useToast } from '@/shared/ui/toast';

export function QuickActionsWidget() {
  const { toast } = useToast();

  const handleApproveAllGA = async () => {
    toast.info('Iniciando aprovação automática de módulos GA...');
    // TODO: Implement bulk approval for GA modules
  };

  const handleCheckDependencies = async () => {
    toast.info('Verificando dependências de módulos...');
    // TODO: Implement dependency check
  };

  const handleGenerateReport = async () => {
    toast.info('Gerando relatório de aprovações...');
    // TODO: Implement report generation
  };

  const handleOpenPolicies = () => {
    toast.info('Abrindo configurações de políticas...');
    // TODO: Navigate to policies page
  };

  const handleBulkProvisioning = () => {
    toast.info('Iniciando provisioning em lote...');
    // TODO: Implement bulk provisioning
  };

  const handleExportData = () => {
    toast.info('Exportando dados de aprovações...');
    // TODO: Implement data export
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
            onClick={handleApproveAllGA}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Aprovar Todas GA
          </Button>
          
          <Button 
            size="sm" 
            variant="outline" 
            className="w-full justify-start"
            onClick={handleCheckDependencies}
          >
            <GitBranch className="h-4 w-4 mr-2" />
            Verificar Dependências
          </Button>
        </div>

        {/* Secondary Actions */}
        <div className="pt-2 border-t space-y-2">
          <Button 
            size="sm" 
            variant="ghost" 
            className="w-full justify-start text-xs"
            onClick={handleGenerateReport}
          >
            <FileText className="h-3 w-3 mr-2" />
            Relatório de Aprovações
          </Button>
          
          <Button 
            size="sm" 
            variant="ghost" 
            className="w-full justify-start text-xs"
            onClick={handleOpenPolicies}
          >
            <Settings className="h-3 w-3 mr-2" />
            Configurar Políticas
          </Button>
          
          <Button 
            size="sm" 
            variant="ghost" 
            className="w-full justify-start text-xs"
            onClick={handleBulkProvisioning}
          >
            <Zap className="h-3 w-3 mr-2" />
            Provisioning em Lote
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
            Última atualização: há 2 min
          </div>
        </div>
      </CardContent>
    </Card>
  );
}