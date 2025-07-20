'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Clock, CheckCircle, AlertTriangle, Package } from 'lucide-react';
import { getOrganizationApprovalsData, OrganizationApprovalsData } from '@/app/actions/admin/organization-approvals';

interface OrganizationApprovalsWidgetProps {
  organizationId: string;
}

export function OrganizationApprovalsWidget({ organizationId }: OrganizationApprovalsWidgetProps) {
  const [approvals, setApprovals] = useState<OrganizationApprovalsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApprovals();
    
    // Auto-refresh every 3 minutes
    const interval = setInterval(fetchApprovals, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, [organizationId]);

  const fetchApprovals = async () => {
    try {
      setError(null);
      const result = await getOrganizationApprovalsData(organizationId);
      
      if (result.success && result.data) {
        setApprovals(result.data);
      } else {
        setError(result.error || 'Erro ao carregar aprovações');
        console.error('Erro ao buscar aprovações:', result.error);
      }
    } catch (error) {
      console.error('Erro inesperado ao buscar aprovações:', error);
      setError('Erro inesperado ao carregar aprovações');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return 'Nenhuma solicitação';
    const hours = Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60));
    if (hours < 1) return 'há alguns minutos';
    if (hours === 1) return 'há 1 hora';
    if (hours < 24) return `há ${hours} horas`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'há 1 dia';
    return `há ${days} dias`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Solicitações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-zinc-200 rounded w-3/4"></div>
            <div className="h-4 bg-zinc-200 rounded w-1/2"></div>
            <div className="h-4 bg-zinc-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Solicitações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={fetchApprovals}
            className="mt-2 w-full"
          >
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!approvals) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Package className="h-4 w-4 text-zinc-600" />
          Solicitações
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-2 bg-amber-50 rounded border border-amber-200">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium">Pendentes</span>
            </div>
            <Badge variant="warning" className="text-xs">
              {approvals.pending}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Aprovadas</span>
            </div>
            <Badge variant="success" className="text-xs">
              {approvals.approved}
            </Badge>
          </div>

          {approvals.denied > 0 && (
            <div className="flex items-center justify-between p-2 bg-red-50 rounded border border-red-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium">Negadas</span>
              </div>
              <Badge variant="destructive" className="text-xs">
                {approvals.denied}
              </Badge>
            </div>
          )}
        </div>

        {/* Last Request */}
        <div className="pt-3 border-t">
          <div className="text-xs text-zinc-500">
            Última solicitação: {formatTimeAgo(approvals.lastRequestDate)}
          </div>
        </div>

        {/* Quick Actions */}
        {approvals.pending > 0 && (
          <div className="pt-2">
            <Button size="sm" className="w-full text-xs">
              Ver Pendentes ({approvals.pending})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}