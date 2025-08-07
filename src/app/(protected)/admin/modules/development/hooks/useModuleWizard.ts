'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  WizardState,
  WizardStep,
  StepValidationStatus,
  ModuleCreationConfig,
  ModuleType,
  BasicModuleConfig,
  ClientSpecificConfig
} from '../types';
import { WIZARD_STEPS, getNextStep, getPreviousStep, isStepVisible, getEffectiveStepIndex, getTotalVisibleSteps, getVisibleSteps } from '../config/wizard-steps';

/**
 * Hook para gerenciar o estado e fluxo do wizard de criação de módulos.
 * Fornece funcionalidades completas de navegação, validação e geração de código.
 */
export function useModuleWizard() {
  // Estado principal do wizard
  const [state, setState] = useState<WizardState>(() => {
    const initialConfig: Partial<ModuleCreationConfig> = {
      basic: {
        name: '',
        slug: '',
        description: '',
        version: '1.0.0',
        category: '',
        icon: 'Package',
        route_pattern: '',
        supports_multi_tenant: true,
        exclusive_tenant_id: null,
        auto_create_standard: true,
        tags: []
      },
    };

    return {
      currentStep: 'module-type',
      steps: WIZARD_STEPS,
      config: {
        ...initialConfig,
        type: undefined // Iniciar sem tipo selecionado
      },
      validation: {
        'module-type': 'pending',
        'basic-config': 'pending',
        'implementation-config': 'pending',
        'client-config': 'pending',
        'final-review': 'pending'
      },
      visitedSteps: new Set<WizardStep>(['module-type']), // Track visited steps
      progress: {
        currentStepIndex: 0,
        totalSteps: WIZARD_STEPS.length,
        percentage: 0
      },
      canProceed: false,
      canGoBack: false,
      errors: {},
      warnings: {}
    };
  });

  // Estado de persistência (localStorage)
  const STORAGE_KEY = 'module-wizard-state';

  // Throttle para salvar no localStorage
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Carregar estado inicial do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsedState = JSON.parse(saved);
        // Só restaurar se o estado salvo é mais recente que 1 hora
        const saveTime = new Date(parsedState.savedAt || 0);
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        
        if (saveTime > oneHourAgo) {
          setState(prev => ({
            ...prev,
            ...parsedState,
            visitedSteps: new Set(parsedState.visitedSteps || [prev.currentStep])
          }));
        } else {
          // Limpar estado antigo
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      console.debug('Erro ao carregar estado salvo:', error);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Salvar estado no localStorage com throttle de 2 segundos
  const saveState = useCallback((newState: Partial<WizardState>) => {
    // Limpar timeout anterior
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    
    // Criar novo timeout
    const timeout = setTimeout(() => {
      try {
        const stateToSave = {
          ...newState,
          savedAt: new Date().toISOString(),
          visitedSteps: Array.from(newState.visitedSteps || [])
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
      } catch (error) {
        console.debug('Erro ao salvar estado:', error);
      }
    }, 2000);
    
    setSaveTimeout(timeout);
  }, [saveTimeout]);

  // Cleanup do timeout quando o hook for desmontado
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [saveTimeout]);

  // Tipo de módulo atual
  const moduleType = useMemo(() => state.config.type, [state.config.type]);

  // Cálculo do progresso efetivo baseado em steps visíveis
  const effectiveProgress = useMemo(() => {
    const config = state.config;
    const totalVisible = getTotalVisibleSteps(moduleType, config);
    const currentIndex = getEffectiveStepIndex(state.currentStep, moduleType, config);
    const percentage = totalVisible > 0 ? Math.round((currentIndex / (totalVisible - 1)) * 100) : 0;
    
    return {
      currentStepIndex: currentIndex,
      totalSteps: totalVisible,
      percentage: Math.max(0, Math.min(100, percentage))
    };
  }, [state.currentStep, moduleType, state.config]);

  // Validação de step usando schema centralizado
  const validateStep = useCallback((stepId: WizardStep, configOverride?: Partial<ModuleCreationConfig>): StepValidationStatus => {
    const config = configOverride || state.config;

    try {
      // Importar dinâmicamente para evitar problema de circular import
      const { validateWizardStep } = require('../schemas/wizard-validation');
      
      switch (stepId) {
        case 'module-type':
          const typeValidation = validateWizardStep('module-type', { type: config.type });
          return typeValidation.success ? 'valid' : (config.type ? 'invalid' : 'pending');

        case 'basic-config':
          const basicValidation = validateWizardStep('basic-config', { basic: config.basic });
          return basicValidation.success ? 'valid' : 'invalid';

        case 'implementation-config':
          // Lógica especial: se auto_create_standard, sempre válido
          if (config.type === 'standard' && config.basic?.auto_create_standard) {
            return 'valid';
          }
          
          // Se já tem implementação criada, válido
          const hasExistingImplementation = !!((config as any).auto_created_implementation || (config as any).implementation);
          if (hasExistingImplementation) {
            return 'valid';
          }
          
          // Validar dados da implementação se fornecidos
          if (config.implementation) {
            const implValidation = validateWizardStep('implementation-config', { 
              implementation: config.implementation,
              auto_generated: (config as any).auto_generated 
            });
            return implValidation.success ? 'valid' : 'invalid';
          }
          
          return 'pending';

        case 'client-config':
          // Sempre válido, step é opcional
          return 'valid';

        case 'final-review':
          // Validar configuração completa
          const fullValidation = validateWizardStep('final-review', {
            type: config.type,
            basic: config.basic,
            implementation: config.implementation,
            client_assignments: (config as any).client_assignments
          });
          return fullValidation.success ? 'valid' : 'invalid';

        default:
          return 'pending';
      }
    } catch (error) {
      console.debug('Erro na validação centralizada, usando fallback:', error);
      
      // Fallback para validação básica
      switch (stepId) {
        case 'module-type':
          return config.type ? 'valid' : 'pending';
        case 'basic-config':
          const basic = config.basic;
          if (!basic?.name || !basic?.description || !basic?.category) {
            return 'invalid';
          }
          return basic.name.length >= 2 ? 'valid' : 'invalid';
        case 'final-review':
          return (config.type && config.basic?.name && config.basic?.description && config.basic?.category) ? 'valid' : 'invalid';
        default:
          return 'valid';
      }
    }
  }, [state.config]);

  // Atualizar configuração
  const updateConfig = useCallback(<K extends keyof ModuleCreationConfig>(
    section: K,
    updates: ModuleCreationConfig[K] extends object 
      ? Partial<ModuleCreationConfig[K]> 
      : ModuleCreationConfig[K]
  ) => {
    setState(prev => {
      let newConfig;
      
      if (section === 'type') {
        // Para type, fazer atribuição direta
        newConfig = {
          ...prev.config,
          [section]: updates
        };
      } else if (typeof updates === 'object' && updates !== null && !Array.isArray(updates)) {
        // Para objetos, fazer merge
        newConfig = {
          ...prev.config,
          [section]: {
            ...(prev.config[section] && typeof prev.config[section] === 'object' ? prev.config[section] as object : {}),
            ...updates
          }
        };
      } else {
        // Para outros tipos, atribuição direta
        newConfig = {
          ...prev.config,
          [section]: updates
        };
      }
      
      // Lógica especial para auto_create_standard: propagar decisão para flow_config
      if (section === 'basic' && updates && typeof updates === 'object' && 'auto_create_standard' in updates) {
        newConfig = {
          ...newConfig,
          flow_config: {
            ...newConfig.flow_config,
            skip_implementation_config: (updates as any).auto_create_standard
          }
        };
      }
      
      // Calculate validation immediately for current step
      const currentStepValidation = validateStep(prev.currentStep, newConfig);
      const newCanProceed = currentStepValidation === 'valid';
      
      const newState = {
        ...prev,
        config: newConfig,
        canProceed: newCanProceed,
        validation: {
          ...prev.validation,
          [prev.currentStep]: currentStepValidation
        }
      };
      
      
      saveState(newState);
      return newState;
    });
  }, [saveState, validateStep]);

  // Navegação
  const goToStep = useCallback((stepId: WizardStep) => {
    if (!isStepVisible(stepId, moduleType, state.config)) return;
    
    setState(prev => {
      const newVisitedSteps = new Set(prev.visitedSteps);
      newVisitedSteps.add(stepId); // Mark step as visited
      
      const newState = {
        ...prev,
        currentStep: stepId,
        visitedSteps: newVisitedSteps,
        canProceed: validateStep(stepId) === 'valid',
        canGoBack: stepId !== 'module-type'
      };
      saveState(newState);
      return newState;
    });
  }, [moduleType, validateStep, saveState]);

  const nextStep = useCallback(() => {
    const next = getNextStep(state.currentStep, moduleType, state.config);
    if (next) {
      goToStep(next);
    }
  }, [state.currentStep, moduleType, state.config, goToStep]);

  const previousStep = useCallback(() => {
    const previous = getPreviousStep(state.currentStep, moduleType, state.config);
    if (previous) {
      goToStep(previous);
    }
  }, [state.currentStep, moduleType, state.config, goToStep]);

  // Reset do wizard
  const reset = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: 'module-type',
      visitedSteps: new Set<WizardStep>(['module-type']), // Reset visited steps
      config: {
        basic: {
          name: '',
          slug: '',
          description: '',
          version: '1.0.0',
          category: '',
          icon: 'Package',
          route_pattern: '',
          supports_multi_tenant: true,
          exclusive_tenant_id: null,
          auto_create_standard: true,
          tags: []
        },
      },
      validation: {
        'module-type': 'pending',
        'basic-config': 'pending',
        'implementation-config': 'pending',
        'client-config': 'pending',
        'final-review': 'pending'
      },
      errors: {},
      warnings: {}
    }));
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Clear localStorage manually
  const clearStorage = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    console.debug('localStorage cleared manually');
  }, []);


  // Atualizar validações de forma otimizada - apenas quando necessário
  useEffect(() => {
    const newValidation: Record<WizardStep, StepValidationStatus> = { ...state.validation };
    let hasChanges = false;
    
    // Só valida o step atual e re-valida steps visitados apenas se config mudou
    const currentStepValidation = validateStep(state.currentStep);
    if (newValidation[state.currentStep] !== currentStepValidation) {
      newValidation[state.currentStep] = currentStepValidation;
      hasChanges = true;
    }

    // Só atualiza estado se houve mudanças reais
    if (hasChanges) {
      setState(prev => {
        const canProceed = currentStepValidation === 'valid';
        const canGoBack = prev.currentStep !== 'module-type';
        
        return {
          ...prev,
          validation: newValidation,
          canProceed,
          canGoBack,
          progress: effectiveProgress
        };
      });
    }
  }, [state.config, state.currentStep, validateStep, effectiveProgress]);

  return {
    // Estado
    state,
    moduleType,
    
    // Configuração
    updateConfig,
    
    // Navegação
    goToStep,
    nextStep,
    previousStep,
    
    // Ações
    reset,
    
    // Utilidades
    validateStep,
    isStepVisible: (stepId: WizardStep) => isStepVisible(stepId, moduleType, state.config),
    
    // Status computados
    canProceed: state.canProceed,
    canGoBack: state.canGoBack,
    progress: effectiveProgress
  };
}