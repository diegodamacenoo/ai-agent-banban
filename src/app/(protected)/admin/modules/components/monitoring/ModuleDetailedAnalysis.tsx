'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Tabs, TabsContent } from '@/shared/ui/tabs';
import { Progress } from '@/shared/ui/progress';
import { Separator } from '@/shared/ui/separator';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { 
  FileCheck, 
  FileX, 
  FileWarning, 
  Code2, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Info,
  Package,
  GitBranch,
  Gauge,
  RefreshCw
} from 'lucide-react';
import { moduleAnalyzerService, type ModuleAnalysis } from '@/core/services/module-analyzer';

interface ModuleDetailedAnalysisProps {
  moduleId: string;
  onClose?: () => void;
}

export function ModuleDetailedAnalysis({ moduleId, onClose }: ModuleDetailedAnalysisProps) {
  const [analysis, setAnalysis] = useState<ModuleAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('files');
  const [health, setHealth] = useState<{ score: number; issues: string[]; recommendations: string[] } | null>(null);

  useEffect(() => {
    loadAnalysis();
  }, [moduleId]);

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      const [analysisData, healthData] = await Promise.all([
        moduleAnalyzerService.analyzeModule(moduleId),
        moduleAnalyzerService.getModuleHealth(moduleId)
      ]);
      setAnalysis(analysisData);
      setHealth(healthData);
    } catch (error) {
      console.error('Erro ao carregar análise:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFileStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <FileCheck className="h-4 w-4 text-green-500" />;
      case 'missing':
        return <FileX className="h-4 w-4 text-red-500" />;
      case 'incomplete':
        return <FileWarning className="h-4 w-4 text-yellow-500" />;
      default:
        return <FileCheck className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSyntaxErrorIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const tabItems = [
    { id: 'files', label: 'Estrutura de Arquivos' },
    { id: 'syntax', label: 'Validação de Sintaxe' },
    { id: 'dependencies', label: 'Dependências' },
    { id: 'quality', label: 'Métricas de Qualidade' },
  ];

  if (loading) {
    return (
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <CardTitle>Analisando módulo {moduleId}...</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis || !health) {
    return (
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle>Erro ao carregar análise</CardTitle>
          <CardDescription>
            Não foi possível carregar a análise do módulo {moduleId}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={loadAnalysis}>Tentar novamente</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header com score geral */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="h-5 w-5" />
                Análise Detalhada: {moduleId}
              </CardTitle>
              <CardDescription>
                Última análise: {analysis.lastAnalyzed.toLocaleString('pt-BR')}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${getHealthColor(health.score)}`}>
                {health.score}/100
              </div>
              <div className="text-sm text-muted-foreground">Score de Saúde</div>
            </div>
          </div>
          <Progress value={health.score} className="mt-2" />
        </CardHeader>
      </Card>

      {/* Problemas críticos */}
      {health.issues.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Problemas Detectados ({health.issues.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {health.issues.map((issue, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <span>{issue}</span>
                </div>
              ))}
            </div>
            {health.recommendations.length > 0 && (
              <>
                <Separator className="my-4" />
                <div>
                  <h4 className="font-medium mb-2">Recomendações:</h4>
                  <div className="space-y-1">
                    {health.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Análise detalhada por categorias */}
      <div className="w-full">
        <Tabs
          items={tabItems}
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        />

        <div className="mt-4">
          {/* Estrutura de Arquivos */}
          <TabsContent value="files" activeValue={activeTab}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5" />
                  Estrutura de Arquivos
                </CardTitle>
                <CardDescription>
                  Análise dos arquivos obrigatórios e opcionais do módulo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {analysis.fileStructure.map((file, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                        <div className="flex-shrink-0 mt-0.5">
                          {getFileStatusIcon(file.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <code className="text-sm font-mono">{file.path}</code>
                            <Badge variant={
                              file.status === 'present' ? 'secondary' :
                              file.status === 'missing' ? 'destructive' : 'secondary'
                            }>
                              {file.status === 'present' ? 'Presente' :
                              file.status === 'missing' ? 'Faltando' : 'Incompleto'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{file.description}</p>
                          {file.issues && file.issues.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {file.issues.map((issue, issueIndex) => (
                                <div key={issueIndex} className="flex items-center gap-1 text-xs text-red-600">
                                  <span>•</span>
                                  <span>{issue}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Validação de Sintaxe */}
          <TabsContent value="syntax" activeValue={activeTab}>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Erros de Sintaxe */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code2 className="h-5 w-5" />
                    Erros de Sintaxe
                    <Badge variant={analysis.syntaxValidation.isValid ? 'secondary' : 'destructive'}>
                      {analysis.syntaxValidation.errors.length} problemas
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    {analysis.syntaxValidation.errors.length === 0 ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span>Nenhum erro de sintaxe encontrado</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {analysis.syntaxValidation.errors.map((error, index) => (
                          <div key={index} className="flex items-start gap-2 p-2 border rounded">
                            {getSyntaxErrorIcon(error.severity)}
                            <div className="flex-1">
                              <div className="text-sm font-medium">
                                Linha {error.line}, Coluna {error.column}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {error.message}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Análise de Imports */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Imports
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {analysis.syntaxValidation.imports.map((imp, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 border rounded">
                          {imp.isValid ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <code className="text-sm flex-1">{imp.path}</code>
                          {imp.issues && imp.issues.length > 0 && (
                            <div className="text-xs text-red-600">
                              {imp.issues.join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Dependências */}
          <TabsContent value="dependencies" activeValue={activeTab}>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Dependências do Package */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Dependências
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {analysis.dependencies.dependencies.map((dep, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-2">
                            {dep.isCompatible ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className="font-mono text-sm">{dep.name}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-mono">{dep.version}</div>
                            {dep.issues && dep.issues.length > 0 && (
                              <div className="text-xs text-red-600">
                                {dep.issues[0]}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Problemas de Dependências */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GitBranch className="h-5 w-5" />
                    Problemas Detectados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-4">
                      {/* Imports não utilizados */}
                      {analysis.dependencies.unusedImports.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm mb-2">Imports não utilizados:</h4>
                          <div className="space-y-1">
                            {analysis.dependencies.unusedImports.map((imp, index) => (
                              <div key={index} className="text-sm text-muted-foreground font-mono">
                                {imp}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Dependências circulares */}
                      {analysis.dependencies.circularDependencies.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm mb-2">Dependências circulares:</h4>
                          <div className="space-y-2">
                            {analysis.dependencies.circularDependencies.map((cycle, index) => (
                              <div key={index} className="text-sm p-2 bg-red-50 border border-red-200 rounded">
                                {cycle.join(' → ')}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {analysis.dependencies.unusedImports.length === 0 && 
                      analysis.dependencies.circularDependencies.length === 0 && (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span>Nenhum problema de dependência encontrado</span>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Métricas de Qualidade */}
          <TabsContent value="quality" activeValue={activeTab}>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Métricas principais */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gauge className="h-5 w-5" />
                    Métricas de Código
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Complexidade Ciclomática</span>
                        <span className={
                          analysis.qualityMetrics.cyclomaticComplexity > 15 ? 'text-red-500' :
                          analysis.qualityMetrics.cyclomaticComplexity > 10 ? 'text-yellow-500' : 'text-green-500'
                        }>
                          {analysis.qualityMetrics.cyclomaticComplexity}
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(analysis.qualityMetrics.cyclomaticComplexity * 4, 100)} 
                        className="h-2"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Linhas de Código</span>
                        <span>{analysis.qualityMetrics.linesOfCode}</span>
                      </div>
                      <Progress 
                        value={Math.min(analysis.qualityMetrics.linesOfCode / 10, 100)} 
                        className="h-2"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Linhas Duplicadas</span>
                        <span className={
                          analysis.qualityMetrics.duplicatedLines > 20 ? 'text-red-500' :
                          analysis.qualityMetrics.duplicatedLines > 10 ? 'text-yellow-500' : 'text-green-500'
                        }>
                          {analysis.qualityMetrics.duplicatedLines}
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(analysis.qualityMetrics.duplicatedLines * 2, 100)} 
                        className="h-2"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Cobertura de Comentários</span>
                        <span className={
                          analysis.qualityMetrics.commentCoverage < 70 ? 'text-red-500' :
                          analysis.qualityMetrics.commentCoverage < 85 ? 'text-yellow-500' : 'text-green-500'
                        }>
                          {analysis.qualityMetrics.commentCoverage}%
                        </span>
                      </div>
                      <Progress 
                        value={analysis.qualityMetrics.commentCoverage} 
                        className="h-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Resumo e ações */}
              <Card>
                <CardHeader>
                  <CardTitle>Resumo da Qualidade</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${getHealthColor(health.score)}`}>
                        {health.score}/100
                      </div>
                      <div className="text-sm text-muted-foreground">Score Geral</div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Arquivos OK:</span>
                        <span>{analysis.fileStructure.filter(f => f.status === 'present').length}/{analysis.fileStructure.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Erros de Sintaxe:</span>
                        <span className={analysis.syntaxValidation.errors.length > 0 ? 'text-red-500' : 'text-green-500'}>
                          {analysis.syntaxValidation.errors.length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Deps Incompatíveis:</span>
                        <span className={analysis.dependencies.dependencies.filter(d => !d.isCompatible).length > 0 ? 'text-red-500' : 'text-green-500'}>
                          {analysis.dependencies.dependencies.filter(d => !d.isCompatible).length}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Button onClick={loadAnalysis} className="w-full" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Atualizar Análise
                      </Button>
                      {onClose && (
                        <Button variant="outline" onClick={onClose} className="w-full" size="sm">
                          Fechar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </div>
      </div>
    </div>
  );
}