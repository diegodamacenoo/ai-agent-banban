'use client';

import { useReducer, useCallback, useMemo, useEffect } from 'react';
import { WizardState, WizardStep, StepValidationStatus, ModuleCreationConfig } from '../types';
import { WIZARD_STEPS, getNextStep, getPreviousStep, isStepVisible, getEffectiveStepIndex, getTotalVisibleSteps } from '../config/wizard-steps';

/**
 * Actions para o reducer do wizard
 */
export type WizardAction = 
  | { type: 'SET_CURRENT_STEP'; step: WizardStep }
  | { type: 'UPDATE_CONFIG'; section: keyof ModuleCreationConfig; data: any }
  | { type: 'SET_VALIDATION'; step: WizardStep; status: StepValidationStatus }
  | { type: 'SET_ERROR'; step: WizardStep; error: string | null }
  | { type: 'SET_WARNING'; step: WizardStep; warning: string | null }
  | { type: 'RESET_WIZARD' }
  | { type: 'RESTORE_STATE'; state: Partial<WizardState> }
  | { type: 'PUSH_HISTORY'; action: string; timestamp: number }
  | { type: 'UNDO_LAST_ACTION' };

/**
 * Estado do histórico de ações
 */
interface ActionHistory {
  action: string;
  timestamp: number;
  previousState: WizardState;
}

/**
 * Estado estendido com histórico
 */
interface WizardStateWithHistory extends WizardState {
  history: ActionHistory[];
  maxHistorySize: number;
}

/**
 * Estado inicial do wizard com histórico
 */
function getInitialState(): WizardStateWithHistory {
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
    visitedSteps: new Set<WizardStep>(['module-type']),
    progress: {
      currentStepIndex: 0,
      totalSteps: WIZARD_STEPS.length,
      percentage: 0
    },
    canProceed: false,
    canGoBack: false,
    errors: {},
    warnings: {},
    // Estado do histórico
    history: [],
    maxHistorySize: 20 // Manter últimas 20 ações
  };
}

/**
 * Reducer para gerenciar o estado do wizard com histórico
 */
function wizardReducer(state: WizardStateWithHistory, action: WizardAction): WizardStateWithHistory {
  // Salvar estado atual no histórico para ações que modificam estado
  const saveToHistory = (actionDescription: string): ActionHistory => ({
    action: actionDescription,
    timestamp: Date.now(),
    previousState: {
      currentStep: state.currentStep,
      steps: state.steps,
      config: structuredClone(state.config),
      validation: { ...state.validation },
      visitedSteps: new Set(state.visitedSteps),
      progress: { ...state.progress },
      canProceed: state.canProceed,
      canGoBack: state.canGoBack,
      errors: { ...state.errors },
      warnings: { ...state.warnings }
    }
  });

  switch (action.type) {
    case 'SET_CURRENT_STEP': {
      const newVisitedSteps = new Set(state.visitedSteps);
      newVisitedSteps.add(action.step);
      
      const historyEntry = saveToHistory(`Navegou para step: ${action.step}`);
      const newHistory = [...state.history, historyEntry].slice(-state.maxHistorySize);
      
      return {
        ...state,
        currentStep: action.step,
        visitedSteps: newVisitedSteps,
        canGoBack: action.step !== 'module-type',
        history: newHistory
      };
    }

    case 'UPDATE_CONFIG': {
      const historyEntry = saveToHistory(`Atualizou ${action.section}`);
      const newHistory = [...state.history, historyEntry].slice(-state.maxHistorySize);
      
      let newConfig;
      
      if (action.section === 'type') {
        newConfig = {
          ...state.config,
          [action.section]: action.data
        };
      } else if (typeof action.data === 'object' && action.data !== null && !Array.isArray(action.data)) {
        newConfig = {
          ...state.config,
          [action.section]: {
            ...(state.config[action.section] && typeof state.config[action.section] === 'object' ? state.config[action.section] as object : {}),
            ...action.data
          }
        };
      } else {
        newConfig = {
          ...state.config,
          [action.section]: action.data
        };
      }
      
      // Lógica especial para auto_create_standard
      if (action.section === 'basic' && action.data && typeof action.data === 'object' && 'auto_create_standard' in action.data) {
        newConfig = {
          ...newConfig,
          flow_config: {
            ...newConfig.flow_config,
            skip_implementation_config: (action.data as any).auto_create_standard
          }
        };
      }
      
      return {
        ...state,
        config: newConfig,
        history: newHistory
      };
    }

    case 'SET_VALIDATION': {
      return {
        ...state,
        validation: {
          ...state.validation,
          [action.step]: action.status
        },
        canProceed: action.step === state.currentStep ? action.status === 'valid' : state.canProceed
      };
    }

    case 'SET_ERROR': {
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.step]: action.error
        }
      };
    }

    case 'SET_WARNING': {
      return {
        ...state,
        warnings: {
          ...state.warnings,
          [action.step]: action.warning
        }
      };
    }

    case 'RESET_WIZARD': {
      const historyEntry = saveToHistory('Reset do wizard');
      const initialState = getInitialState();
      
      return {
        ...initialState,
        history: [...state.history, historyEntry].slice(-state.maxHistorySize)
      };
    }

    case 'RESTORE_STATE': {
      return {
        ...state,
        ...action.state,
        visitedSteps: action.state.visitedSteps ? new Set(action.state.visitedSteps as string[]) : state.visitedSteps
      };
    }

    case 'UNDO_LAST_ACTION': {
      if (state.history.length === 0) {
        return state; // Nada para desfazer
      }
      
      const lastAction = state.history[state.history.length - 1];
      const newHistory = state.history.slice(0, -1);
      
      return {
        ...state,
        ...lastAction.previousState,
        visitedSteps: new Set(lastAction.previousState.visitedSteps),
        history: newHistory
      };
    }

    default:
      return state;
  }
}

