'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { 
  Download, 
  Upload, 
  FileText, 
  AlertTriangle, 
  CheckCircle,
  Copy,
  FileCode
} from 'lucide-react';
import { AlertThreshold } from '../hooks/useThresholds';

interface ThresholdImportExportProps {
  thresholds: AlertThreshold[];
  onImport?: (thresholds: AlertThreshold[]) => void;
  onExport?: () => void;
  className?: string;
}

export function ThresholdImportExport({ 
  thresholds, 
  onImport, 
  onExport, 
  className 
}: ThresholdImportExportProps) {
  const [importData, setImportData] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [previewData, setPreviewData] = useState<AlertThreshold[]>([]);

  // Exportar configurações
  const handleExport = () => {
    const exportData = {
      version: '2.0.0',
      exported_at: new Date().toISOString(),
      exported_by: 'BanBan Alerts System',
      thresholds: thresholds.map(threshold => ({
        alert_type: threshold.alert_type,
        threshold_value: threshold.threshold_value,
        threshold_unit: threshold.threshold_unit,
        priority: threshold.priority,
        auto_escalate: threshold.auto_escalate,
        escalation_delay_minutes: threshold.escalation_delay_minutes,
        description: threshold.description,
        source: threshold.source,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `banban-alert-thresholds-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (onExport) {
      onExport();
    }
  };

  // Copiar configurações para clipboard
  const handleCopyToClipboard = async () => {
    const exportData = {
      version: '2.0.0',
      exported_at: new Date().toISOString(),
      thresholds: thresholds.map(threshold => ({
        alert_type: threshold.alert_type,
        threshold_value: threshold.threshold_value,
        threshold_unit: threshold.threshold_unit,
        priority: threshold.priority,
        auto_escalate: threshold.auto_escalate,
        escalation_delay_minutes: threshold.escalation_delay_minutes,
      })),
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
      setImportSuccess(true);
      setTimeout(() => setImportSuccess(false), 3000);
    } catch (error) {
      setImportError('Falha ao copiar para clipboard');
    }
  };

  // Validar dados de importação
  const validateImportData = (data: any): AlertThreshold[] => {
    if (!data || typeof data !== 'object') {
      throw new Error('Formato de dados inválido');
    }

    if (!data.thresholds || !Array.isArray(data.thresholds)) {
      throw new Error('Campo "thresholds" não encontrado ou não é um array');
    }

    const validPriorities = ['CRITICAL', 'WARNING', 'INFO', 'OPPORTUNITY'];
    const validAlertTypes = [
      'STOCK_CRITICAL', 'STOCK_LOW', 'MARGIN_LOW', 
      'SLOW_MOVING', 'OVERSTOCK', 'SEASONAL_OPPORTUNITY'
    ];

    return data.thresholds.map((threshold: any, index: number) => {
      // Validações obrigatórias
      if (!threshold.alert_type) {
        throw new Error(`Threshold ${index + 1}: campo "alert_type" obrigatório`);
      }

      if (typeof threshold.threshold_value !== 'number') {
        throw new Error(`Threshold ${index + 1}: campo "threshold_value" deve ser um número`);
      }

      if (!threshold.priority || !validPriorities.includes(threshold.priority)) {
        throw new Error(`Threshold ${index + 1}: prioridade inválida (deve ser: ${validPriorities.join(', ')})`);
      }

      // Avisos para tipos não reconhecidos
      if (!validAlertTypes.includes(threshold.alert_type)) {
        console.warn(`Threshold ${index + 1}: tipo de alerta não reconhecido: ${threshold.alert_type}`);
      }

      return {
        alert_type: threshold.alert_type,
        threshold_value: threshold.threshold_value,
        threshold_unit: threshold.threshold_unit || 'value',
        priority: threshold.priority,
        auto_escalate: threshold.auto_escalate || false,
        escalation_delay_minutes: threshold.escalation_delay_minutes || 60,
        description: threshold.description || '',
        source: 'custom' as const,
        is_editable: true,
      };
    });
  };

  // Preview da importação
  const handlePreviewImport = () => {
    try {
      setImportError(null);
      const parsedData = JSON.parse(importData);
      const validatedThresholds = validateImportData(parsedData);
      setPreviewData(validatedThresholds);
      setShowImportPreview(true);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Erro ao processar dados');
      setShowImportPreview(false);
    }
  };

  // Confirmar importação
  const handleConfirmImport = () => {
    if (onImport && previewData.length > 0) {
      onImport(previewData);
      setImportData('');
      setShowImportPreview(false);
      setImportSuccess(true);
      setTimeout(() => setImportSuccess(false), 3000);
    }
  };

  // Cancelar importação
  const handleCancelImport = () => {
    setShowImportPreview(false);
    setPreviewData([]);
    setImportError(null);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Download className="h-5 w-5 mr-2" />
            Exportar Configurações
          </CardTitle>
          <CardDescription>
            Salve suas configurações de thresholds para backup ou transferência
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Button onClick={handleExport} className="flex-1">
              <FileText className="h-4 w-4 mr-2" />
              Baixar Arquivo JSON
            </Button>
            <Button variant="outline" onClick={handleCopyToClipboard} className="flex-1">
              <Copy className="h-4 w-4 mr-2" />
              Copiar para Clipboard
            </Button>
          </div>

          {importSuccess && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Configurações copiadas para clipboard com sucesso!
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            Importar Configurações
          </CardTitle>
          <CardDescription>
            Importe configurações de thresholds de um arquivo JSON ou clipboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showImportPreview ? (
            <>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Cole o JSON das configurações:
                </label>
                <textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder={`{
  "version": "2.0.0",
  "thresholds": [
    {
      "alert_type": "STOCK_CRITICAL",
      "threshold_value": 5,
      "priority": "CRITICAL",
      "auto_escalate": true
    }
  ]
}`}
                  className="w-full h-40 px-3 py-2 border rounded-md font-mono text-sm resize-none"
                />
              </div>

              <div className="flex space-x-2">
                <Button 
                  onClick={handlePreviewImport} 
                  disabled={!importData.trim()}
                  className="flex-1"
                >
                  <FileCode className="h-4 w-4 mr-2" />
                  Visualizar Preview
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-md">
                <h4 className="font-medium mb-2">Preview da Importação</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  {previewData.length} thresholds serão importados:
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {previewData.map((threshold, index) => (
                    <div key={index} className="text-sm p-2 bg-background rounded border">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{threshold.alert_type}</span>
                        <span className="text-muted-foreground">
                          {threshold.threshold_value} {threshold.threshold_unit}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Prioridade: {threshold.priority} | 
                        Escalação: {threshold.auto_escalate ? 'Sim' : 'Não'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-2">
                <Button onClick={handleConfirmImport} className="flex-1">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmar Importação
                </Button>
                <Button variant="outline" onClick={handleCancelImport} className="flex-1">
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {importError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{importError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Template Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Template de Exemplo</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`{
  "version": "2.0.0",
  "thresholds": [
    {
      "alert_type": "STOCK_CRITICAL",
      "threshold_value": 5,
      "threshold_unit": "units",
      "priority": "CRITICAL",
      "auto_escalate": true,
      "escalation_delay_minutes": 15,
      "description": "Estoque crítico"
    },
    {
      "alert_type": "MARGIN_LOW",
      "threshold_value": 0.25,
      "threshold_unit": "percentage",
      "priority": "WARNING", 
      "auto_escalate": false,
      "escalation_delay_minutes": 60,
      "description": "Margem baixa"
    }
  ]
}`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}