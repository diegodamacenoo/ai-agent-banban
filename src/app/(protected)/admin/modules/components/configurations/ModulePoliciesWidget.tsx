'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Shield, Eye, EyeOff, Lock, UserCheck, Settings, AlertTriangle } from 'lucide-react';

interface PolicySummary {
  visibility: 'PUBLIC' | 'PRIVATE' | 'RESTRICTED';
  requestPolicy: 'AUTO_APPROVE' | 'MANUAL_APPROVAL' | 'DISABLED';
  autoEnablePolicy: 'ALL_TENANTS' | 'NEW_TENANTS' | 'NONE';
  pendingRequests: number;
  pendingPolicyChanges: number;
  lastPolicyUpdate: string;
}

interface ModulePoliciesWidgetProps {
  moduleId: string;
}

export function ModulePoliciesWidget({ moduleId }: ModulePoliciesWidgetProps) {
  const [policies, setPolicies] = useState<PolicySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPolicySummary();
    
    // Auto-refresh every 3 minutes
    const interval = setInterval(fetchPolicySummary, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, [moduleId]);

  const fetchPolicySummary = async () => {
    try {
      // TODO: Replace with actual API call
      const mockPolicies: PolicySummary = {
        visibility: 'PUBLIC',
        requestPolicy: 'MANUAL_APPROVAL',
        autoEnablePolicy: 'NEW_TENANTS',
        pendingRequests: 3,
        pendingPolicyChanges: 1,
        lastPolicyUpdate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      };
      
      setPolicies(mockPolicies);
    } catch (error) {
      console.error('Failed to fetch policy summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVisibilityInfo = (visibility: PolicySummary['visibility']) => {
    switch (visibility) {
      case 'PUBLIC':
        return {
          icon: <Eye className="h-3 w-3 text-green-600" />,
          label: 'Público',
          variant: 'success' as const,
          description: 'Visível para todos'
        };
      case 'PRIVATE':
        return {
          icon: <EyeOff className="h-3 w-3 text-red-600" />,
          label: 'Privado',
          variant: 'destructive' as const,
          description: 'Não visível'
        };
      case 'RESTRICTED':
        return {
          icon: <Lock className="h-3 w-3 text-amber-600" />,
          label: 'Restrito',
          variant: 'warning' as const,
          description: 'Acesso limitado'
        };
      default:
        return {
          icon: <Shield className="h-3 w-3 text-zinc-500" />,
          label: 'Desconhecido',
          variant: 'outline' as const,
          description: ''
        };
    }
  };

  const getRequestPolicyInfo = (policy: PolicySummary['requestPolicy']) => {
    switch (policy) {
      case 'AUTO_APPROVE':
        return {
          icon: <UserCheck className="h-3 w-3 text-green-600" />,
          label: 'Auto',
          variant: 'success' as const
        };
      case 'MANUAL_APPROVAL':
        return {
          icon: <AlertTriangle className="h-3 w-3 text-amber-600" />,
          label: 'Manual',
          variant: 'warning' as const
        };
      case 'DISABLED':
        return {
          icon: <Shield className="h-3 w-3 text-red-600" />,
          label: 'Desabilitado',
          variant: 'destructive' as const
        };
      default:
        return {
          icon: <Shield className="h-3 w-3 text-zinc-500" />,
          label: 'Desconhecido',
          variant: 'outline' as const
        };
    }
  };

  const getAutoEnableInfo = (policy: PolicySummary['autoEnablePolicy']) => {
    switch (policy) {
      case 'ALL_TENANTS':
        return { label: 'Todos', variant: 'success' as const };
      case 'NEW_TENANTS':
        return { label: 'Novos', variant: 'secondary' as const };
      case 'NONE':
        return { label: 'Nenhum', variant: 'outline' as const };
      default:
        return { label: 'Desconhecido', variant: 'outline' as const };
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const hours = Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60));
    if (hours < 24) return `há ${hours}h`;
    const days = Math.floor(hours / 24);
    return `há ${days}d`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Políticas</CardTitle>
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

  if (!policies) return null;

  const visibilityInfo = getVisibilityInfo(policies.visibility);
  const requestInfo = getRequestPolicyInfo(policies.requestPolicy);
  const autoEnableInfo = getAutoEnableInfo(policies.autoEnablePolicy);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="h-4 w-4 text-zinc-600" />
          Políticas
          {(policies.pendingRequests > 0 || policies.pendingPolicyChanges > 0) && (
            <Badge variant="warning" className="text-xs">
              {policies.pendingRequests + policies.pendingPolicyChanges}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Policies */}
        <div className="space-y-3">
          {/* Visibility */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {visibilityInfo.icon}
              <span className="text-sm">Visibilidade</span>
            </div>
            <Badge variant={visibilityInfo.variant} className="text-xs">
              {visibilityInfo.label}
            </Badge>
          </div>

          {/* Request Policy */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {requestInfo.icon}
              <span className="text-sm">Aprovação</span>
            </div>
            <Badge variant={requestInfo.variant} className="text-xs">
              {requestInfo.label}
            </Badge>
          </div>

          {/* Auto-Enable */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-3 w-3 text-zinc-500" />
              <span className="text-sm">Auto-habilitar</span>
            </div>
            <Badge variant={autoEnableInfo.variant} className="text-xs">
              {autoEnableInfo.label}
            </Badge>
          </div>
        </div>

        {/* Pending Items */}
        {(policies.pendingRequests > 0 || policies.pendingPolicyChanges > 0) && (
          <div className="pt-3 border-t space-y-2">
            <div className="text-sm font-medium text-zinc-700">Pendências</div>
            
            {policies.pendingRequests > 0 && (
              <div className="flex items-center justify-between p-2 bg-amber-50 rounded border border-amber-200">
                <div className="text-xs">Solicitações</div>
                <Badge variant="warning" className="text-xs">
                  {policies.pendingRequests}
                </Badge>
              </div>
            )}
            
            {policies.pendingPolicyChanges > 0 && (
              <div className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                <div className="text-xs">Mudanças de política</div>
                <Badge variant="secondary" className="text-xs">
                  {policies.pendingPolicyChanges}
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* Last Update */}
        <div className="pt-3 border-t">
          <div className="text-xs text-zinc-500">
            Última atualização: {formatTimeAgo(policies.lastPolicyUpdate)}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="pt-2">
          <Button size="sm" variant="outline" className="w-full text-xs">
            Configurar Políticas
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}