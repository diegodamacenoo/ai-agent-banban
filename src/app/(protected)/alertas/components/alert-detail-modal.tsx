'use client';

import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Eye, 
  History, 
  CheckCircle, 
  XCircle, 
  Clock,
  Package,
  MapPin,
  DollarSign,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getAlertDetails, updateAlertStatus, AlertType, AlertStatus } from '@/app/actions/alerts/alert-management';

interface AlertDetailModalProps {
  alertId: string;
  alertType: AlertType;
  children: React.ReactNode;
}

interface AlertDetail {
  alert: any;
  history: any[];
}

export function AlertDetailModal({ alertId, alertType, children }: AlertDetailModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<AlertDetail | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [notes, setNotes] = useState('');

  // Carregar detalhes quando o modal abre
  useEffect(() => {
    if (open && !details) {
      loadDetails();
    }
  }, [open]);

  const loadDetails = async () => {
    setLoading(true);
    try {
      const result = await getAlertDetails(alertId, alertType);
      if (result.success) {
        setDetails(result.data as AlertDetail);
      } else {
        toast({
          title: 'Erro ao carregar detalhes',
          description: result.error,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Erro inesperado',
        description: 'Falha ao carregar detalhes do alerta',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (status: AlertStatus) => {
    if (!details) return;

    setActionLoading(true);
    try {
      const result = await updateAlertStatus({
        alertId,
        alertType,
        status,
        notes: notes.trim() || undefined
      });

      if (result.success) {
        toast({
          title: 'Sucesso',
          description: result.message
        });
        
        // Atualizar status local
        setDetails(prev => prev ? {
          ...prev,
          alert: { ...prev.alert, status, resolution_notes: notes.trim() }
        } : null);
        
        setNotes('');
      } else {
        toast({
          title: 'Erro',
          description: result.error,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Erro inesperado',
        description: 'Falha ao atualizar alerta',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getAlertTypeLabel = (type: AlertType) => {
    const labels = {
      stagnant: 'Produto Parado',
      replenishment: 'Reposição',
      divergence: 'Divergência',
      margin: 'Margem',
      returns: 'Devolução',
      redistribution: 'Redistribuição'
    };
    return labels[type];
  };

  const getStatusBadge = (status: AlertStatus) => {
    const variants = {
      open: 'destructive' as const,
      resolved: 'default' as const,
      ignored: 'secondary' as const
    };
    
    const labels = {
      open: 'Aberto',
      resolved: 'Resolvido',
      ignored: 'Ignorado'
    };

    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const renderAlertSpecificInfo = () => {
    if (!details) return null;

    const { alert } = details;

    switch (alertType) {
      case 'stagnant':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Dias sem movimento</p>
              <p className="text-2xl font-bold text-orange-600">{alert.days_without_movement}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Estoque atual</p>
              <p className="text-2xl font-bold">{alert.current_stock}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Último movimento</p>
              <p className="text-sm text-muted-foreground">
                {alert.last_movement_date ? 
                  new Date(alert.last_movement_date).toLocaleDateString('pt-BR') : 
                  'Nenhum registro'
                }
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Ação sugerida</p>
              <Badge variant="outline">
                {alert.suggested_action === 'promotion' ? 'Promoção' :
                 alert.suggested_action === 'transfer' ? 'Transferência' : 'Liquidação'}
              </Badge>
            </div>
          </div>
        );

      case 'replenishment':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Cobertura atual</p>
              <p className="text-2xl font-bold text-red-600">{alert.coverage_days} dias</p>
            </div>
            <div>
              <p className="text-sm font-medium">Estoque atual</p>
              <p className="text-2xl font-bold">{alert.current_stock}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Venda diária média</p>
              <p className="text-sm">{alert.avg_daily_sales} unidades</p>
            </div>
            <div>
              <p className="text-sm font-medium">Quantidade sugerida</p>
              <p className="text-sm font-bold text-green-600">{alert.suggested_qty} unidades</p>
            </div>
          </div>
        );

      case 'margin':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Margem atual</p>
              <p className="text-2xl font-bold text-red-600">{alert.current_margin_pct}%</p>
            </div>
            <div>
              <p className="text-sm font-medium">Margem mínima</p>
              <p className="text-2xl font-bold">{alert.min_acceptable_margin_pct}%</p>
            </div>
            <div>
              <p className="text-sm font-medium">Preço atual</p>
              <p className="text-sm">R$ {alert.current_price}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Preço sugerido</p>
              <p className="text-sm font-bold text-green-600">R$ {alert.suggested_price}</p>
            </div>
          </div>
        );

      case 'returns':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Devoluções última semana</p>
              <p className="text-2xl font-bold text-red-600">{alert.returns_last_7_days}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Devoluções semana anterior</p>
              <p className="text-2xl font-bold">{alert.returns_previous_7_days}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Aumento percentual</p>
              <p className="text-sm font-bold text-orange-600">+{alert.increase_percentage.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-sm font-medium">Valor total devoluções</p>
              <p className="text-sm font-bold text-red-600">R$ {alert.total_return_value.toFixed(2)}</p>
            </div>
            {alert.avg_return_reason && (
              <div className="col-span-2">
                <p className="text-sm font-medium">Principal motivo</p>
                <Badge variant="outline" className="mt-1">
                  {alert.avg_return_reason}
                </Badge>
              </div>
            )}
          </div>
        );

      case 'redistribution':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Quantidade sugerida</p>
              <p className="text-2xl font-bold text-blue-600">{alert.suggested_transfer_qty} unidades</p>
            </div>
            <div>
              <p className="text-sm font-medium">Score de prioridade</p>
              <p className="text-2xl font-bold">{alert.priority_score.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Estoque origem</p>
              <p className="text-sm">{alert.source_stock} unidades</p>
            </div>
            <div>
              <p className="text-sm font-medium">Demanda destino</p>
              <p className="text-sm">{alert.target_demand_forecast} unidades</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm font-medium">Ganho estimado</p>
              <p className="text-lg font-bold text-green-600">+R$ {alert.estimated_revenue_gain.toFixed(2)}</p>
            </div>
          </div>
        );

      case 'divergence':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Quantidade esperada</p>
              <p className="text-2xl font-bold">{alert.expected_qty}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Quantidade contada</p>
              <p className="text-2xl font-bold text-orange-600">{alert.scanned_qty}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Diferença</p>
              <p className="text-sm font-bold text-red-600">{alert.difference_qty > 0 ? '+' : ''}{alert.difference_qty} un</p>
            </div>
            <div>
              <p className="text-sm font-medium">Diferença percentual</p>
              <p className="text-sm font-bold text-red-600">{alert.difference_percentage.toFixed(1)}%</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm font-medium">Impacto financeiro</p>
              <p className="text-lg font-bold text-red-600">
                R$ {Math.abs(alert.total_value_impact).toFixed(2)}
                {alert.total_value_impact < 0 ? ' (perda)' : ' (ganho)'}
              </p>
            </div>
            {alert.severity_level && (
              <div className="col-span-2">
                <p className="text-sm font-medium">Nível de severidade</p>
                <Badge variant={
                  alert.severity_level === 'high' ? 'destructive' :
                  alert.severity_level === 'medium' ? 'secondary' : 'outline'
                } className={`mt-1 ${
                  alert.severity_level === 'low' ? '!bg-slate-200 !text-slate-800 border-slate-300' : ''
                }`}>
                  {alert.severity_level === 'high' ? 'Alto' :
                   alert.severity_level === 'medium' ? 'Médio' : 'Baixo'}
                </Badge>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Detalhes específicos não disponíveis para este tipo de alerta.
            </p>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Detalhes do Alerta - {getAlertTypeLabel(alertType)}
          </DialogTitle>
          <DialogDescription>
            Informações detalhadas e histórico do alerta
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : details ? (
          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-6">
              
              {/* Informações gerais */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Informações Gerais
                    </span>
                    {getStatusBadge(details.alert.status)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Produto</p>
                      <p className="font-semibold">
                        {details.alert.core_product_variants?.core_products?.product_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {details.alert.core_product_variants?.size} - {details.alert.core_product_variants?.color}
                      </p>
                    </div>
                                         <div>
                       <p className="text-sm font-medium">
                         {alertType === 'redistribution' ? 'Locais' : 'Local'}
                       </p>
                       {alertType === 'redistribution' ? (
                         <div className="space-y-1">
                           <p className="font-semibold flex items-center gap-1">
                             <MapPin className="w-4 h-4" />
                             De: {details.alert.source_location?.location_name || 'N/A'}
                           </p>
                           <p className="font-semibold flex items-center gap-1">
                             <MapPin className="w-4 h-4" />
                             Para: {details.alert.target_location?.location_name || 'N/A'}
                           </p>
                         </div>
                       ) : (
                         <p className="font-semibold flex items-center gap-1">
                           <MapPin className="w-4 h-4" />
                           {details.alert.core_locations?.location_name || 'N/A'}
                         </p>
                       )}
                     </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Informações específicas do tipo de alerta */}
                  {renderAlertSpecificInfo()}
                </CardContent>
              </Card>

              {/* Ações do alerta */}
              {details.alert.status === 'open' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Ações</CardTitle>
                    <CardDescription>
                      Marque como resolvido ou ignore este alerta
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      placeholder="Adicione uma observação sobre a resolução (opcional)"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="min-h-[80px]"
                    />
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleAction('resolved')}
                        disabled={actionLoading}
                        className="flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Marcar como Resolvido
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => handleAction('ignored')}
                        disabled={actionLoading}
                        className="flex items-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Ignorar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Histórico */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Histórico do Produto
                  </CardTitle>
                  <CardDescription>
                    Últimos alertas para este produto
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {details.history.length > 0 ? (
                    <div className="space-y-3">
                      {details.history.map((item: any, index: number) => (
                        <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                          <div className="flex-shrink-0 mt-1">
                            {item.status === 'resolved' ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : item.status === 'ignored' ? (
                              <XCircle className="w-4 h-4 text-gray-600" />
                            ) : (
                              <Clock className="w-4 h-4 text-orange-600" />
                            )}
                          </div>
                          <div className="flex-grow">
                            <div className="flex items-center justify-between">
                              <p className="font-medium">
                                {getAlertTypeLabel(item.alert_type)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(item.created_at).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                            {item.resolution_notes && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {item.resolution_notes}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum histórico disponível para este produto.
                    </p>
                  )}
                </CardContent>
              </Card>

            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Falha ao carregar detalhes</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 