/**
 * Hook para gerenciar o estado do wizard com useReducer e histórico de ações
 */
export function useModuleWizardReducer() {
  const [state, dispatch] = useReducer(wizardReducer, getInitialState());
  
  // Estado de persistência (localStorage)
  const STORAGE_KEY = 'module-wizard-state-v2';

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
          dispatch({ 
            type: 'RESTORE_STATE', 
            state: {
              ...parsedState,
              visitedSteps: parsedState.visitedSteps || ['module-type']
            }
          });
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      console.debug('Erro ao carregar estado salvo:', error);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Salvar no localStorage com throttle
  useEffect(() => {
    const timeout = setTimeout(() => {
      try {
        const stateToSave = {
          ...state,
          savedAt: new Date().toISOString(),
          visitedSteps: Array.from(state.visitedSteps),
          // Não salvar histórico no localStorage (pode ser muito grande)
          history: []
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
      } catch (error) {
        console.debug('Erro ao salvar estado:', error);
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, [state]);

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
      const { validateWizardStep } = require('../schemas/wizard-validation');
      
      switch (stepId) {
        case 'module-type':
          const typeValidation = validateWizardStep('module-type', { type: config.type });
          return typeValidation.success ? 'valid' : (config.type ? 'invalid' : 'pending');

        case 'basic-config':
          const basicValidation = validateWizardStep('basic-config', { basic: config.basic });
          return basicValidation.success ? 'valid' : 'invalid';

        case 'implementation-config':
          if (config.type === 'standard' && config.basic?.auto_create_standard) {
            return 'valid';
          }
          const hasExistingImplementation = !!((config as any).auto_created_implementation || (config as any).implementation);
          if (hasExistingImplementation) {
            return 'valid';
          }
          if (config.implementation) {
            const implValidation = validateWizardStep('implementation-config', { 
              implementation: config.implementation,
              auto_generated: (config as any).auto_generated 
            });
            return implValidation.success ? 'valid' : 'invalid';
          }
          return 'pending';

        case 'client-config':
          return 'valid';

        case 'final-review':
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
      
      // Fallback básico
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
    dispatch({ type: 'UPDATE_CONFIG', section, data: updates });
    
    // Validar step atual após atualização
    setTimeout(() => {
      const newValidation = validateStep(state.currentStep);
      dispatch({ type: 'SET_VALIDATION', step: state.currentStep, status: newValidation });
    }, 100);
  }, [state.currentStep, validateStep]);

  // Navegação
  const goToStep = useCallback((stepId: WizardStep) => {
    if (!isStepVisible(stepId, moduleType, state.config)) return;
    dispatch({ type: 'SET_CURRENT_STEP', step: stepId });
  }, [moduleType, state.config]);

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
    dispatch({ type: 'RESET_WIZARD' });
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Undo da última ação
  const undo = useCallback(() => {
    dispatch({ type: 'UNDO_LAST_ACTION' });
  }, []);

  // Informações do histórico
  const historyInfo = useMemo(() => ({
    canUndo: state.history.length > 0,
    lastAction: state.history[state.history.length - 1]?.action || null,
    historySize: state.history.length
  }), [state.history]);

  return {
    // Estado
    state: {
      ...state,
      progress: effectiveProgress
    },
    moduleType,
    
    // Configuração
    updateConfig,
    
    // Navegação
    goToStep,
    nextStep,
    previousStep,
    
    // Ações
    reset,
    undo,
    
    // Utilidades
    validateStep,
    isStepVisible: (stepId: WizardStep) => isStepVisible(stepId, moduleType, state.config),
    
    // Status computados
    canProceed: state.canProceed,
    canGoBack: state.canGoBack,
    progress: effectiveProgress,
    
    // Histórico
    historyInfo
  };
}