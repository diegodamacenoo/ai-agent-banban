'use client';

import { useState, useMemo, lazy, Suspense, memo, useEffect } from 'react';
// Framer Motion removido para melhor performance

// Lazy loading dos steps para reduzir bundle inicial
const ModuleTypeStep = lazy(() => import('./wizard-steps/ModuleTypeStep').then(m => ({ default: m.ModuleTypeStep })));
const BasicConfigStep = lazy(() => import('./wizard-steps/BasicConfigStep').then(m => ({ default: m.BasicConfigStep })));
const ClientConfigStep = lazy(() => import('./wizard-steps/ClientConfigStep').then(m => ({ default: m.ClientConfigStep })));
import { FinalReviewStep } from './wizard-steps/FinalReviewStep';
const ImplementationConfigStep = lazy(() => import('./wizard-steps/ImplementationConfigStep').then(m => ({ default: m.ImplementationConfigStep })));
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Progress } from '@/shared/ui/progress';
import { 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Loader2,
  Undo2
} from 'lucide-react';
import { useModuleWizardContext } from '../../contexts/ModuleWizardContext';
import { WizardStep } from '../types';

// Componentes dos steps carregados dinamicamente via lazy loading

/**
 * Wizard principal para criação de módulos.
 * Gerencia navegação entre steps e estado global.
 * Otimizado com memo para evitar re-renderizações desnecessárias.
 */
