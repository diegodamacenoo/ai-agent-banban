'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/shared/ui/dropdown-menu';
import { Card, CardContent, CardHeader } from '@/shared/ui/card';
import { Checkbox } from '@/shared/ui/checkbox';
import { 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Package, 
  MessageSquare,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { ModuleApprovalRequest } from '@/shared/types/tenant-operational-status';
import { ApprovalModal } from './ApprovalModal';

interface ApprovalsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => void;
}

export function ApprovalsModal({ open, onOpenChange, onRefresh }: ApprovalsModalProps) {
  const [requests, setRequests] = useState<ModuleApprovalRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ModuleApprovalRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [organizationFilter, setOrganizationFilter] = useState<string>('all');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [ageFilter, setAgeFilter] = useState<string>('all');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ModuleApprovalRequest | null>(null);

  useEffect(() => {
    if (open) {
      fetchRequests();
    }
  }, [open]);

  useEffect(() => {
    filterRequests();
  }, [requests, searchTerm, organizationFilter, moduleFilter, ageFilter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      const mockRequests: ModuleApprovalRequest[] = [
        {
          id: '1',
          organization_id: 'org1',
          module_id: 'analytics',
          requested_by: 'user1',
          request_reason: 'Precisamos de analytics detalhados para análise de vendas Q4',
          request_metadata: { priority: 'high', tenant_type: 'ENTERPRISE' },
          status: 'PENDING',
          created_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), // 25 hours ago
          updated_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
          module: {
            id: 'analytics',
            module_id: 'analytics',
            slug: 'analytics-dashboard',
            name: 'Analytics Dashboard',
            description: 'Dashboard de analytics avançado',
            maturity: 'BETA',
            status: 'ACTIVE',
            default_visibility: 'PUBLIC',
            request_policy: 'MANUAL_APPROVAL',
            auto_enable_policy: 'NONE',
            created_at: '',
            updated_at: ''
          },
          requester: {
            id: 'user1',
            email: 'joao.silva@banban.com',
            first_name: 'João',
            last_name: 'Silva'
          }
        },
        {
          id: '2',
          organization_id: 'org2',
          module_id: 'inventory',
          requested_by: 'user2',
          request_reason: 'Necessário para controle de estoque da nova loja',
          request_metadata: { priority: 'medium', tenant_type: 'STANDARD' },
          status: 'PENDING',
          created_at: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(), // 30 hours ago
          updated_at: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
          module: {
            id: 'inventory',
            module_id: 'inventory',
            slug: 'inventory-module',
            name: 'Inventory Module',
            description: 'Módulo de gestão de inventário',
            maturity: 'GA',
            status: 'ACTIVE',
            default_visibility: 'PUBLIC',
            request_policy: 'MANUAL_APPROVAL',
            auto_enable_policy: 'NEW_TENANTS',
            created_at: '',
            updated_at: ''
          },
          requester: {
            id: 'user2',
            email: 'maria.santos@castore.com',
            first_name: 'Maria',
            last_name: 'Santos'
          }
        }
      ];
      
      setRequests(mockRequests);
    } catch (error) {
      console.error('Failed to fetch approval requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = [...requests];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(req => 
        req.module?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.requester?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.requester?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.request_reason?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Age filter
    if (ageFilter !== 'all') {
      const now = Date.now();
      filtered = filtered.filter(req => {
        const hoursOld = (now - new Date(req.created_at).getTime()) / (1000 * 60 * 60);
        switch (ageFilter) {
          case 'urgent': return hoursOld > 24;
          case 'recent': return hoursOld <= 24;
          case 'old': return hoursOld > 72;
          default: return true;
        }
      });
    }

    setFilteredRequests(filtered);
  };

  const getRequestAge = (createdAt: string) => {
    const hours = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60));
    if (hours < 1) return 'há alguns minutos';
    if (hours === 1) return 'há 1 hora';
    if (hours < 24) return `há ${hours} horas`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'há 1 dia';
    return `há ${days} dias`;
  };

  const getPriorityBadge = (request: ModuleApprovalRequest) => {
    const hoursOld = (Date.now() - new Date(request.created_at).getTime()) / (1000 * 60 * 60);
    const isUrgent = hoursOld > 24;
    const isEnterprise = request.request_metadata?.tenant_type === 'ENTERPRISE';
    
    if (isUrgent) {
      return <Badge variant="destructive">Urgente</Badge>;
    }
    if (isEnterprise) {
      return <Badge variant="secondary">Enterprise</Badge>;
    }
    return <Badge variant="outline">Normal</Badge>;
  };

  const handleApprove = (request: ModuleApprovalRequest) => {
    setSelectedRequest(request);
    setShowApprovalModal(true);
  };

  const handleBulkAction = async (action: 'approve' | 'deny') => {
    // TODO: Implement bulk actions
    console.debug(`Bulk ${action} for requests:`, selectedRequests);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Todas as Solicitações Pendentes</DialogTitle>
          </DialogHeader>

          {/* Filters */}
          <div className="flex gap-4 p-4 border-b bg-zinc-50">
            <div className="flex-1">
              <Input
                placeholder="Buscar por módulo, solicitante ou motivo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Idade: {ageFilter === 'all' ? 'Todas' : ageFilter}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setAgeFilter('all')}>
                  Todas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setAgeFilter('urgent')}>
                  Urgentes (&gt; 24h)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setAgeFilter('recent')}>
                  Recentes (&lt; 24h)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setAgeFilter('old')}>
                  Antigas (&gt; 72h)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Carregando solicitações...</span>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-8 text-zinc-500">
                <Clock className="h-12 w-12 mx-auto mb-4 text-zinc-300" />
                <p>Nenhuma solicitação encontrada</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRequests.map((request) => (
                  <Card key={request.id} className="border-l-4 border-l-amber-400">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedRequests.includes(request.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedRequests([...selectedRequests, request.id]);
                              } else {
                                setSelectedRequests(selectedRequests.filter(id => id !== request.id));
                              }
                            }}
                          />
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <User className="h-4 w-4 text-zinc-500" />
                              <span className="font-medium">
                                {request.requester?.first_name} {request.requester?.last_name}
                              </span>
                              <span className="text-sm text-zinc-500">
                                {getRequestAge(request.created_at)}
                              </span>
                              {getPriorityBadge(request)}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-zinc-600">
                              <Package className="h-4 w-4" />
                              <span className="font-medium">{request.module?.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {request.module?.maturity}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      {request.request_reason && (
                        <div className="flex items-start gap-2 mb-4">
                          <MessageSquare className="h-4 w-4 text-zinc-500 mt-0.5" />
                          <p className="text-sm text-zinc-700 italic">
                            "{request.request_reason}"
                          </p>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(request)}
                          className="flex items-center gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex items-center gap-2"
                        >
                          <XCircle className="h-4 w-4" />
                          Negar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                        >
                          Ver Detalhes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t bg-zinc-50">
            <div className="text-sm text-zinc-600">
              {filteredRequests.length} solicitação(ões) encontrada(s)
              {selectedRequests.length > 0 && (
                <span className="ml-2">
                  • {selectedRequests.length} selecionada(s)
                </span>
              )}
            </div>
            
            <div className="flex gap-2">
              {selectedRequests.length > 0 && (
                <>
                  <Button
                    size="sm"
                    onClick={() => handleBulkAction('approve')}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Aprovar Selecionadas
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleBulkAction('deny')}
                    className="flex items-center gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    Negar Selecionadas
                  </Button>
                </>
              )}
              
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {selectedRequest && (
        <ApprovalModal
          open={showApprovalModal}
          onOpenChange={setShowApprovalModal}
          request={selectedRequest}
          onApproved={() => {
            onRefresh();
            fetchRequests();
          }}
        />
      )}
    </>
  );
}