'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Trash2, Search, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/shared/ui/toast';
// TODO: Implement these functions in the admin modules actions
// import { 
//   detectOrphanModules, 
//   validateModuleIntegrity, 
//   removeOrphanModuleRecords 
// } from '@/app/actions/admin/modules';
import type { OrphanModule, ModuleIntegrityReport } from '@/shared/types/module-system';

export function OrphanModulesCard({ onReload }: { onReload?: () => void }) {
  const [isDetecting, setIsDetecting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [orphanModules, setOrphanModules] = useState<OrphanModule[]>([]);
  const [integrityReport, setIntegrityReport] = useState<ModuleIntegrityReport | null>(null);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const { toast } = useToast();

  const handleDetectOrphans = async () => {
    console.debug('🔍 Iniciando detecção de módulos órfãos...');
    setIsDetecting(true);
    
    try {
      console.debug('📡 Chamando detectOrphanModules...');
      const result = await detectOrphanModules();
      console.debug('📊 Resultado da detecção:', result);
      
      if (result.success) {
        console.debug('✅ Detecção bem-sucedida');
        console.debug('📋 Data recebida:', result.data);
        console.debug('📋 Tipo de data:', typeof result.data);
        console.debug('📋 É array?:', Array.isArray(result.data));
        
        // Garantir que result.data é um array
        const orphans = Array.isArray(result.data) ? result.data : [];
        console.debug('👥 Órfãos processados:', orphans);
        
        setOrphanModules(orphans);
        const orphanCount = orphans.length;
        
        toast(result.message || `${orphanCount} módulo(s) órfão(s) encontrado(s)`, {
          title: "Detecção concluída",
          variant: orphanCount > 0 ? "destructive" : "default"
        });
      } else {
        console.error('❌ Erro na detecção:', result.error);
        toast.error(result.error || "Erro ao detectar módulos órfãos", {
          title: "Erro na detecção",
        });
      }
    } catch (error) {
      console.error('💥 Erro interno na detecção:', error);
      toast.error("Erro interno ao detectar módulos órfãos", {
        title: "Erro na detecção",
      });
    } finally {
      setIsDetecting(false);
      console.debug('🏁 Detecção finalizada');
    }
  };

  const handleValidateIntegrity = async () => {
    setIsValidating(true);
    try {
      const result = await validateModuleIntegrity();
      
      if (result.success && result.data) {
        setIntegrityReport(result.data);
        toast(result.message || "Relatório de integridade gerado", {
          title: "Validação concluída",
        });
      } else {
        toast.error(result.error || "Erro ao validar integridade", {
          title: "Erro na validação",
        });
      }
    } catch (error) {
      toast.error("Erro interno ao validar integridade", {
        title: "Erro na validação",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveOrphans = async (moduleIds: string[]) => {
    if (moduleIds.length === 0) {
      toast.error("Selecione módulos para remover", {
        title: "Nenhum módulo selecionado",
      });
      return;
    }

    setIsRemoving(true);
    try {
      const result = await removeOrphanModuleRecords(moduleIds);
      
      if (result.success) {
        // Atualizar lista removendo módulos deletados
        setOrphanModules(prev => prev.filter(m => !moduleIds.includes(m.id)));
        setSelectedModules([]);
        
        toast(result.message || `${moduleIds.length} módulo(s) removido(s)`, {
          title: "Limpeza concluída",
        });

        onReload?.();

        // **CORREÇÃO**: Não fazer re-detecção automática para evitar loop
        // O estado já foi atualizado removendo os módulos da lista
        console.debug('✅ [OrphanModulesCard] Remoção concluída, estado atualizado localmente');
      } else {
        toast.error(result.error || "Erro ao remover módulos órfãos", {
          title: "Erro na remoção",
        });
      }
    } catch (error) {
      toast.error("Erro interno ao remover módulos órfãos", {
        title: "Erro na remoção",
      });
    } finally {
      setIsRemoving(false);
    }
  };

  const toggleModuleSelection = (moduleId: string) => {
    setSelectedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const getSeverityColor = (severity: OrphanModule['severity']) => {
    switch (severity) {
      case 'error': return 'destructive';
      case 'warning': return 'secondary';
      case 'info': return 'outline';
      default: return 'secondary';
    }
  };

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case 'cleanup': return 'destructive';
      case 'repair': return 'secondary';
      case 'success': return 'default';
      default: return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Gestão de Módulos Órfãos
        </CardTitle>
        <CardDescription>
          Detecte e limpe módulos registrados no banco de dados mas sem arquivos físicos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Ações de Detecção */}
        <div className="flex gap-4">
          <Button 
            onClick={handleDetectOrphans}
            disabled={isDetecting}
            variant="outline"
          >
            {isDetecting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            Detectar Órfãos
          </Button>
          
          <Button 
            onClick={handleValidateIntegrity}
            disabled={isValidating}
            variant="outline"
          >
            {isValidating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Validar Integridade
          </Button>
        </div>

        {/* Lista de Módulos Órfãos */}
        {orphanModules.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">
                Módulos Órfãos Encontrados ({orphanModules.length})
              </h4>
              {selectedModules.length > 0 && (
                <Button
                  onClick={() => handleRemoveOrphans(selectedModules)}
                  disabled={isRemoving}
                  variant="destructive"
                  size="sm"
                >
                  {isRemoving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Remover Selecionados ({selectedModules.length})
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {orphanModules.map((module) => (
                <div
                  key={module.id}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedModules.includes(module.id)}
                        onChange={() => toggleModuleSelection(module.id)}
                        className="rounded"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{module.name}</span>
                          <Badge variant={getSeverityColor(module.severity)}>
                            {module.severity}
                          </Badge>
                          {module.canAutoFix && (
                            <Badge variant="outline">Auto-fixável</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          ID: {module.id}
                        </p>
                      </div>
                    </div>
                    
                    {module.canAutoFix && (
                      <Button
                        onClick={() => handleRemoveOrphans([module.id])}
                        disabled={isRemoving}
                        variant="destructive"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remover
                      </Button>
                    )}
                  </div>
                  
                  <Alert>
                    <AlertDescription>{module.description}</AlertDescription>
                  </Alert>
                  
                  <p className="text-xs text-muted-foreground">
                    Caminho: {module.path}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Relatório de Integridade */}
        {integrityReport && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Relatório de Integridade</h4>
            
            {/* Resumo */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-muted p-3 rounded-lg text-center">
                <div className="text-2xl font-bold">{integrityReport.totalModules}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{integrityReport.validModules}</div>
                <div className="text-xs text-muted-foreground">Válidos</div>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-yellow-600">{integrityReport.brokenModules}</div>
                <div className="text-xs text-muted-foreground">Quebrados</div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">{integrityReport.orphanModules}</div>
                <div className="text-xs text-muted-foreground">Órfãos</div>
              </div>
            </div>

            {/* Recomendações */}
            {integrityReport.recommendations.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium">Recomendações</h5>
                {integrityReport.recommendations.map((rec, index) => (
                  <Alert key={index}>
                    <AlertDescription className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getRecommendationColor(rec.type)}>
                            {rec.severity}
                          </Badge>
                          <span className="font-medium">{rec.title}</span>
                        </div>
                        <p className="text-sm mt-1">{rec.description}</p>
                      </div>
                      
                      {rec.action === 'remove_orphan_records' && rec.moduleIds.length > 0 && (
                        <Button
                          onClick={() => handleRemoveOrphans(rec.moduleIds)}
                          disabled={isRemoving}
                          variant="destructive"
                          size="sm"
                        >
                          Limpar
                        </Button>
                      )}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Estado Vazio */}
        {orphanModules.length === 0 && !integrityReport && (
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma análise executada ainda.</p>
            <p className="text-sm">Use os botões acima para detectar problemas.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 