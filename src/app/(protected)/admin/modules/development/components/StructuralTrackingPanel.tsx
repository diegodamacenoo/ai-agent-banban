'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Progress } from '@/shared/ui/progress';
import {
  ChevronDown,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Loader2,
  Info,
  Zap
} from 'lucide-react';
import { StructuralCategory, ModuleStructureCheck, ValidationResult } from '../types';
import { useStructuralTracking } from '../hooks/useStructuralTracking';

interface StructuralTrackingPanelProps {
  className?: string;
}

export function StructuralTrackingPanel({ className }: StructuralTrackingPanelProps) {
  const {
    trackingState,
    validationResults,
    validateCategory,
    validateAll,
    resetCategory,
    setAutoValidation,
    overallMetrics
  } = useStructuralTracking();

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['frontend']));

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const getStatusIcon = (status: string, isLoading = false) => {
    if (isLoading) return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    
    switch (status) {
      case 'valid': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'invalid': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'validating': return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      valid: 'bg-green-50 text-green-700 border-green-200',
      warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      invalid: 'bg-red-50 text-red-700 border-red-200',
      validating: 'bg-blue-50 text-blue-700 border-blue-200',
      pending: 'bg-gray-50 text-gray-700 border-gray-200'
    };

    const labels = {
      valid: 'Válido',
      warning: 'Atenção',
      invalid: 'Inválido',
      validating: 'Validando...',
      pending: 'Pendente'
    };

    return (
      <Badge variant="outline" className={variants[status as keyof typeof variants] || variants.pending}>
        {labels[status as keyof typeof labels] || 'Desconhecido'}
      </Badge>
    );
  };

  return (
    <div className={className}>
      {/* Header com Métricas Gerais */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Tracking Estrutural
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Validação automática da estrutura de módulos
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoValidation(!trackingState.autoValidation)}
              >
                {trackingState.autoValidation ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {trackingState.autoValidation ? 'Pausar' : 'Iniciar'} Auto
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={validateAll}
                disabled={trackingState.isValidating}
              >
                {trackingState.isValidating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
                Validar Tudo
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Progresso Geral */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progresso Geral</span>
                <span className="font-medium">{overallMetrics.percentage}%</span>
              </div>
              <Progress value={overallMetrics.percentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {overallMetrics.completedChecks} de {overallMetrics.totalChecks} verificações
              </p>
            </div>

            {/* Health Score */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Health Score</span>
                <span className="font-medium">{trackingState.healthScore}%</span>
              </div>
              <Progress 
                value={trackingState.healthScore} 
                className="h-2"
                // @ts-ignore - Custom color based on health score
                style={{ '--progress-color': trackingState.healthScore > 80 ? '#22c55e' : trackingState.healthScore > 60 ? '#eab308' : '#ef4444' }}
              />
              <p className="text-xs text-muted-foreground">
                {trackingState.criticalIssues.length} issues críticos
              </p>
            </div>

            {/* Última Validação */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Última Validação</span>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">
                {trackingState.lastValidation 
                  ? trackingState.lastValidation.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                  : 'Nunca'
                }
              </p>
              <p className="text-xs text-muted-foreground">
                {trackingState.autoValidation ? 'Auto-validação ativa' : 'Auto-validação pausada'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categorias de Validação */}
      <div className="space-y-4">
        {trackingState.categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            validationResults={validationResults}
            isExpanded={expandedCategories.has(category.id)}
            onToggle={() => toggleCategory(category.id)}
            onValidate={() => validateCategory(category.id)}
            onReset={() => resetCategory(category.id)}
            isValidating={trackingState.isValidating}
          />
        ))}
      </div>
    </div>
  );
}

interface CategoryCardProps {
  category: StructuralCategory;
  validationResults: Record<string, ValidationResult>;
  isExpanded: boolean;
  onToggle: () => void;
  onValidate: () => void;
  onReset: () => void;
  isValidating: boolean;
}

function CategoryCard({
  category,
  validationResults,
  isExpanded,
  onToggle,
  onValidate,
  onReset,
  isValidating
}: CategoryCardProps) {
  // Verificação de segurança
  if (!category) {
    console.debug('CategoryCard: categoria inválida ou undefined');
    return null;
  }

  // Debug do ícone
  console.debug('CategoryCard - category.icon:', {
    icon: category.icon,
    type: typeof category.icon,
    isFunction: typeof category.icon === 'function',
    constructor: category.icon?.constructor?.name,
    categoryName: category.name
  });

  const categoryProgress = category.totalChecks > 0 
    ? Math.round((category.completedChecks / category.totalChecks) * 100) 
    : 0;

  const getStatusIcon = (status: string, isLoading = false) => {
    if (isLoading) return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    
    switch (status) {
      case 'valid': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'invalid': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'validating': return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      valid: 'bg-green-50 text-green-700 border-green-200',
      warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      invalid: 'bg-red-50 text-red-700 border-red-200',
      validating: 'bg-blue-50 text-blue-700 border-blue-200',
      pending: 'bg-gray-50 text-gray-700 border-gray-200'
    };

    const labels = {
      valid: 'Válido',
      warning: 'Atenção',
      invalid: 'Inválido',
      validating: 'Validando...',
      pending: 'Pendente'
    };

    return (
      <Badge variant="outline" className={variants[status as keyof typeof variants] || variants.pending}>
        {labels[status as keyof typeof labels] || 'Desconhecido'}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            {category.icon && typeof category.icon === 'function' ? (
              React.createElement(category.icon, { className: "h-5 w-5 text-muted-foreground" })
            ) : (
              <Info className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <CardTitle className="text-base">{category.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{category.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {getStatusIcon(category.overallStatus, category.overallStatus === 'validating')}
            {getStatusBadge(category.overallStatus)}
            <div className="text-right">
              <p className="text-sm font-medium">{categoryProgress}%</p>
              <p className="text-xs text-muted-foreground">
                {category.completedChecks}/{category.totalChecks}
              </p>
            </div>
          </div>
        </div>
        <Progress value={categoryProgress} className="mt-2 h-1" />
      </CardHeader>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-muted-foreground">
                  {category.checks.length} verificações • {category.criticalIssues} críticos
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onValidate}
                    disabled={isValidating}
                  >
                    {category.overallStatus === 'validating' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    Validar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onReset}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {category.checks.map((check) => (
                  <CheckItem
                    key={check.id}
                    check={check}
                    result={validationResults[check.id]}
                  />
                ))}
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

interface CheckItemProps {
  check: ModuleStructureCheck;
  result?: ValidationResult;
}

function CheckItem({ check, result }: CheckItemProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'invalid': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'validating': return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-l-red-500 bg-red-50/50';
      case 'high': return 'border-l-orange-500 bg-orange-50/50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50/50';
      case 'low': return 'border-l-gray-500 bg-gray-50/50';
      default: return 'border-l-gray-300';
    }
  };

  return (
    <div className={`border-l-2 pl-4 py-2 ${getPriorityColor(check.priority)}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {getStatusIcon(check.status)}
            <span className="font-medium text-sm">{check.name}</span>
            {check.required && (
              <Badge variant="outline" className="text-xs px-1 py-0">
                Obrigatório
              </Badge>
            )}
            <Badge variant="outline" className="text-xs px-1 py-0">
              {check.priority}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1 pl-6">
            {check.description}
          </p>
          <p className="text-xs text-muted-foreground pl-6">
            📁 {check.path}
          </p>
          
          {result && (
            <div className="pl-6 mt-2 space-y-1">
              <p className="text-xs font-medium">{result.message}</p>
              {result.details && result.details.length > 0 && (
                <ul className="text-xs text-muted-foreground space-y-1">
                  {result.details.map((detail, index) => (
                    <li key={index}>• {detail}</li>
                  ))}
                </ul>
              )}
              {result.suggestions && result.suggestions.length > 0 && (
                <div className="text-xs">
                  <p className="font-medium text-blue-700">💡 Sugestões:</p>
                  <ul className="text-blue-600 space-y-1">
                    {result.suggestions.map((suggestion, index) => (
                      <li key={index}>• {suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="text-right text-xs text-muted-foreground">
          {check.estimatedTime && <div>{check.estimatedTime}</div>}
          {check.lastChecked && (
            <div>{check.lastChecked.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
          )}
        </div>
      </div>
    </div>
  );
}