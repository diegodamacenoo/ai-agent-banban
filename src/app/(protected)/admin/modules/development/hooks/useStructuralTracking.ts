'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StructuralTrackingState,
  StructuralCategory,
  ModuleStructureCheck,
  ValidationResult,
  ModuleValidationConfig
} from '../types';
import {
  STRUCTURAL_CATEGORIES,
  STRUCTURAL_TRACKING_CONFIG,
  MODULE_VALIDATION_PRESETS
} from '../config/structural-validation';
import { saveToStorage, loadFromStorage } from '../utils';

/**
 * Hook para gerenciar o sistema de tracking estrutural de módulos.
 */
export function useStructuralTracking(moduleConfig?: ModuleValidationConfig) {
  const [trackingState, setTrackingState] = useState<StructuralTrackingState>({
    categories: STRUCTURAL_CATEGORIES,
    overallProgress: { completed: 0, total: 0, percentage: 0 },
    healthScore: 0,
    criticalIssues: [],
    lastValidation: null,
    isValidating: false,
    autoValidation: true
  });

  const [validationResults, setValidationResults] = useState<Record<string, ValidationResult>>({});
  const [validationHistory, setValidationHistory] = useState<ValidationResult[]>([]);

  // Carregar estado salvo
  useEffect(() => {
    try {
      const savedState = loadFromStorage('structural_tracking_state', null);
      const savedResults = loadFromStorage('validation_results', {});
      const savedHistory = loadFromStorage('validation_history', []);

      if (savedState) {
        setTrackingState(prev => ({ ...prev, ...savedState, isValidating: false }));
      }
      setValidationResults(savedResults);
      setValidationHistory(savedHistory);
    } catch (error) {
      console.debug('Erro ao carregar estado do tracking estrutural:', error);
    }
  }, []);

  // Auto-salvar estado
  useEffect(() => {
    const stateToSave = {
      ...trackingState,
      isValidating: false // Não salvar estado de validação
    };
    saveToStorage('structural_tracking_state', stateToSave);
    saveToStorage('validation_results', validationResults);
    saveToStorage('validation_history', validationHistory.slice(-50)); // Manter apenas últimos 50 resultados
  }, [trackingState, validationResults, validationHistory]);

  // Simular validação de uma verificação específica
  const validateCheck = useCallback(async (check: ModuleStructureCheck): Promise<ValidationResult> => {
    const startTime = Date.now();
    
    // Simular delay de validação
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));
    
    // Simular resultado baseado na prioridade (críticos têm maior chance de falhar)
    const shouldPass = check.priority === 'critical' 
      ? Math.random() > 0.3 
      : Math.random() > 0.1;

    const result: ValidationResult = {
      checkId: check.id,
      status: shouldPass ? 'valid' : (check.priority === 'critical' ? 'invalid' : 'warning'),
      message: shouldPass 
        ? `${check.name} está conforme` 
        : `${check.name} precisa de atenção`,
      details: shouldPass 
        ? [`Verificação de ${check.name} passou com sucesso`]
        : [`Problema detectado em ${check.path}`, 'Verifique a documentação para correções'],
      suggestions: shouldPass ? [] : check.validationRules.map(rule => rule.suggestion).filter(Boolean) as string[],
      timestamp: new Date(),
      executionTime: Date.now() - startTime
    };

    return result;
  }, []);

  // Validar categoria completa
  const validateCategory = useCallback(async (categoryId: string) => {
    const category = trackingState.categories.find(cat => cat.id === categoryId);
    if (!category) return;

    // Atualizar status da categoria para 'validating'
    setTrackingState(prev => ({
      ...prev,
      categories: prev.categories.map(cat =>
        cat.id === categoryId
          ? { ...cat, overallStatus: 'validating' }
          : cat
      )
    }));

    const results: ValidationResult[] = [];
    
    // Validar checks em lotes para não sobrecarregar
    for (let i = 0; i < category.checks.length; i += STRUCTURAL_TRACKING_CONFIG.BATCH_SIZE) {
      const batch = category.checks.slice(i, i + STRUCTURAL_TRACKING_CONFIG.BATCH_SIZE);
      
      const batchResults = await Promise.all(
        batch.map(async (check) => {
          // Atualizar status do check individual
          setTrackingState(prev => ({
            ...prev,
            categories: prev.categories.map(cat =>
              cat.id === categoryId
                ? {
                    ...cat,
                    checks: cat.checks.map(c =>
                      c.id === check.id ? { ...c, status: 'validating' } : c
                    )
                  }
                : cat
            )
          }));

          try {
            const result = await validateCheck(check);
            
            // Atualizar status do check baseado no resultado
            const newStatus = result.status === 'valid' ? 'valid' : 
                             result.status === 'warning' ? 'warning' : 'invalid';
            
            setTrackingState(prev => ({
              ...prev,
              categories: prev.categories.map(cat =>
                cat.id === categoryId
                  ? {
                      ...cat,
                      checks: cat.checks.map(c =>
                        c.id === check.id 
                          ? { ...c, status: newStatus, lastChecked: new Date() }
                          : c
                      )
                    }
                  : cat
              )
            }));

            return result;
          } catch (error) {
            console.debug(`Erro na validação de ${check.id}:`, error);
            return {
              checkId: check.id,
              status: 'error' as const,
              message: 'Erro durante validação',
              details: [String(error)],
              suggestions: [],
              timestamp: new Date(),
              executionTime: 0
            };
          }
        })
      );

      results.push(...batchResults);
    }

    // Atualizar resultados
    const newResults = { ...validationResults };
    results.forEach(result => {
      newResults[result.checkId] = result;
    });
    setValidationResults(newResults);
    setValidationHistory(prev => [...prev, ...results]);

    // Calcular status final da categoria
    const completedChecks = results.filter(r => r.status === 'valid').length;
    const criticalIssues = results.filter(r => r.status === 'invalid' && 
      category.checks.find(c => c.id === r.checkId)?.priority === 'critical').length;
    
    const overallStatus = criticalIssues > 0 ? 'invalid' : 
                         results.some(r => r.status === 'warning') ? 'warning' : 'valid';

    setTrackingState(prev => ({
      ...prev,
      categories: prev.categories.map(cat =>
        cat.id === categoryId
          ? {
              ...cat,
              overallStatus,
              completedChecks,
              criticalIssues
            }
          : cat
      )
    }));
  }, [trackingState.categories, validationResults, validateCheck]);

  // Validar todas as categorias
  const validateAll = useCallback(async () => {
    setTrackingState(prev => ({ ...prev, isValidating: true }));
    
    try {
      const enabledCategories = moduleConfig?.enabledCategories || 
        trackingState.categories.map(cat => cat.id);
      
      for (const categoryId of enabledCategories) {
        await validateCategory(categoryId);
      }
    } finally {
      setTrackingState(prev => ({ 
        ...prev, 
        isValidating: false, 
        lastValidation: new Date() 
      }));
    }
  }, [moduleConfig, trackingState.categories, validateCategory]);

  // Calcular progresso geral e score de saúde
  const overallMetrics = useMemo(() => {
    const enabledCategories = moduleConfig?.enabledCategories 
      ? trackingState.categories.filter(cat => moduleConfig.enabledCategories.includes(cat.id))
      : trackingState.categories;

    const totalChecks = enabledCategories.reduce((acc, cat) => acc + cat.totalChecks, 0);
    const completedChecks = enabledCategories.reduce((acc, cat) => acc + cat.completedChecks, 0);
    const percentage = totalChecks > 0 ? Math.round((completedChecks / totalChecks) * 100) : 0;

    // Calcular health score baseado nos pesos
    const weights = STRUCTURAL_TRACKING_CONFIG.HEALTH_SCORE_WEIGHTS;
    let totalWeight = 0;
    let weightedScore = 0;

    enabledCategories.forEach(category => {
      category.checks.forEach(check => {
        const result = validationResults[check.id];
        if (result) {
          const weight = weights[check.priority];
          totalWeight += weight;
          
          if (result.status === 'valid') {
            weightedScore += weight;
          } else if (result.status === 'warning') {
            weightedScore += weight * 0.7;
          }
          // Invalid e error não somam pontos
        }
      });
    });

    const healthScore = totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) : 0;

    // Identificar issues críticos
    const criticalIssues = enabledCategories.flatMap(category =>
      category.checks.filter(check => {
        const result = validationResults[check.id];
        return check.priority === 'critical' && result?.status === 'invalid';
      })
    );

    return {
      totalChecks,
      completedChecks,
      percentage,
      healthScore,
      criticalIssues
    };
  }, [trackingState.categories, moduleConfig, validationResults]);

  // Atualizar estado com métricas calculadas
  useEffect(() => {
    setTrackingState(prev => ({
      ...prev,
      overallProgress: {
        completed: overallMetrics.completedChecks,
        total: overallMetrics.totalChecks,
        percentage: overallMetrics.percentage
      },
      healthScore: overallMetrics.healthScore,
      criticalIssues: overallMetrics.criticalIssues
    }));
  }, [overallMetrics]);

  // Auto-validação
  useEffect(() => {
    if (!trackingState.autoValidation) return;

    const interval = setInterval(() => {
      if (!trackingState.isValidating) {
        validateAll();
      }
    }, STRUCTURAL_TRACKING_CONFIG.AUTO_VALIDATION_INTERVAL);

    return () => clearInterval(interval);
  }, [trackingState.autoValidation, trackingState.isValidating, validateAll]);

  // Função para aplicar preset de configuração
  const applyValidationPreset = useCallback((presetName: keyof typeof MODULE_VALIDATION_PRESETS) => {
    const preset = MODULE_VALIDATION_PRESETS[presetName];
    if (preset) {
      // Aplicar configuração do preset
      // Por agora, apenas trigger uma nova validação com o preset
      validateAll();
    }
  }, [validateAll]);

  // Função para resetar uma categoria
  const resetCategory = useCallback((categoryId: string) => {
    setTrackingState(prev => ({
      ...prev,
      categories: prev.categories.map(cat =>
        cat.id === categoryId
          ? {
              ...cat,
              overallStatus: 'pending',
              completedChecks: 0,
              criticalIssues: 0,
              checks: cat.checks.map(check => ({
                ...check,
                status: 'pending',
                lastChecked: undefined
              }))
            }
          : cat
      )
    }));

    // Limpar resultados da categoria
    const newResults = { ...validationResults };
    const categoryChecks = trackingState.categories.find(cat => cat.id === categoryId)?.checks || [];
    categoryChecks.forEach(check => {
      delete newResults[check.id];
    });
    setValidationResults(newResults);
  }, [trackingState.categories, validationResults]);

  return {
    // Estado
    trackingState,
    validationResults,
    validationHistory,
    
    // Ações
    validateCategory,
    validateAll,
    resetCategory,
    applyValidationPreset,
    
    // Configuração
    setAutoValidation: useCallback((enabled: boolean) => {
      setTrackingState(prev => ({ ...prev, autoValidation: enabled }));
    }, []),
    
    // Métricas computadas
    overallMetrics
  };
}