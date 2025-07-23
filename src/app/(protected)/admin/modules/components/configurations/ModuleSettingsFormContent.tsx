/**
 * ModuleSettingsFormContent - Versão sem Card wrapper
 * Apenas o conteúdo do formulário de configurações
 */

'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Switch } from '@/shared/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Separator } from '@/shared/ui/separator';
import { useToast } from '@/shared/ui/toast';
import { getSystemSettings, saveSystemSettings, type SystemSettings } from '@/app/actions/admin/modules/module-settings';
import { useSystemConfig } from '../../contexts/SystemConfigContext';

// Deep comparison para verificar mudanças reais
function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;
  if (!obj1 || !obj2) return false;
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false;
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepEqual(obj1[key], obj2[key])) return false;
  }
  
  return true;
}

export const ModuleSettingsFormContent = React.memo(function ModuleSettingsFormContent() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Usar o Context para configurações (cache global inteligente)
  const { 
    config: contextConfig, 
    loading: contextLoading, 
    error: contextError,
    invalidateCache
  } = useSystemConfig();
  
  // Estado local do formulário (sincronizado com o Context)
  const [settings, setSettings] = useState<SystemSettings>({
    autoArchiveAfterDays: 90,
    maxImplementationsPerModule: 10,
    requireApprovalForNewModules: true,
    enableModuleVersioning: true,
    defaultModuleLifecycle: 'active',
    enableAutoBackup: true,
    backupFrequency: 'daily',
    retentionPeriodDays: 30,
    enableAuditLog: true,
    notifyOnCriticalChanges: true,
    maintenanceMode: false,
    debugMode: false
  });

  // Sincronizar estado local com o Context (apenas quando necessário)
  useEffect(() => {
    if (contextConfig && !hasUnsavedChanges) {
      // Só sincroniza se não há mudanças locais pendentes
      setSettings(prevSettings => {
        if (deepEqual(prevSettings, contextConfig)) {
          return prevSettings; // Manter referência anterior
        }
        return { ...contextConfig };
      });
    }
  }, [contextConfig, hasUnsavedChanges]);

  const handleSettingChange = useCallback((key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true); // Marcar como alterado
  }, []);

  const handleSave = useCallback(async () => {
    if (loading) {
      return;
    }
    
    setLoading(true);
    
    // 🎯 Feedback visual simples
    const toastId = toast.loading("Salvando configurações...");
    
    try {
      const result = await saveSystemSettings(settings);
      
      if (result.success) {
        setHasUnsavedChanges(false); // Marcar como salvo
        
        // Invalidar cache para próxima busca
        invalidateCache();
        
        // ✅ Sucesso - atualizar toast
        toast.update(toastId, {
          title: "Configurações salvas",
          description: result.message || "As configurações foram atualizadas com sucesso.",
          variant: 'success',
          persistent: false,
          duration: 4000
        });
      } else {
        // ❌ Erro - atualizar toast
        toast.update(toastId, {
          title: "Erro ao salvar",
          description: result.error || "Erro desconhecido ao salvar configurações.",
          variant: 'error',
          persistent: false,
          duration: 6000
        });
      }
    } catch (error) {
      // ❌ Erro - atualizar toast
      toast.update(toastId, {
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações. Verifique sua conexão.",
        variant: 'error',
        persistent: false,
        duration: 6000
      });
    } finally {
      setLoading(false);
    }
  }, [loading, settings, toast, invalidateCache]);

  if (contextLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-muted-foreground">Carregando configurações...</div>
        </div>
      </div>
    );
  }

  if (contextError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-destructive">Erro: {contextError}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Configurações de Módulos */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Configurações de Módulos</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="autoArchive">Arquivar automaticamente após (dias)</Label>
            <Input
              id="autoArchive"
              type="number"
              value={settings.autoArchiveAfterDays}
              onChange={(e) => handleSettingChange('autoArchiveAfterDays', parseInt(e.target.value))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="maxImplementations">Máx. implementações por módulo</Label>
            <Input
              id="maxImplementations"
              type="number"
              value={settings.maxImplementationsPerModule}
              onChange={(e) => handleSettingChange('maxImplementationsPerModule', parseInt(e.target.value))}
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Exigir aprovação para novos módulos</Label>
              <p className="text-sm text-muted-foreground">
                Novos módulos precisarão de aprovação antes de serem ativados
              </p>
            </div>
            <Switch
              checked={settings.requireApprovalForNewModules}
              onCheckedChange={(checked) => handleSettingChange('requireApprovalForNewModules', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Ativar versionamento de módulos</Label>
              <p className="text-sm text-muted-foreground">
                Mantém histórico de alterações em módulos
              </p>
            </div>
            <Switch
              checked={settings.enableModuleVersioning}
              onCheckedChange={(checked) => handleSettingChange('enableModuleVersioning', checked)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="defaultLifecycle">Ciclo de vida padrão</Label>
          <Select
            value={settings.defaultModuleLifecycle}
            onValueChange={(value) => handleSettingChange('defaultModuleLifecycle', value)}
          >
            <SelectTrigger id="defaultLifecycle">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Rascunho</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="deprecated">Descontinuado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Configurações de Backup */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Backup e Recuperação</h3>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Ativar backup automático</Label>
            <p className="text-sm text-muted-foreground">
              Realiza backup automático das configurações
            </p>
          </div>
          <Switch
            checked={settings.enableAutoBackup}
            onCheckedChange={(checked) => handleSettingChange('enableAutoBackup', checked)}
          />
        </div>

        {settings.enableAutoBackup && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="backupFrequency">Frequência de backup</Label>
              <Select
                value={settings.backupFrequency}
                onValueChange={(value) => handleSettingChange('backupFrequency', value)}
              >
                <SelectTrigger id="backupFrequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">A cada hora</SelectItem>
                  <SelectItem value="daily">Diário</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="retention">Período de retenção (dias)</Label>
              <Input
                id="retention"
                type="number"
                value={settings.retentionPeriodDays}
                onChange={(e) => handleSettingChange('retentionPeriodDays', parseInt(e.target.value))}
              />
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Configurações de Sistema */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Sistema e Depuração</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Log de auditoria</Label>
              <p className="text-sm text-muted-foreground">
                Registra todas as alterações no sistema
              </p>
            </div>
            <Switch
              checked={settings.enableAuditLog}
              onCheckedChange={(checked) => handleSettingChange('enableAuditLog', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificar alterações críticas</Label>
              <p className="text-sm text-muted-foreground">
                Envia notificações para mudanças importantes
              </p>
            </div>
            <Switch
              checked={settings.notifyOnCriticalChanges}
              onCheckedChange={(checked) => handleSettingChange('notifyOnCriticalChanges', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-orange-600">Modo de manutenção</Label>
              <p className="text-sm text-muted-foreground">
                Desativa temporariamente o acesso aos módulos
              </p>
            </div>
            <Switch
              checked={settings.maintenanceMode}
              onCheckedChange={(checked) => handleSettingChange('maintenanceMode', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-red-600">Modo debug</Label>
              <p className="text-sm text-muted-foreground">
                Ativa logs condicionais de debug em toda a aplicação (console + banco)
              </p>
            </div>
            <Switch
              checked={settings.debugMode}
              onCheckedChange={(checked) => handleSettingChange('debugMode', checked)}
            />
          </div>
        </div>
      </div>

      {/* Indicador de mudanças não salvas */}
      {hasUnsavedChanges && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
            <p className="text-sm text-orange-700 font-medium">
              Você tem alterações não salvas
            </p>
          </div>
        </div>
      )}
      
      {/* Botão salvar oculto para ser acionado pela página principal */}
      <button
        data-save-settings
        onClick={handleSave}
        disabled={loading}
        style={{ display: 'none' }}
        type="button"
      >
        Salvar
      </button>
    </div>
  );
});