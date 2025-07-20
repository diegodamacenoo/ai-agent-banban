'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { 
  Wrench, 
  Play, 
  Download, 
  TestTube, 
  Zap, 
  CheckCircle, 
  XCircle,
  Loader2
} from 'lucide-react';
import { 
  testModuleImplementation, 
  simulateModuleLoad 
} from '@/app/actions/admin/module-details';
import type { ModuleDetail, TestResult, LoadTestResult } from '../../types/module-details';

interface DebugToolsPanelProps {
  moduleId: string;
  moduleDetail: ModuleDetail;
}

export default function DebugToolsPanel({ moduleId, moduleDetail }: DebugToolsPanelProps) {
  const [testState, setTestState] = useState<{
    isRunning: boolean;
    result: TestResult | null;
  }>({ isRunning: false, result: null });

  const [loadTestState, setLoadTestState] = useState<{
    isRunning: boolean;
    result: LoadTestResult | null;
  }>({ isRunning: false, result: null });

  const handleTestImplementation = async () => {
    setTestState({ isRunning: true, result: null });
    
    try {
      const { data: result } = await testModuleImplementation(moduleId);
      setTestState({ isRunning: false, result });
    } catch (error) {
      setTestState({ 
        isRunning: false, 
        result: {
          success: false,
          message: 'Erro interno durante o teste',
          execution_time: 0,
          timestamp: new Date().toISOString()
        }
      });
    }
  };

  const handleLoadTest = async () => {
    setLoadTestState({ isRunning: true, result: null });
    
    try {
      const { data: result } = await simulateModuleLoad(moduleId);
      setLoadTestState({ isRunning: false, result });
    } catch (error) {
      setLoadTestState({ 
        isRunning: false, 
        result: {
          requests_per_second: 0,
          avg_response_time: 0,
          error_rate: 100,
          peak_memory_usage: 0,
          success: false,
          timestamp: new Date().toISOString()
        }
      });
    }
  };

  const handleExportData = () => {
    const data = {
      module: moduleDetail,
      export_timestamp: new Date().toISOString()
    };

    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `module-${moduleDetail.slug}-export.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Wrench className="w-5 h-5 mr-2" />
          Debug & Testing Tools
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Teste de Implementação */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900 flex items-center">
              <TestTube className="w-4 h-4 mr-2" />
              Teste de Implementação
            </h4>
            
            <div className="flex items-center space-x-3">
              <Button
                onClick={handleTestImplementation}
                disabled={testState.isRunning}
                className="flex items-center"
              >
                {testState.isRunning ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                {testState.isRunning ? 'Testando...' : 'Executar Teste'}
              </Button>
            </div>

            {testState.result && (
              <div className={`p-3 rounded-lg border ${
                testState.result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center space-x-2">
                  {testState.result.success ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span className="text-sm font-medium">
                    {testState.result.success ? 'Teste Passou' : 'Teste Falhou'}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {testState.result.execution_time}ms
                  </Badge>
                </div>
                <p className="text-sm text-gray-700 mt-1">
                  {testState.result.message}
                </p>
              </div>
            )}
          </div>

          {/* Teste de Carga */}
          <div className="space-y-3 pt-4 border-t">
            <h4 className="text-sm font-medium text-gray-900 flex items-center">
              <Zap className="w-4 h-4 mr-2" />
              Teste de Carga
            </h4>
            
            <Button
              onClick={handleLoadTest}
              disabled={loadTestState.isRunning}
              variant="outline"
              className="flex items-center"
            >
              {loadTestState.isRunning ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              {loadTestState.isRunning ? 'Executando...' : 'Simular Carga'}
            </Button>

            {loadTestState.result && (
              <div className={`p-3 rounded-lg border ${
                loadTestState.result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Requests/seg:</span>
                    <div className="font-medium">{loadTestState.result.requests_per_second}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Tempo médio:</span>
                    <div className="font-medium">{loadTestState.result.avg_response_time}ms</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Export */}
          <div className="space-y-3 pt-4 border-t">
            <h4 className="text-sm font-medium text-gray-900 flex items-center">
              <Download className="w-4 h-4 mr-2" />
              Export de Dados
            </h4>
            
            <Button
              onClick={handleExportData}
              variant="outline"
              className="flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar JSON
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}