import * as React from "react";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { DownloadIcon, CheckCircleIcon, ClockIcon, AlertTriangleIcon } from "lucide-react";
import { DataExportFormat, requestDataExport } from "@/app/actions/auth/account-management";
import { useToast } from '@/shared/ui/toast';
import { Badge } from "@/shared/ui/badge";
import { getUserDataExports, UserDataExport } from "@/app/actions/auth/account-status";
import { SkeletonDataExport } from "@/shared/ui/skeleton-loader";

interface ExportacaoDadosProps {
  formatoExportacao: string;
  setFormatoExportacao: (value: string) => void;
}

const formatDate = (dateString: string) => {
  const { toast } = useToast();

  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};


export function ExportacaoDados({ formatoExportacao, setFormatoExportacao }: ExportacaoDadosProps) {
  // Estados para exportaÃ§Ã£o de dados
  const [isExporting, setIsExporting] = React.useState(false);
  const [exportFormat, setExportFormat] = React.useState<DataExportFormat>('json');
  const [userExports, setUserExports] = React.useState<UserDataExport[]>([]);
  const [loadingExports, setLoadingExports] = React.useState(true);

  // Carregar dados ao montar o componente
  React.useEffect(() => {
    loadUserExports();
    setLoadingExports(false);
  }, []);

  // Carregar exportaÃ§Ãµes de dados
  const loadUserExports = async () => {
    try {
        setLoadingExports(true);
        const result = await getUserDataExports();
        if (result.success && Array.isArray(result.data)) {
            setUserExports(result.data as UserDataExport[]);
        } else if (result.error) {
            toast.error(result.error, {
                title: "Erro ao carregar exportaÃ§Ãµes",
            });
        }
    } catch (error) {
        toast.error("Erro ao carregar exportaÃ§Ãµes de dados.");
    } finally {
        setLoadingExports(false);
    }
  };

  // FunÃ§Ã£o para exibir o status da exportaÃ§Ã£o
  const getExportStatusBadge = (status: UserDataExport['status']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800 hover:text-gray-50"><CheckCircleIcon className="w-3 h-3 mr-1" />Pronto</Badge>;
      case 'processing':
        return <Badge variant="secondary"><ClockIcon className="w-3 h-3 mr-1" />Processando</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertTriangleIcon className="w-3 h-3 mr-1" />Falhou</Badge>;
      case 'expired':
        return <Badge variant="outline">Expirado</Badge>;
      default:
        return <Badge variant="outline"><ClockIcon className="w-3 h-3 mr-1" />Solicitado</Badge>;
    }
  };

  // FunÃ§Ã£o para solicitar a exportaÃ§Ã£o de dados
  const handleExportarDados = async () => {
    try {
      setIsExporting(true);
      const result = await requestDataExport(exportFormat);
  
      if (result.success) {
        toast.success('VocÃª receberÃ¡ um email quando os dados estiverem prontos para download.', {
          title: "ExportaÃ§Ã£o solicitada com sucesso",
        });
        await loadUserExports(); // Recarregar lista
      } else {
        toast.error(result.error || 'Erro ao solicitar exportaÃ§Ã£o.', {
          title: "Erro ao solicitar exportaÃ§Ã£o",
        });
      }
    } catch (error) {
      toast.error("Erro inesperado ao solicitar exportaÃ§Ã£o.", {
        title: "Erro inesperado",
      });
    } finally {
      setIsExporting(false);
    }
  }  
  
  return (
    <Card className="shadow-none">
      <CardContent className="p-6 space-y-4">
        {/* Exportar Dados */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Exportar Meus Dados</h4>
              <p className="text-xs text-muted-foreground">
                FaÃ§a o download de suas informaÃ§Ãµes pessoais e histÃ³rico de atividades.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={formatoExportacao} onValueChange={(value: DataExportFormat) => setFormatoExportacao(value)}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportarDados}
                disabled={isExporting}
                className="gap-2"
              >
                <DownloadIcon className="w-4 h-4" />
                {isExporting ? 'Solicitando...' : 'Exportar'}
              </Button>
            </div>
          </div>
          {/* Lista de ExportaÃ§Ãµes */}
          {!loadingExports && userExports.length > 0 ? (
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-muted-foreground">ExportaÃ§Ãµes Recentes</h5>
              {userExports.slice(0, 3).map((exportItem) => (
                <div key={exportItem.id} className="flex items-center justify-between p-2 text-sm border rounded bg-muted/30">
                  <div className="flex items-center gap-2">
                    <span className="font-medium uppercase">{exportItem.format}</span>
                    <span className="text-muted-foreground">{formatDate(exportItem.created_at)}</span>
                    {getExportStatusBadge(exportItem.status)}
                  </div>
                  {exportItem.status === 'completed' && exportItem.download_token && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        window.open(`/api/download/data-export/${exportItem.download_token}`, '_blank');
                        toast.info("O download do arquivo foi iniciado.", {
                          title: "Download iniciado",
                        });
                      }}
                    >
                      <DownloadIcon className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <SkeletonDataExport />
          )}
        </div>
      </CardContent>
    </Card>
  );
} 
