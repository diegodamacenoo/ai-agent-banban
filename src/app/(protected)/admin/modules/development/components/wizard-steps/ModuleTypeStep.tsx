'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Package, Palette, CheckCircle2 } from 'lucide-react';
import { useModuleWizardContext } from '../../../contexts/ModuleWizardContext';
import { ModuleType } from '../../types';

/**
 * Step 1: Seleção do tipo de módulo (Standard vs Custom).
 */
export function ModuleTypeStep() {
  const { state, updateConfig } = useModuleWizardContext();

  const handleSelectType = (type: ModuleType) => {
    updateConfig('type', type);
    
    // Limpar configuração do cliente se mudar para standard
    if (type === 'standard' && state.config.client) {
      updateConfig('client', undefined as any);
    }
  };

  const moduleTypes = [
    {
      type: 'standard' as ModuleType,
      title: 'Módulo Padrão',
      description: 'Módulo genérico que funciona para todos os clientes com configurações básicas',
      icon: Package,
      features: [
        'Funcionalidade genérica',
        'Configuração simplificada',
        'Compatível com todos os clientes',
        'Desenvolvimento mais rápido',
        'Manutenção facilitada'
      ],
      recommended: 'Para funcionalidades comuns como relatórios, dashboards básicos, formulários'
    },
    {
      type: 'custom' as ModuleType,
      title: 'Módulo Personalizado',
      description: 'Módulo específico para um cliente com personalizações avançadas',
      icon: Palette,
      features: [
        'Personalizações específicas do cliente',
        'Branding customizado',
        'Integrações específicas',
        'Fluxos de trabalho únicos',
        'Funcionalidades exclusivas'
      ],
      recommended: 'Para integrações com ERPs específicos, fluxos únicos de negócio, interfaces customizadas'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Escolha o Tipo de Módulo</h3>
        <p className="text-muted-foreground">
          Selecione se você deseja criar um módulo padrão ou personalizado para um cliente específico
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {moduleTypes.map((moduleTypeOption) => {
          const isSelected = state.config.type === moduleTypeOption.type;
          const Icon = moduleTypeOption.icon;
          
          return (
            <Card
              key={moduleTypeOption.type}
              className={`
                cursor-pointer transition-all border-2 hover:shadow-md
                ${isSelected ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/30'}
              `}
              onClick={() => handleSelectType(moduleTypeOption.type)}
            >
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`
                      p-2 rounded-lg 
                      ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                    `}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{moduleTypeOption.title}</CardTitle>
                      {isSelected && (
                        <div className="flex items-center gap-1 mt-1">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-600 font-medium">Selecionado</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <CardDescription className="text-left">
                  {moduleTypeOption.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm mb-2">Características:</h4>
                  <ul className="space-y-1">
                    {moduleTypeOption.features.map((feature, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-current" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm mb-2">Recomendado para:</h4>
                  <p className="text-xs text-muted-foreground">
                    {moduleTypeOption.recommended}
                  </p>
                </div>
                
                <Button 
                  className="w-full" 
                  variant={isSelected ? "default" : "outline"}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectType(moduleTypeOption.type);
                  }}
                >
                  {isSelected ? 'Selecionado' : 'Selecionar'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}