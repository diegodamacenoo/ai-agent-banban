'use client';

import React, { useState, useEffect } from 'react';
import { Switch } from '@/shared/ui/switch';
import { Label } from '@/shared/ui/label';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui/tooltip';

interface AutoConfigSwitchProps {
  /** Campo que está sendo configurado */
  field: 'version' | 'status' | 'lifecycle';
  /** Se a configuração automática está habilitada no sistema */
  isAutoEnabled: boolean;
  /** Valor que será aplicado automaticamente */
  autoValue: string;
  /** Callback quando modo muda */
  onModeChange: (isAuto: boolean) => void;
  /** Estado inicial do switch */
  initialIsAuto?: boolean;
  /** Campo manual para mostrar quando não está em modo automático */
  children: React.ReactNode;
  /** Texto explicativo adicional */
  description?: string;
  /** Se deve começar em modo automático por padrão */
  defaultToAuto?: boolean;
}

export function AutoConfigSwitch({
  field,
  isAutoEnabled,
  autoValue,
  onModeChange,
  initialIsAuto,
  children,
  description,
  defaultToAuto = true,
}: AutoConfigSwitchProps) {
  // Estado do switch - prioriza configuração do sistema se habilitada
  const [isAuto, setIsAuto] = useState(() => {
    if (initialIsAuto !== undefined) return initialIsAuto;
    return isAutoEnabled && defaultToAuto;
  });

  // Atualizar quando configuração do sistema mudar
  useEffect(() => {
    if (initialIsAuto !== undefined) {
      setIsAuto(initialIsAuto);
    } else if (isAutoEnabled && defaultToAuto) {
      setIsAuto(true);
    }
  }, [isAutoEnabled, initialIsAuto, defaultToAuto]);

  const handleSwitchChange = (checked: boolean) => {
    // Só permitir modo automático se estiver habilitado no sistema
    if (checked && !isAutoEnabled) {
      return;
    }
    
    setIsAuto(checked);
    onModeChange(checked);
  };

  const getFieldLabel = () => {
    switch (field) {
      case 'version':
        return 'Versionamento';
      case 'status':
      case 'lifecycle':
        return 'Status/Ciclo de vida';
      default:
        return 'Configuração';
    }
  };

  const getTooltipContent = () => {
    switch (field) {
      case 'version':
        return 'Quando ativo, o sistema define automaticamente a versão inicial como 1.0.0';
      case 'status':
      case 'lifecycle':
        return 'Quando ativo, o sistema define automaticamente o status baseado na configuração padrão';
      default:
        return 'Configuração automática baseada nas configurações do sistema';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Switch
          checked={isAuto}
          onCheckedChange={handleSwitchChange}
          disabled={!isAutoEnabled && isAuto} // Não pode desabilitar se sistema não suporta
        />
        
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">
            {isAuto ? `${getFieldLabel()} Automático` : `${getFieldLabel()} Manual`}
          </Label>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p>{getTooltipContent()}</p>
                {description && (
                  <p className="mt-1 text-xs text-muted-foreground">{description}</p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Modo Automático - Mostrar valor que será aplicado */}
      {isAuto && (
        <div className="text-sm text-muted-foreground p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>
              <strong>Automático:</strong> O valor será definido como{' '}
              <code className="px-1 py-0.5 bg-blue-100 rounded text-blue-800 font-mono text-xs">
                {autoValue}
              </code>
            </span>
          </div>
        </div>
      )}

      {/* Modo Manual - Mostrar campo de input */}
      {!isAuto && (
        <div className="space-y-2">
          {children}
        </div>
      )}

      {/* Aviso se configuração automática não está disponível */}
      {!isAutoEnabled && isAuto && (
        <div className="text-sm text-amber-600 p-3 bg-amber-50 border border-amber-200 rounded-md">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
            <span>
              ⚠️ Configuração automática não está habilitada no sistema. O campo será preenchido manualmente.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}