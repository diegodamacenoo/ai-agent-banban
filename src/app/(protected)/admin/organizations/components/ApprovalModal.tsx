'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Textarea } from '@/shared/ui/textarea';
import { Checkbox } from '@/shared/ui/checkbox';
import { Badge } from '@/shared/ui/badge';
import { 
  Building2, 
  Package, 
  User, 
  Calendar, 
  MessageSquare, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { ModuleApprovalRequest } from '@/shared/types/tenant-operational-status';
import { useToast } from '@/shared/ui/toast';

interface ApprovalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: ModuleApprovalRequest;
  onApproved: () => void;
}

export function ApprovalModal({open, onOpenChange, request, onApproved }: ApprovalModalProps) {
  const { toast } = useToast();
  const [reviewNotes, setReviewNotes] = useState('');
  const [autoStartProvisioning, setAutoStartProvisioning] = useState(true);
  const [notifyRequester, setNotifyRequester] = useState(true);
  const [scheduleOutsideHours, setScheduleOutsideHours] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationResults, setValidationResults] = useState<{
    dependencies: boolean;
    tenantPolicy: boolean;
    billingLimits: boolean;
    conflicts: string[];
  } | null>(null);

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      toast.success('Solicitação aprovada com sucesso');
      onApproved();
      onOpenChange(false);
    } catch (error) {
      toast.error('Erro ao aprovar solicitação');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeny = async () => {
    if (!reviewNotes.trim()) {
      toast.error('Observações são obrigatórias para negação');
      return;
    }

    setIsProcessing(true);
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      
      toast.success('Solicitação negada');
      onApproved();
      onOpenChange(false);
    } catch (error) {
      toast.error('Erro ao negar solicitação');
    } finally {
      setIsProcessing(false);
    }
  };

  const runValidations = async () => {
    // TODO: Implement actual validations
    const results = {
      dependencies: true,
      tenantPolicy: true,
      billingLimits: true,
      conflicts: [] as string[]
    };

    // Simulate some validation logic
    if (request.module?.maturity === 'ALPHA') {
      results.conflicts.push('Módulo em fase ALPHA pode ter instabilidades');
    }

    setValidationResults(results);
  };

  useEffect(() => {
    if (open) {
      runValidations();
    }
  }, [open]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getTenantTypeBadge = () => {
    const tenantType = request.request_metadata?.tenant_type;
    switch (tenantType) {
      case 'ENTERPRISE':
        return <Badge variant="secondary">Enterprise</Badge>;
      case 'BETA_TESTER':
        return <Badge variant="outline">Beta Tester</Badge>;
      case 'INTERNAL_TESTER':
        return <Badge variant="outline">Internal Tester</Badge>;
      default:
        return <Badge variant="outline">Standard</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Aprovar Solicitação: {request.module?.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Request Summary */}
          <div className="space-y-4 p-4 bg-zinc-50 rounded-lg">
            <h3 className="font-medium text-zinc-900">Resumo da Solicitação</h3>
            
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-zinc-500" />
                <span className="font-medium">Organização:</span>
                <span>Organização #{request.organization_id}</span>
                {getTenantTypeBadge()}
              </div>
              
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-zinc-500" />
                <span className="font-medium">Módulo:</span>
                <span>{request.module?.name}</span>
                <Badge variant="outline">{request.module?.maturity}</Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-zinc-500" />
                <span className="font-medium">Solicitante:</span>
                <span>
                  {request.requester?.first_name} {request.requester?.last_name}
                </span>
                <span className="text-zinc-500">({request.requester?.email})</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-zinc-500" />
                <span className="font-medium">Data da Solicitação:</span>
                <span>{formatDate(request.created_at)}</span>
              </div>
              
              {request.request_reason && (
                <div className="flex items-start gap-2">
                  <MessageSquare className="h-4 w-4 text-zinc-500 mt-0.5" />
                  <span className="font-medium">Motivo:</span>
                  <span className="italic">"{request.request_reason}"</span>
                </div>
              )}
            </div>
          </div>

          {/* Validation Results */}
          {validationResults && (
            <div className="space-y-3">
              <h3 className="font-medium text-zinc-900">Validações</h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Dependências do módulo: OK</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Política de tenant: Compatível</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Limites de billing: Dentro do limite</span>
                </div>
              </div>

              {validationResults.conflicts.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-amber-700">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Alertas:</span>
                  </div>
                  <ul className="list-disc list-inside text-sm text-amber-700 ml-6">
                    {validationResults.conflicts.map((conflict, index) => (
                      <li key={index}>{conflict}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Review Notes */}
          <div className="space-y-3">
            <label className="font-medium text-zinc-900">
              Observações da Revisão (opcional)
            </label>
            <Textarea
              placeholder="Adicione observações sobre esta aprovação..."
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Post-Approval Options */}
          <div className="space-y-3">
            <h3 className="font-medium text-zinc-900">Ações Pós-Aprovação</h3>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="auto-provisioning"
                  checked={autoStartProvisioning}
                  onCheckedChange={(checked) => setAutoStartProvisioning(checked === true)}
                />
                <label htmlFor="auto-provisioning" className="text-sm">
                  Iniciar provisioning automaticamente
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notify-requester"
                  checked={notifyRequester}
                  onCheckedChange={(checked) => setNotifyRequester(checked === true)}
                />
                <label htmlFor="notify-requester" className="text-sm">
                  Notificar solicitante por email
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="schedule-outside"
                  checked={scheduleOutsideHours}
                  onCheckedChange={(checked) => setScheduleOutsideHours(checked === true)}
                />
                <label htmlFor="schedule-outside" className="text-sm">
                  Agendar para fora do horário comercial
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            
            <Button
              variant="destructive"
              onClick={handleDeny}
              disabled={isProcessing}
              className="flex items-center gap-2"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              Negar
            </Button>
            
            <Button
              onClick={handleApprove}
              disabled={isProcessing}
              className="flex items-center gap-2"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Aprovar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}