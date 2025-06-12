'use client';

import React, { useState, useEffect } from 'react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { SaveIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { SkeletonNotificationSettings } from "@/components/ui/skeleton-loader";
import { Slider } from '@/components/ui/slider';

interface SecurityAlertSettings {
  alert_new_device: boolean;
  alert_failed_attempts: boolean;
  alert_user_deletion: boolean;
  failed_attempts_threshold: number;
}

export function TiposAlertas() {
  const [settings, setSettings] = useState<SecurityAlertSettings>({
    alert_new_device: true,
    alert_failed_attempts: true,
    alert_user_deletion: true,
    failed_attempts_threshold: 3,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [savingStates, setSavingStates] = useState<{[key: string]: boolean}>({});

  // Carregar configurações do usuário via API Route
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/notifications/security-alerts', {
          method: 'GET',
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error('Erro ao carregar configurações');
        }

        const result = await response.json();
        
        if (result.success && result.data) {
          setSettings(result.data);
        } else {
          toast.error(result.error || 'Erro ao carregar configurações de segurança');
        }
      } catch (error) {
        toast.error('Erro ao carregar configurações de segurança');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSettingChange = async (key: keyof SecurityAlertSettings, value: boolean | number) => {
    // Atualização otimista
    const previousValue = settings[key];
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));

    // Indicar que está salvando esta configuração específica
    setSavingStates(prev => ({ ...prev, [key]: true }));

    try {
      const updatedSettings = {
        ...settings,
        [key]: value
      };

      const response = await fetch('/api/notifications/security-alerts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updatedSettings),
      });

      if (!response.ok) {
        throw new Error('Erro na requisição');
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success('Configuração atualizada com sucesso');
      } else {
        // Reverter em caso de erro
        setSettings(prev => ({
          ...prev,
          [key]: previousValue
        }));
        toast.error(result.error || 'Erro ao salvar configuração');
      }
    } catch (error) {
      // Reverter em caso de erro
      setSettings(prev => ({
        ...prev,
        [key]: previousValue
      }));
      toast.error('Erro inesperado ao salvar configuração');
    } finally {
      setSavingStates(prev => ({ ...prev, [key]: false }));
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-none">
        <CardContent className="p-6">
          <SkeletonNotificationSettings items={3} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-none">
      <CardContent className="p-6 space-y-6">
        {/* Alertas de Novo Dispositivo */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="font-medium">Novo Dispositivo</h4>
              <p className="text-sm text-muted-foreground">Receba alertas quando um novo dispositivo acessar sua conta</p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="new-device-switch"
                checked={settings.alert_new_device}
                onCheckedChange={(checked) => handleSettingChange('alert_new_device', checked)}
                disabled={savingStates.alert_new_device}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Alertas de Tentativas de Login Falhadas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="font-medium">Tentativas de Login Falhadas</h4>
              <p className="text-sm text-muted-foreground">Receba alertas quando houver tentativas de login falhadas</p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="failed-attempts-switch"
                checked={settings.alert_failed_attempts}
                onCheckedChange={(checked) => handleSettingChange('alert_failed_attempts', checked)}
                disabled={savingStates.alert_failed_attempts}
              />
            </div>
          </div>

          {settings.alert_failed_attempts && (
            <div className="space-y-2">
              <Label htmlFor="threshold-input">Limite de tentativas antes do alerta: {settings.failed_attempts_threshold}</Label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[settings.failed_attempts_threshold]}
                  onValueChange={([value]) => handleSettingChange('failed_attempts_threshold', value)}
                  max={10}
                  min={2}
                  step={1}
                  className="mt-2"
                  disabled={savingStates.failed_attempts_threshold}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Você será notificado após {settings.failed_attempts_threshold} tentativas falhadas consecutivas
              </p>
            </div>
          )}
        </div>

        <Separator />

        {/* Alertas de Exclusão de Usuário */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="font-medium">Exclusão de Usuário</h4>
              <p className="text-sm text-muted-foreground">Receba alertas quando usuários forem excluídos da organização</p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="user-deletion-switch"
                checked={settings.alert_user_deletion}
                onCheckedChange={(checked) => handleSettingChange('alert_user_deletion', checked)}
                disabled={savingStates.alert_user_deletion}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 