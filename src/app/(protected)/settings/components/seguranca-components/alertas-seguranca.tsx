'use client';

import * as React from "react";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { Switch } from "@/shared/ui/switch";
import { Separator } from "@/shared/ui/separator";
import { Slider } from "@/shared/ui/slider";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { InfoIcon, BellIcon, ShieldIcon, TrashIcon, AlertCircleIcon, RefreshCwIcon } from "lucide-react";
import { useToast } from '@/shared/ui/toast';
import { useSecurityAlerts } from "@/shared/hooks/useSecurityAlerts";
import { useUser } from "@/app/contexts/UserContext";

export default function AlertasSeguranca() {
  const { toast } = useToast();
  const {
    settings,
    knownDevices,
    isLoading,
    isLoadingDevices,
    error,
    updateSettings,
    refreshSettings,
    refreshDevices,
    removeDevice
  } = useSecurityAlerts();

  // Verifica se o usuÃ¡rio Ã© administrador da organizaÃ§Ã£o
  const { userData } = useUser();
  const isAdmin = userData?.role === "organization_admin";

  const handleUpdateSettings = async (newSettings: Parameters<typeof updateSettings>[0]) => {
    const success = await updateSettings(newSettings);
    if (success) {
      toast.success("ConfiguraÃ§Ãµes de alerta atualizadas", {
        title: "Sucesso",
      });
    } else {
      toast.error(error || "Erro ao atualizar configuraÃ§Ãµes", {
        title: "Erro",
      });
    }
  };

  const handleRemoveDevice = async (deviceId: string) => {
    const success = await removeDevice(deviceId);
    if (success) {
      toast.success("Dispositivo removido com sucesso", {
        title: "Sucesso",
      });
    } else {
      toast.error(error || "Erro ao remover dispositivo", {
        title: "Erro",
      });
    }
  };

  const formatDeviceInfo = (device: typeof knownDevices[0]) => {
    if (!device.user_agent) return 'Dispositivo desconhecido';
    
    // ExtraÃ§Ã£o bÃ¡sica de informaÃ§Ãµes do user agent
    const browserMatch = device.user_agent.match(/(Chrome|Firefox|Safari|Edge|Opera)\/(\d+)/);
    const osMatch = device.user_agent.match(/(Windows|Mac|Linux|Android|iOS)/);
    
    const browser = browserMatch ? `${browserMatch[1]} ${browserMatch[2]}` : 'Navegador';
    const os = osMatch ? osMatch[1] : 'Sistema';
    
    return `${browser} em ${os}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div className="space-y-2">
      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button
              variant="outline"
              size="sm"
              className="ml-2"
              onClick={() => {
                refreshSettings();
                refreshDevices();
              }}
            >
              <RefreshCwIcon className="h-4 w-4 mr-1" />
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card className="shadow-none">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <InfoIcon className="text-blue-500 w-5 h-5" />
            <p className="text-sm text-muted-foreground">
              Alertas automÃ¡ticos ajudam a identificar rapidamente possÃ­veis problemas de seguranÃ§a na sua conta.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="alertaNovoDispositivo" className="font-medium">
                  Novo login em dispositivo desconhecido
                </Label>
                <p className="text-xs text-muted-foreground">
                  Envia alerta quando um login for realizado em um dispositivo nÃ£o reconhecido
                </p>
              </div>
              <Switch 
                id="alertaNovoDispositivo" 
                checked={settings.alert_new_device} 
                onCheckedChange={(checked) => handleUpdateSettings({ alert_new_device: checked })}
                disabled={isLoading}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="alertaTentativasFalhas" className="font-medium">
                  Tentativas consecutivas de acesso com senha errada
                </Label>
                <p className="text-xs text-muted-foreground">
                  Envia alerta apÃ³s {settings.failed_attempts_threshold} tentativas falhas de login consecutivas
                </p>
              </div>
              <Switch 
                id="alertaTentativasFalhas" 
                checked={settings.alert_failed_attempts} 
                onCheckedChange={(checked) => handleUpdateSettings({ alert_failed_attempts: checked })}
                disabled={isLoading}
              />
            </div>

            {settings.alert_failed_attempts && (
              <div className="ml-4 p-3 bg-muted/50 rounded-lg">
                <Label className="text-sm font-medium">
                  Limite de tentativas: {settings.failed_attempts_threshold}
                </Label>
                <Slider
                  value={[settings.failed_attempts_threshold]}
                  onValueChange={([value]) => handleUpdateSettings({ failed_attempts_threshold: value })}
                  max={10}
                  min={2}
                  step={1}
                  className="mt-2"
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Defina quantas tentativas falhadas consecutivas acionam o alerta (2-10)
                </p>
              </div>
            )}
            
            {isAdmin && (
            <>
            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="alertaExclusaoUsuario" className="font-medium">
                  ExclusÃ£o de usuÃ¡rio
                </Label>
                <p className="text-xs text-muted-foreground">
                  Envia alerta quando um usuÃ¡rio for excluÃ­do da plataforma
                </p>
              </div>
              <Switch 
                id="alertaExclusaoUsuario" 
                checked={settings.alert_user_deletion} 
                onCheckedChange={(checked) => handleUpdateSettings({ alert_user_deletion: checked })}
                disabled={isLoading}
              />
            </div>
            </>
            )}
          </div>
          
          <div className="bg-white p-4 rounded-md border">
            <div className="flex items-center gap-2">
              <BellIcon className="text-amber-500 w-5 h-5" />
              <p className="text-sm">
                Os alertas sÃ£o enviados para o e-mail da sua conta quando as condiÃ§Ãµes configuradas sÃ£o atendidas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SeÃ§Ã£o de Dispositivos Conhecidos */}
      <Card className="shadow-none">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">Dispositivos Conhecidos</h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshDevices}
              disabled={isLoadingDevices}
            >
              <RefreshCwIcon className={`w-4 h-4 mr-1 ${isLoadingDevices ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Dispositivos que vocÃª jÃ¡ usou para fazer login. Logins de dispositivos desconhecidos acionarÃ£o alertas.
          </p>

          {isLoadingDevices ? (
            <div className="flex items-center justify-center h-20">
              <p className="text-muted-foreground text-sm">Carregando dispositivos...</p>
            </div>
          ) : knownDevices.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">Nenhum dispositivo conhecido registrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {knownDevices.map((device) => (
                <div key={device.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{formatDeviceInfo(device)}</p>
                    <p className="text-xs text-muted-foreground">
                      Primeiro uso: {formatDate(device.created_at)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Ãšltimo uso: {formatDate(device.last_seen_at)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveDevice(device.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
