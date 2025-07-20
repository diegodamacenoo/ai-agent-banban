import { useState, useEffect, useCallback } from 'react';
import { 
  getSecurityAlertSettings, 
  updateSecurityAlertSettings,
  getUserKnownDevices,
  removeKnownDevice
} from '@/app/actions/security-alerts/security-alerts-actions';
import type { SecurityAlertSettings, UserKnownDevice } from '@/core/schemas/security-alerts';

interface UseSecurityAlertsReturn {
  // Estados
  settings: SecurityAlertSettings;
  knownDevices: UserKnownDevice[];
  isLoading: boolean;
  isLoadingDevices: boolean;
  error: string | null;
  
  // AÃ§Ãµes
  updateSettings: (newSettings: Partial<SecurityAlertSettings>) => Promise<boolean>;
  refreshSettings: () => Promise<void>;
  refreshDevices: () => Promise<void>;
  removeDevice: (deviceId: string) => Promise<boolean>;
}

export function useSecurityAlerts(): UseSecurityAlertsReturn {
  // Estados
  const [settings, setSettings] = useState<SecurityAlertSettings>({
    alert_new_device: true,
    alert_failed_attempts: true,
    alert_user_deletion: true,
    failed_attempts_threshold: 3
  });
  
  const [knownDevices, setKnownDevices] = useState<UserKnownDevice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar configuraÃ§Ãµes
  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await getSecurityAlertSettings();
      if (result.success && result.data) {
        setSettings(result.data);
      } else {
        setError(result.error || 'Erro ao carregar configuraÃ§Ãµes');
      }
    } catch (err) {
      setError('Erro inesperado ao carregar configuraÃ§Ãµes');
      console.error('Erro ao carregar configuraÃ§Ãµes:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Carregar dispositivos conhecidos
  const loadKnownDevices = useCallback(async () => {
    setIsLoadingDevices(true);
    
    try {
      const result = await getUserKnownDevices();
      if (result.success && result.data) {
        setKnownDevices(result.data);
      }
    } catch (err) {
      console.error('Erro ao carregar dispositivos:', err);
    } finally {
      setIsLoadingDevices(false);
    }
  }, []);

  // Atualizar configuraÃ§Ãµes
  const updateSettings = useCallback(async (newSettings: Partial<SecurityAlertSettings>): Promise<boolean> => {
    const previousSettings = settings;
    const updatedSettings = { ...settings, ...newSettings };
    
    // Atualização otimista
    setSettings(updatedSettings);
    
    try {
      // Criar objeto completo para enviar para a API
      const completeSettings: SecurityAlertSettings = {
        alert_new_device: updatedSettings.alert_new_device,
        alert_failed_attempts: updatedSettings.alert_failed_attempts,
        alert_user_deletion: updatedSettings.alert_user_deletion,
        failed_attempts_threshold: updatedSettings.failed_attempts_threshold
      };
      
      const result = await updateSecurityAlertSettings(completeSettings);
      if (result.success) {
        return true;
      } else {
        // Reverter em caso de erro
        setSettings(previousSettings);
        setError(result.error || 'Erro ao atualizar configurações');
        return false;
      }
    } catch (err) {
      // Reverter em caso de erro
      setSettings(previousSettings);
      setError('Erro inesperado ao atualizar configurações');
      console.error('Erro ao atualizar configurações:', err);
      return false;
    }
  }, [settings]);

  // Remover dispositivo
  const removeDevice = useCallback(async (deviceId: string): Promise<boolean> => {
    try {
      const result = await removeKnownDevice(deviceId);
      if (result.success) {
        // Remover da lista local
        setKnownDevices(prev => prev.filter(device => device.id !== deviceId));
        return true;
      } else {
        setError(result.error || 'Erro ao remover dispositivo');
        return false;
      }
    } catch (err) {
      setError('Erro inesperado ao remover dispositivo');
      console.error('Erro ao remover dispositivo:', err);
      return false;
    }
  }, []);

  // Refresh das configuraÃ§Ãµes
  const refreshSettings = useCallback(() => {
    return loadSettings();
  }, [loadSettings]);

  // Refresh dos dispositivos
  const refreshDevices = useCallback(() => {
    return loadKnownDevices();
  }, [loadKnownDevices]);

  // Carregar dados ao montar o componente
  useEffect(() => {
    loadSettings();
    loadKnownDevices();
  }, [loadSettings, loadKnownDevices]);

  return {
    // Estados
    settings,
    knownDevices,
    isLoading,
    isLoadingDevices,
    error,
    
    // AÃ§Ãµes
    updateSettings,
    refreshSettings,
    refreshDevices,
    removeDevice
  };
} 
