'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Switch } from '@/shared/ui/switch';
import { 
  Shield, 
  Eye, 
  EyeOff, 
  UserCheck, 
  Settings, 
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  Lock
} from 'lucide-react';
import { CoreModule } from '@/shared/types/module-catalog';
import { useToast } from '@/shared/ui/toast';

interface ModulePoliciesCardProps {
  module: CoreModule;
  onUpdate: () => void;
}

interface PolicySettings {
  visibility: 'PUBLIC' | 'PRIVATE' | 'RESTRICTED';
  requestPolicy: 'AUTO_APPROVE' | 'MANUAL_APPROVAL' | 'DISABLED';
  autoEnablePolicy: 'ALL_TENANTS' | 'NEW_TENANTS' | 'NONE';
}

export function ModulePoliciesCard({module, onUpdate }: ModulePoliciesCardProps) {
  const { toast } = useToast();
  const [policies, setPolicies] = useState<PolicySettings>({
    visibility: 'PUBLIC' as PolicySettings['visibility'], // Valor padrão já que default_visibility não existe
    requestPolicy: (module.requires_approval ? 'MANUAL_APPROVAL' : 'AUTO_APPROVE') as PolicySettings['requestPolicy'],
    autoEnablePolicy: 'NONE' as PolicySettings['autoEnablePolicy']
  });
  
  const [saving, setSaving] = useState(false);

  const handlePolicyUpdate = async (newPolicies: Partial<PolicySettings>) => {
    setSaving(true);
    try {
      const updatedPolicies = { ...policies, ...newPolicies };
      setPolicies(updatedPolicies);
      
      // TODO: Implement actual API call to update module policies
      toast.success('Políticas atualizadas com sucesso');
      onUpdate();
    } catch (error) {
      toast.error('Erro ao atualizar políticas');
      console.error('Error updating policies:', error);
    } finally {
      setSaving(false);
    }
  };

  const getVisibilityIcon = (visibility: PolicySettings['visibility']) => {
    switch (visibility) {
      case 'PUBLIC':
        return <Eye className="h-4 w-4 text-green-600" />;
      case 'PRIVATE':
        return <EyeOff className="h-4 w-4 text-red-600" />;
      case 'RESTRICTED':
        return <Lock className="h-4 w-4 text-amber-600" />;
      default:
        return <Eye className="h-4 w-4 text-zinc-500" />;
    }
  };

  const getVisibilityBadge = (visibility: PolicySettings['visibility']) => {
    switch (visibility) {
      case 'PUBLIC':
        return <Badge variant="success">Público</Badge>;
      case 'PRIVATE':
        return <Badge variant="destructive">Privado</Badge>;
      case 'RESTRICTED':
        return <Badge variant="warning">Restrito</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const getRequestPolicyBadge = (policy: PolicySettings['requestPolicy']) => {
    switch (policy) {
      case 'AUTO_APPROVE':
        return <Badge variant="success">Aprovação Automática</Badge>;
      case 'MANUAL_APPROVAL':
        return <Badge variant="warning">Aprovação Manual</Badge>;
      case 'DISABLED':
        return <Badge variant="destructive">Desabilitado</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const getAutoEnableBadge = (policy: PolicySettings['autoEnablePolicy']) => {
    switch (policy) {
      case 'ALL_TENANTS':
        return <Badge variant="success">Todos os Tenants</Badge>;
      case 'NEW_TENANTS':
        return <Badge variant="secondary">Novos Tenants</Badge>;
      case 'NONE':
        return <Badge variant="outline">Nenhum</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Políticas de Acesso
        </CardTitle>
        <CardDescription>
          Configure a visibilidade, aprovação e habilitação automática do módulo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Visibility Policy */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getVisibilityIcon(policies.visibility)}
              <span className="font-medium">Visibilidade</span>
            </div>
            {getVisibilityBadge(policies.visibility)}
          </div>
          
          <div className="text-sm text-zinc-600 mb-3">
            Controla quem pode ver este módulo no catálogo
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center justify-between p-3 border rounded">
              <div className="flex items-center gap-3">
                <Eye className="h-4 w-4 text-green-600" />
                <div>
                  <div className="font-medium text-sm">Público</div>
                  <div className="text-xs text-zinc-500">Visível para todos os tenants</div>
                </div>
              </div>
              <Switch
                checked={policies.visibility === 'PUBLIC'}
                onCheckedChange={(checked) => {
                  if (checked) handlePolicyUpdate({ visibility: 'PUBLIC' });
                }}
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded">
              <div className="flex items-center gap-3">
                <Lock className="h-4 w-4 text-amber-600" />
                <div>
                  <div className="font-medium text-sm">Restrito</div>
                  <div className="text-xs text-zinc-500">Visível apenas para tenants específicos</div>
                </div>
              </div>
              <Switch
                checked={policies.visibility === 'RESTRICTED'}
                onCheckedChange={(checked) => {
                  if (checked) handlePolicyUpdate({ visibility: 'RESTRICTED' });
                }}
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded">
              <div className="flex items-center gap-3">
                <EyeOff className="h-4 w-4 text-red-600" />
                <div>
                  <div className="font-medium text-sm">Privado</div>
                  <div className="text-xs text-zinc-500">Não visível no catálogo público</div>
                </div>
              </div>
              <Switch
                checked={policies.visibility === 'PRIVATE'}
                onCheckedChange={(checked) => {
                  if (checked) handlePolicyUpdate({ visibility: 'PRIVATE' });
                }}
                disabled={saving}
              />
            </div>
          </div>
        </div>

        {/* Request Policy */}
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-zinc-600" />
              <span className="font-medium">Política de Solicitação</span>
            </div>
            {getRequestPolicyBadge(policies.requestPolicy)}
          </div>
          
          <div className="text-sm text-zinc-600 mb-3">
            Como as solicitações de acesso são processadas
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center justify-between p-3 border rounded">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <div className="font-medium text-sm">Aprovação Automática</div>
                  <div className="text-xs text-zinc-500">Solicitações aprovadas automaticamente</div>
                </div>
              </div>
              <Switch
                checked={policies.requestPolicy === 'AUTO_APPROVE'}
                onCheckedChange={(checked) => {
                  if (checked) handlePolicyUpdate({ requestPolicy: 'AUTO_APPROVE' });
                }}
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <div>
                  <div className="font-medium text-sm">Aprovação Manual</div>
                  <div className="text-xs text-zinc-500">Requer aprovação de um administrador</div>
                </div>
              </div>
              <Switch
                checked={policies.requestPolicy === 'MANUAL_APPROVAL'}
                onCheckedChange={(checked) => {
                  if (checked) handlePolicyUpdate({ requestPolicy: 'MANUAL_APPROVAL' });
                }}
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded">
              <div className="flex items-center gap-3">
                <XCircle className="h-4 w-4 text-red-600" />
                <div>
                  <div className="font-medium text-sm">Desabilitado</div>
                  <div className="text-xs text-zinc-500">Não aceita novas solicitações</div>
                </div>
              </div>
              <Switch
                checked={policies.requestPolicy === 'DISABLED'}
                onCheckedChange={(checked) => {
                  if (checked) handlePolicyUpdate({ requestPolicy: 'DISABLED' });
                }}
                disabled={saving}
              />
            </div>
          </div>
        </div>

        {/* Auto-Enable Policy */}
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-zinc-600" />
              <span className="font-medium">Habilitação Automática</span>
            </div>
            {getAutoEnableBadge(policies.autoEnablePolicy)}
          </div>
          
          <div className="text-sm text-zinc-600 mb-3">
            Quando o módulo deve ser habilitado automaticamente
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center justify-between p-3 border rounded">
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-green-600" />
                <div>
                  <div className="font-medium text-sm">Todos os Tenants</div>
                  <div className="text-xs text-zinc-500">Habilitado para todos os tenants existentes e novos</div>
                </div>
              </div>
              <Switch
                checked={policies.autoEnablePolicy === 'ALL_TENANTS'}
                onCheckedChange={(checked) => {
                  if (checked) handlePolicyUpdate({ autoEnablePolicy: 'ALL_TENANTS' });
                }}
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded">
              <div className="flex items-center gap-3">
                <UserCheck className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="font-medium text-sm">Novos Tenants</div>
                  <div className="text-xs text-zinc-500">Habilitado apenas para novos tenants</div>
                </div>
              </div>
              <Switch
                checked={policies.autoEnablePolicy === 'NEW_TENANTS'}
                onCheckedChange={(checked) => {
                  if (checked) handlePolicyUpdate({ autoEnablePolicy: 'NEW_TENANTS' });
                }}
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded">
              <div className="flex items-center gap-3">
                <XCircle className="h-4 w-4 text-zinc-400" />
                <div>
                  <div className="font-medium text-sm">Nenhum</div>
                  <div className="text-xs text-zinc-500">Deve ser habilitado manualmente</div>
                </div>
              </div>
              <Switch
                checked={policies.autoEnablePolicy === 'NONE'}
                onCheckedChange={(checked) => {
                  if (checked) handlePolicyUpdate({ autoEnablePolicy: 'NONE' });
                }}
                disabled={saving}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t">
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="outline"
              disabled={saving}
            >
              Aplicar Políticas Globalmente
            </Button>
            <Button 
              size="sm" 
              variant="ghost"
              disabled={saving}
            >
              Resetar para Padrão
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}