const ModuleCreationWizard = memo(function ModuleCreationWizard() {
  const {
    state,
    moduleType,
    nextStep,
    previousStep,
    goToStep,
    reset,
    undo,
    canProceed,
    canGoBack,
    progress,
    isStepVisible,
    historyInfo
  } = useModuleWizardContext();


  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  // Como removemos a geração de código, isGenerating sempre é false
  const isGenerating = false;

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Esc - Fechar modal de reset se estiver aberto, senão não fazer nada
      if (event.key === 'Escape') {
        if (showResetConfirm) {
          setShowResetConfirm(false);
          event.preventDefault();
        }
        return;
      }

      // Ctrl + Seta Esquerda - Step anterior
      if (event.ctrlKey && event.key === 'ArrowLeft') {
        if (canGoBack && !isGenerating) {
          previousStep();
          event.preventDefault();
        }
        return;
      }

      // Ctrl + Seta Direita - Próximo step
      if (event.ctrlKey && event.key === 'ArrowRight') {
        if (canProceed && !isGenerating && state.currentStep !== 'final-review') {
          nextStep();
          event.preventDefault();
        }
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [canGoBack, canProceed, isGenerating, nextStep, previousStep, showResetConfirm, state.currentStep]);

  // Renderizar step atual com lazy loading e fallback
  const renderCurrentStep = useMemo(() => {
    const StepLoadingFallback = () => (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Carregando step...</span>
        </div>
      </div>
    );

    switch (state.currentStep) {
      case 'module-type':
        return (
          <Suspense fallback={<StepLoadingFallback />}>
            <ModuleTypeStep />
          </Suspense>
        );
      case 'basic-config':
        return (
          <Suspense fallback={<StepLoadingFallback />}>
            <BasicConfigStep />
          </Suspense>
        );
      case 'client-config':
        return (
          <Suspense fallback={<StepLoadingFallback />}>
            <ClientConfigStep />
          </Suspense>
        );
      case 'implementation-config':
        return (
          <Suspense fallback={<StepLoadingFallback />}>
            <ImplementationConfigStep />
          </Suspense>
        );
      case 'final-review':
        return <FinalReviewStep />;
      default:
        return <div>Step não encontrado</div>;
    }
  }, [state.currentStep]);

  // Obter informações do step atual
  const currentStepInfo = state.steps.find(step => step.id === state.currentStep);

  // Status do step para badge
  const getStepStatus = (stepId: WizardStep) => {
    const validation = state.validation[stepId];
    const isCurrent = stepId === state.currentStep;
    
    if (isCurrent) return 'current';
    if (validation === 'valid') return 'completed';
    if (validation === 'invalid') return 'error';
    if (validation === 'warning') return 'warning';
    return 'pending';
  };

  // CSS transitions simples para melhor performance

  return (
    <div className="mx-auto px-4">
      {/* Header compacto único */}
      <div className="bg-white border rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Step indicators clicáveis inline */}
            <div className="flex items-center gap-2">
              {state.steps.filter(step => isStepVisible(step.id)).map((step, index) => {
                const status = getStepStatus(step.id);
                const isCurrent = step.id === state.currentStep;
                const visibleSteps = state.steps.filter(s => isStepVisible(s.id));
                
                return (
                  <div key={step.id} className="flex items-center">
                    <button
                      onClick={() => goToStep(step.id)}
                      disabled={isGenerating || status === 'pending'}
                      className={`
                        flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium transition-all duration-150
                        ${isCurrent ? 'bg-blue-600 text-white' : ''}
                        ${status === 'completed' ? 'bg-green-500 text-white hover:bg-green-600' : ''}
                        ${status === 'error' ? 'bg-red-500 text-white' : ''}
                        ${status === 'pending' && !isCurrent ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : ''}
                        ${!isCurrent && status !== 'pending' && status !== 'completed' ? 'bg-gray-100 border border-gray-300 hover:bg-gray-200' : ''}
                      `}
                      title={`${step.title}${status === 'completed' ? ' ✓' : ''}`}
                    >
                      {status === 'completed' ? '✓' : index + 1}
                    </button>
                    
                    {index < visibleSteps.length - 1 && (
                      <div className="w-4 h-px bg-gray-300 mx-1" />
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="border-l border-gray-300 pl-4">
              <div className="flex items-center gap-2">
{(() => {
                  if (!currentStepInfo?.icon) return null;
                  const IconComponent = currentStepInfo.icon;
                  if (typeof IconComponent !== 'function') return null;
                  return <IconComponent className="h-4 w-4 text-blue-600" />;
                })()}
                <h2 className="font-semibold text-sm">{currentStepInfo?.title}</h2>
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {currentStepInfo?.estimatedTime}
                </Badge>
                
                {/* Barra de progresso de tempo estimado */}
                <div className="ml-2 flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">Progresso estimado:</span>
                  <div className="w-20 bg-gray-200 rounded-full h-1">
                    <div 
                      className="bg-green-500 h-1 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min(100, (progress.currentStepIndex + 0.5) / progress.totalSteps * 100)}%` 
                      }}
                    />
                  </div>
                  <span className="text-xs text-green-600 font-medium">
                    ~{Math.round((progress.currentStepIndex + 0.5) / progress.totalSteps * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Progress compacto */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{progress.currentStepIndex + 1}/{progress.totalSteps}</span>
              <div className="w-16 bg-gray-200 rounded-full h-1">
                <div 
                  className="bg-blue-600 h-1 rounded-full transition-all duration-300" 
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
              <span>{progress.percentage}%</span>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowResetConfirm(true)}
              disabled={isGenerating}
              title="Reset wizard"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Layout principal com painel lateral */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Conteúdo principal */}
        <div className="lg:col-span-3">
          <div className="bg-white border rounded-lg">
            {/* Step Content */}
            <div className="p-6">
              <div 
                key={state.currentStep}
                className="wizard-step-content animate-fadeIn"
            style={{
              opacity: 1,
              transform: 'translateX(0)',
              transition: 'opacity 0.15s ease-out, transform 0.15s ease-out'
            }}
          >
            {renderCurrentStep}
              </div>
            </div>
          </div>
        </div>

        {/* Painel lateral sticky com resumo */}
        {state.currentStep !== 'module-type' && (
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <div className="bg-white border rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <div className="w-2 h-2 bg-blue-600 rounded-full" />
                  <h3 className="font-medium text-sm">Resumo</h3>
                </div>

                {/* Informações básicas */}
                {state.config.basic?.name && (
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-medium text-gray-500">Nome</p>
                      <p className="text-sm font-medium">{state.config.basic.name}</p>
                    </div>
                    
                    {state.config.basic.slug && (
                      <div>
                        <p className="text-xs font-medium text-gray-500">Slug</p>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {state.config.basic.slug}
                        </code>
                      </div>
                    )}
                    
                    {(state.config.basic.route_pattern || state.config.basic.slug) && (
                      <div>
                        <p className="text-xs font-medium text-gray-500">URL Final</p>
                        <code className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded block">
                          /{'{'}tenant{'}'}/{state.config.basic.route_pattern || state.config.basic.slug}
                        </code>
                      </div>
                    )}
                  </div>
                )}

                {/* Tipo e categoria */}
                {(state.config.type || state.config.basic?.category) && (
                  <div className="space-y-2 pt-2 border-t">
                    {state.config.type && (
                      <div className="flex items-center gap-2">
                        <Badge variant={state.config.type === 'standard' ? 'default' : 'secondary'} className="text-xs">
                          {state.config.type === 'standard' ? 'Padrão' : 'Personalizado'}
                        </Badge>
                      </div>
                    )}
                    
                    {state.config.basic?.category && (
                      <div>
                        <p className="text-xs font-medium text-gray-500">Categoria</p>
                        <p className="text-sm">{state.config.basic.category}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Status de validação */}
                <div className="pt-2 border-t">
                  <p className="text-xs font-medium text-gray-500 mb-2">Status dos Steps</p>
                  <div className="space-y-1">
                    {state.steps.filter(step => isStepVisible(step.id)).map((step) => {
                      const status = getStepStatus(step.id);
                      const isCurrent = step.id === state.currentStep;
                      
                      return (
                        <div key={step.id} className="flex items-center justify-between text-xs">
                          <span className={isCurrent ? 'font-medium' : ''}>{step.title}</span>
                          <div className="flex items-center gap-1">
                            {status === 'completed' && <span className="text-green-600">✓</span>}
                            {status === 'error' && <span className="text-red-600">✗</span>}
                            {status === 'current' && <span className="text-blue-600">→</span>}
                            {status === 'pending' && <span className="text-gray-400">○</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Alertas e validações */}
                {(Object.keys(state.errors).length > 0 || Object.keys(state.warnings).length > 0) && (
                  <div className="pt-2 border-t">
                    {Object.keys(state.errors).length > 0 && (
                      <div className="p-2 bg-red-50 border border-red-200 rounded">
                        <p className="text-xs font-medium text-red-800">⚠ Erros pendentes</p>
                        <p className="text-xs text-red-600">{Object.keys(state.errors).length} item(s)</p>
                      </div>
                    )}
                    
                    {Object.keys(state.warnings).length > 0 && (
                      <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-xs font-medium text-yellow-800">⚠ Avisos</p>
                        <p className="text-xs text-yellow-600">{Object.keys(state.warnings).length} item(s)</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Footer compacto */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center justify-between">
          {/* Navegação Anterior */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={previousStep}
              disabled={!canGoBack || isGenerating}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
            
            {/* Botão Undo */}
            <Button
              variant="ghost"
              size="sm"
              onClick={undo}
              disabled={!historyInfo.canUndo || isGenerating}
              title={historyInfo.lastAction ? `Desfazer: ${historyInfo.lastAction}` : 'Nenhuma ação para desfazer'}
            >
              <Undo2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Status Central com atalhos */}
          <div className="text-center flex items-center gap-3">
            <p className="text-xs text-muted-foreground">
              {state.config.type === 'standard' ? 'Módulo Padrão' : 
               state.config.type === 'custom' ? 'Módulo Personalizado' : 
               'Tipo não definido'}
            </p>
            
            {historyInfo.historySize > 0 && (
              <Badge variant="secondary" className="text-xs">
                {historyInfo.historySize} ações
              </Badge>
            )}
            
            {/* Atalhos de teclado */}
            <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
              <span>Atalhos:</span>
              <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                Ctrl + ←
              </Badge>
              <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                Ctrl + →
              </Badge>
              <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                Esc
              </Badge>
            </div>
          </div>

          {/* Navegação Próximo */}
          {state.currentStep === 'final-review' ? (
            <div className="w-20">{/* Espaço para step final */}</div>
          ) : state.currentStep === 'client-config' ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={nextStep}
                title="Pular atribuição e criar manualmente depois"
              >
                Pular
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  // Se há handler customizado para o step atual, usar ele
                  const handler = (window as any).__clientConfigStepHandler;
                  if (handler) {
                    handler();
                  } else {
                    nextStep();
                  }
                }}
                disabled={!canProceed || isGenerating}
              >
                Próximo
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={nextStep}
              disabled={!canProceed || isGenerating}
            >
              Próximo
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Confirmar Reset</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Tem certeza de que deseja resetar o wizard? Todas as informações inseridas serão perdidas.
              </p>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowResetConfirm(false)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    reset();
                    setShowResetConfirm(false);
                  }}
                >
                  Resetar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
});

export { ModuleCreationWizard };