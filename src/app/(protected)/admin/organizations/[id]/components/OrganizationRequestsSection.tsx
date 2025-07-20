'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  User, 
  Package, 
  MessageSquare,
  GitBranch,
  AlertCircle,
  History
} from 'lucide-react';
import { ModuleApprovalRequest as BaseModuleApprovalRequest } from '@/app/actions/admin/tenant-operational-status';
import { ApprovalModal } from '../../components/ApprovalModal';
import { getOrganizationApprovalRequests } from '@/app/actions/admin/tenant-operational-status';

// Interface estendida para incluir dados enriquecidos
interface ModuleApprovalRequest extends BaseModuleApprovalRequest {
  module?: {
    id: string;
    name: string;
    description: string;
  };
  requester?: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
  reviewer?: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
}
import { useToast } from '@/shared/ui/toast';
import { Chip } from '@/shared/ui/chip';

interface OrganizationRequestsSectionProps {
  organizationId: string;
  className?: string;
}

interface RequestsStats {
  pending: number;
  approved: number;
  denied: number;
  cancelled: number;
}

export function OrganizationRequestsSection({organizationId, 
  className 
}: OrganizationRequestsSectionProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<ModuleApprovalRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ModuleApprovalRequest | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      try {
        const result = await getOrganizationApprovalRequests(organizationId);
        
        if (!result.success) {
          console.error('Erro ao buscar solicitações:', result.error);
          toast.error('Erro ao carregar solicitações de módulos');
          return;
        }

        setRequests(result.data || []);
      } catch (error) {
        console.error('Erro ao buscar solicitações:', error);
        toast.error('Erro ao carregar solicitações de módulos');
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [organizationId]);

  const pendingRequests = requests.filter(req => req.status === 'PENDING');
  const approvedRequests = requests.filter(req => req.status === 'APPROVED');
  const deniedRequests = requests.filter(req => req.status === 'DENIED');

  const handleApprove = (request: ModuleApprovalRequest) => {
    setSelectedRequest(request);
    setShowApprovalModal(true);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Solicitações de Módulos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4">
            <span className="text-muted-foreground">Carregando solicitações...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Solicitações de Módulos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pendentes
                {pendingRequests.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {pendingRequests.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Aprovadas
                {approvedRequests.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {approvedRequests.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="denied" className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Negadas
                {deniedRequests.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {deniedRequests.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-4">
              {pendingRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-lg font-medium">Nenhuma solicitação pendente</p>
                  <p className="text-sm text-muted-foreground">
                    Não há solicitações de módulos aguardando aprovação.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-start justify-between rounded-lg border p-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          <span className="font-medium">{request.module?.name}</span>
                          <Badge variant="secondary">Pendente</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>{request.requester?.first_name} {request.requester?.last_name}</span>
                        </div>
                        {request.request_reason && (
                          <div className="flex items-start gap-2 text-sm text-muted-foreground">
                            <MessageSquare className="h-4 w-4 mt-0.5" />
                            <span>{request.request_reason}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <History className="h-3 w-3" />
                          <span>
                            Solicitado em{' '}
                            {new Date(request.created_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="ml-4"
                        onClick={() => handleApprove(request)}
                      >
                        Revisar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="approved" className="mt-4">
              {approvedRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <CheckCircle className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-lg font-medium">Nenhuma solicitação aprovada</p>
                  <p className="text-sm text-muted-foreground">
                    Não há solicitações de módulos aprovadas recentemente.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {approvedRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-start justify-between rounded-lg border p-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          <span className="font-medium">{request.module?.name}</span>
                          <Badge variant="success">Aprovada</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>{request.requester?.first_name} {request.requester?.last_name}</span>
                        </div>
                        {request.review_notes && (
                          <div className="flex items-start gap-2 text-sm text-muted-foreground">
                            <MessageSquare className="h-4 w-4 mt-0.5" />
                            <span>{request.review_notes}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <History className="h-3 w-3" />
                          <span>
                            Aprovada em{' '}
                            {request.reviewed_at && new Date(request.reviewed_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="denied" className="mt-4">
              {deniedRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <XCircle className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-lg font-medium">Nenhuma solicitação negada</p>
                  <p className="text-sm text-muted-foreground">
                    Não há solicitações de módulos negadas recentemente.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {deniedRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-start justify-between rounded-lg border p-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          <span className="font-medium">{request.module?.name}</span>
                          <Badge variant="destructive">Negada</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>{request.requester?.first_name} {request.requester?.last_name}</span>
                        </div>
                        {request.review_notes && (
                          <div className="flex items-start gap-2 text-sm text-muted-foreground">
                            <MessageSquare className="h-4 w-4 mt-0.5" />
                            <span>{request.review_notes}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <History className="h-3 w-3" />
                          <span>
                            Negada em{' '}
                            {request.reviewed_at && new Date(request.reviewed_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {selectedRequest && (
      <ApprovalModal
          open={showApprovalModal}
          onOpenChange={setShowApprovalModal}
          request={{
            ...selectedRequest,
            request_metadata: selectedRequest.request_metadata || {}
          } as any}
          onApproved={() => {
            // Recarregar dados após aprovação
            const fetchRequests = async () => {
              const result = await getOrganizationApprovalRequests(organizationId);
              if (result.success && result.data) {
                setRequests(result.data as ModuleApprovalRequest[]);
              }
            };
            fetchRequests();
          }}
      />
      )}
    </>
  );
}