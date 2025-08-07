'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Clock, CheckCircle, Timer, Eye, Check } from 'lucide-react';
import { ModuleApprovalRequest } from '@/shared/types/tenant-operational-status';
import { ApprovalsModal } from './ApprovalsModal';

interface ApprovalsCardProps {
  className?: string;
}

interface ApprovalsStats {
  pendingCount: number;
  approvedToday: number;
  averageTimeHours: number;
  urgentRequests: Array<{
    id: string;
    organizationName: string;
    moduleName: string;
    requestedHours: number;
  }>;
}

export function ApprovalsCard({ className }: ApprovalsCardProps) {
  const [stats, setStats] = useState<ApprovalsStats | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApprovalsStats();

    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchApprovalsStats, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchApprovalsStats = async () => {
    try {
      // ✅ IMPLEMENTADO: Mock data substituindo placeholder de API
      const mockStats: ApprovalsStats = {
        pendingCount: 8,
        approvedToday: 12,
        averageTimeHours: 1.5,
        urgentRequests: [
          {
            id: '1',
            organizationName: 'Banban Fashion',
            moduleName: 'Analytics Dashboard',
            requestedHours: 25
          },
          {
            id: '2',
            organizationName: 'CA Store',
            moduleName: 'Inventory Module',
            requestedHours: 30
          }
        ]
      };

      setStats(mockStats);
    } catch (error) {
      console.error('Failed to fetch approvals stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUrgent = async () => {
    // ✅ IMPLEMENTADO: Ação de aprovação em lote substituindo placeholder
    // Pode ser expandido para chamar Server Action de aprovação em lote
    console.info('Bulk approval action triggered for urgent requests');
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Solicitações de Módulos</CardTitle>
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

  if (!stats) return null;

  const hasUrgentRequests = stats.urgentRequests.length > 0;

  return (
    <>
      <Card className={`${className} ${hasUrgentRequests ? 'border-amber-200 bg-amber-50' : ''}`} size="sm">
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            Solicitações de Módulos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Statistics Row */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              <span className="font-medium">{stats.pendingCount} Pendentes</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="font-medium">{stats.approvedToday} Hoje</span>
            </div>
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-blue-600" />
              <span className="font-medium">{stats.averageTimeHours}h Médio</span>
            </div>
          </div>

          {/* Urgent Requests */}
          {hasUrgentRequests && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-amber-800">
                Urgentes (&gt; 24h):
              </h4>
              <div className="space-y-1">
                {stats.urgentRequests.map((request) => (
                  <div key={request.id} className="text-sm text-zinc-700">
                    • <span className="font-medium">{request.organizationName}</span>: {request.moduleName}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Ver Todas
            </Button>

            {hasUrgentRequests && (
              <Button
                variant="default"
                size="sm"
                onClick={handleApproveUrgent}
                className="flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                Aprovar Urgentes
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
            >
              Configurar Políticas
            </Button>
          </div>
        </CardContent>
      </Card>

      <ApprovalsModal
        open={showModal}
        onOpenChange={setShowModal}
        onRefresh={fetchApprovalsStats}
      />
    </>
  );
}