'use client';

import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Save, RotateCcw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getAlertThresholds, updateAlertThresholds, AlertType } from '@/app/actions/alerts/alert-management';

interface ThresholdSettingsModalProps {
  children: React.ReactNode;
}

interface ThresholdConfig {
  [key: string]: any;
}

interface AlertThreshold {
  id: string;
  alert_type: AlertType;
  threshold_config: ThresholdConfig;
}

export function ThresholdSettingsModal({ children }: ThresholdSettingsModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [thresholds, setThresholds] = useState<AlertThreshold[]>([]);
  const [configs, setConfigs] = useState<Record<AlertType, ThresholdConfig>>({
    stagnant: {},
    replenishment: {},
    divergence: {},
    margin: {},
    returns: {},
    redistribution: {}
  });

  // Carregar configurações quando o modal abre
  useEffect(() => {
    if (open && thresholds.length === 0) {
      loadThresholds();
    }
  }, [open]);

  const loadThresholds = async () => {
    setLoading(true);
    try {
      const result = await getAlertThresholds();
      if (result.success && result.data) {
        setThresholds(result.data);
        
        // Converter para objeto por tipo
        const configsByType: Record<AlertType, ThresholdConfig> = {
          stagnant: {},
          replenishment: {},
          divergence: {},
          margin: {},
          returns: {},
          redistribution: {}
        };

        result.data.forEach((threshold: AlertThreshold) => {
          configsByType[threshold.alert_type] = threshold.threshold_config;
        });

        setConfigs(configsByType);
      } else {
        toast({
          title: 'Erro ao carregar configurações',
          description: result.error,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Erro inesperado',
        description: 'Falha ao carregar configurações',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (alertType: AlertType) => {
    setSaving(true);
    try {
      const result = await updateAlertThresholds({
        alertType,
        thresholdConfig: configs[alertType]
      });

      if (result.success) {
        toast({
          title: 'Sucesso',
          description: 'Configurações salvas com sucesso'
        });
      } else {
        toast({
          title: 'Erro ao salvar',
          description: result.error,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Erro inesperado',
        description: 'Falha ao salvar configurações',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (alertType: AlertType, key: string, value: any) => {
    setConfigs(prev => ({
      ...prev,
      [alertType]: {
        ...prev[alertType],
        [key]: value
      }
    }));
  };

  const resetToDefaults = (alertType: AlertType) => {
    const defaults: Record<AlertType, ThresholdConfig> = {
      stagnant: {
        days_threshold: 30,
        action_priority: ['promotion', 'transfer', 'liquidation']
      },
      replenishment: {
        min_coverage_days: 7,
        critical_coverage_days: 3,
        max_suggested_qty: 100
      },
      divergence: {
        min_difference_pct: 5,
        min_value_impact: 100,
        severity_thresholds: { low: 5, medium: 15, high: 25 }
      },
      margin: {
        min_acceptable_margin_pct: 25,
        critical_margin_pct: 10,
        min_revenue_impact: 500
      },
      returns: {
        min_increase_pct: 50,
        min_return_value: 200,
        analysis_days: 7
      },
      redistribution: {
        min_priority_score: 5,
        max_transfer_qty: 50,
        min_revenue_gain: 300
      }
    };

    setConfigs(prev => ({
      ...prev,
      [alertType]: defaults[alertType]
    }));
  };

  const renderStagnantSettings = () => (
    <Card>
      <CardHeader>
        <CardTitle>Produtos Parados</CardTitle>
        <CardDescription>
          Configurações para alertas de produtos sem movimento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="stagnant-days">Dias sem movimento para alertar</Label>
          <Input
            id="stagnant-days"
            type="number"
            value={configs.stagnant.days_threshold || 30}
            onChange={(e) => updateConfig('stagnant', 'days_threshold', parseInt(e.target.value))}
            className="w-full"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Alertar quando produto ficar sem movimento por X dias
          </p>
        </div>
        
        <div className="flex justify-between items-center">
          <Button onClick={() => handleSave('stagnant')} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>
          <Button variant="outline" onClick={() => resetToDefaults('stagnant')}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Restaurar Padrão
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderReplenishmentSettings = () => (
    <Card>
      <CardHeader>
        <CardTitle>Reposição de Estoque</CardTitle>
        <CardDescription>
          Configurações para alertas de necessidade de reposição
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="repl-min-coverage">Cobertura mínima (dias)</Label>
            <Input
              id="repl-min-coverage"
              type="number"
              value={configs.replenishment.min_coverage_days || 7}
              onChange={(e) => updateConfig('replenishment', 'min_coverage_days', parseInt(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="repl-critical-coverage">Cobertura crítica (dias)</Label>
            <Input
              id="repl-critical-coverage"
              type="number"
              value={configs.replenishment.critical_coverage_days || 3}
              onChange={(e) => updateConfig('replenishment', 'critical_coverage_days', parseInt(e.target.value))}
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="repl-max-qty">Quantidade máxima sugerida</Label>
          <Input
            id="repl-max-qty"
            type="number"
            value={configs.replenishment.max_suggested_qty || 100}
            onChange={(e) => updateConfig('replenishment', 'max_suggested_qty', parseInt(e.target.value))}
          />
        </div>
        
        <div className="flex justify-between items-center">
          <Button onClick={() => handleSave('replenishment')} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>
          <Button variant="outline" onClick={() => resetToDefaults('replenishment')}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Restaurar Padrão
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderDivergenceSettings = () => (
    <Card>
      <CardHeader>
        <CardTitle>Divergências de Estoque</CardTitle>
        <CardDescription>
          Configurações para alertas de divergências entre esperado e contado
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="div-min-pct">Diferença mínima (%)</Label>
            <Input
              id="div-min-pct"
              type="number"
              value={configs.divergence.min_difference_pct || 5}
              onChange={(e) => updateConfig('divergence', 'min_difference_pct', parseInt(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="div-min-value">Impacto mínimo (R$)</Label>
            <Input
              id="div-min-value"
              type="number"
              value={configs.divergence.min_value_impact || 100}
              onChange={(e) => updateConfig('divergence', 'min_value_impact', parseInt(e.target.value))}
            />
          </div>
        </div>
        
        <div>
          <Label>Thresholds de Severidade (%)</Label>
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div>
              <Label htmlFor="div-low" className="text-xs">Baixa</Label>
              <Input
                id="div-low"
                type="number"
                value={configs.divergence.severity_thresholds?.low || 5}
                onChange={(e) => updateConfig('divergence', 'severity_thresholds', {
                  ...configs.divergence.severity_thresholds,
                  low: parseInt(e.target.value)
                })}
              />
            </div>
            <div>
              <Label htmlFor="div-medium" className="text-xs">Média</Label>
              <Input
                id="div-medium"
                type="number"
                value={configs.divergence.severity_thresholds?.medium || 15}
                onChange={(e) => updateConfig('divergence', 'severity_thresholds', {
                  ...configs.divergence.severity_thresholds,
                  medium: parseInt(e.target.value)
                })}
              />
            </div>
            <div>
              <Label htmlFor="div-high" className="text-xs">Alta</Label>
              <Input
                id="div-high"
                type="number"
                value={configs.divergence.severity_thresholds?.high || 25}
                onChange={(e) => updateConfig('divergence', 'severity_thresholds', {
                  ...configs.divergence.severity_thresholds,
                  high: parseInt(e.target.value)
                })}
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <Button onClick={() => handleSave('divergence')} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>
          <Button variant="outline" onClick={() => resetToDefaults('divergence')}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Restaurar Padrão
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderMarginSettings = () => (
    <Card>
      <CardHeader>
        <CardTitle>Alertas de Margem</CardTitle>
        <CardDescription>
          Configurações para alertas de produtos com margem abaixo do esperado
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="margin-min">Margem mínima aceitável (%)</Label>
            <Input
              id="margin-min"
              type="number"
              value={configs.margin.min_acceptable_margin_pct || 25}
              onChange={(e) => updateConfig('margin', 'min_acceptable_margin_pct', parseInt(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="margin-critical">Margem crítica (%)</Label>
            <Input
              id="margin-critical"
              type="number"
              value={configs.margin.critical_margin_pct || 10}
              onChange={(e) => updateConfig('margin', 'critical_margin_pct', parseInt(e.target.value))}
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="margin-revenue">Impacto mínimo na receita (R$)</Label>
          <Input
            id="margin-revenue"
            type="number"
            value={configs.margin.min_revenue_impact || 500}
            onChange={(e) => updateConfig('margin', 'min_revenue_impact', parseInt(e.target.value))}
          />
        </div>
        
        <div className="flex justify-between items-center">
          <Button onClick={() => handleSave('margin')} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>
          <Button variant="outline" onClick={() => resetToDefaults('margin')}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Restaurar Padrão
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configurações de Thresholds
          </DialogTitle>
          <DialogDescription>
            Personalize os limites e critérios para geração de alertas
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <ScrollArea className="max-h-[70vh]">
            <Tabs defaultValue="stagnant" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="stagnant">Parados</TabsTrigger>
                <TabsTrigger value="replenishment">Reposição</TabsTrigger>
                <TabsTrigger value="divergence">Divergências</TabsTrigger>
                <TabsTrigger value="margin">Margem</TabsTrigger>
              </TabsList>
              
              <div className="mt-4 space-y-4">
                <TabsContent value="stagnant" className="space-y-4">
                  {renderStagnantSettings()}
                </TabsContent>
                
                <TabsContent value="replenishment" className="space-y-4">
                  {renderReplenishmentSettings()}
                </TabsContent>
                
                <TabsContent value="divergence" className="space-y-4">
                  {renderDivergenceSettings()}
                </TabsContent>
                
                <TabsContent value="margin" className="space-y-4">
                  {renderMarginSettings()}
                </TabsContent>
              </div>
            </Tabs>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
} 