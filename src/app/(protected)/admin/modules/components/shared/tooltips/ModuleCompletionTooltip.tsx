'use client';

import { Info, CheckCircle, XCircle, AlertCircle, FileText } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui/tooltip';
import { ModuleInfo } from '@/shared/types/module-system';

interface ModuleCompletionTooltipProps {
  module: ModuleInfo;
}

export function ModuleCompletionTooltip({ module }: ModuleCompletionTooltipProps) {
  if (!module.implementationHealth) {
    return null;
  }

  const { implementationHealth } = module;
  const percentage = Math.round(implementationHealth.completionPercentage);

  // Critérios básicos (arquivos obrigatórios)
  const requiredFiles = ['index.ts'];
  const hasRequiredFiles = !module.missingFiles || module.missingFiles.length === 0;

  // Critérios opcionais (arquivos extras)
  const optionalFiles = ['module.config.json', 'README.md', 'types.ts'];
  const optionalFilesFound = optionalFiles.filter(file => 
    !module.missingFiles?.includes(file)
  ).length;

  // Verificação de sintaxe
  const hasSyntaxErrors = implementationHealth.errors.some(error => 
    error.includes('sintaxe') || error.includes('vazio') || error.includes('incompleto')
  );

  const criteriaChecks = [
    {
      label: 'Arquivo index.ts presente',
      status: hasRequiredFiles,
      icon: hasRequiredFiles ? CheckCircle : XCircle,
      color: hasRequiredFiles ? 'text-green-600' : 'text-red-600'
    },
    {
      label: 'Sintaxe válida',
      status: !hasSyntaxErrors,
      icon: !hasSyntaxErrors ? CheckCircle : AlertCircle,
      color: !hasSyntaxErrors ? 'text-green-600' : 'text-orange-600'
    },
    {
      label: 'Arquivos opcionais',
      status: optionalFilesFound > 0,
      icon: optionalFilesFound > 0 ? CheckCircle : FileText,
      color: optionalFilesFound > 0 ? 'text-green-600' : 'text-gray-500',
      detail: `${optionalFilesFound}/${optionalFiles.length} encontrados`
    }
  ];

  // Ícone baseado na porcentagem
  const getStatusIcon = () => {
    if (percentage === 100) return <CheckCircle className="h-3 w-3 text-green-600" />;
    if (percentage >= 80) return <AlertCircle className="h-3 w-3 text-orange-500" />;
    return <XCircle className="h-3 w-3 text-red-500" />;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="inline-flex items-center">
            {getStatusIcon()}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="w-72 p-3 bg-white">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-500" />
              <span className="font-medium text-sm text-zinc-900">Critérios de Conformidade</span>
            </div>
            
            <div className="space-y-2">
              {criteriaChecks.map((criteria, index) => {
                const Icon = criteria.icon;
                return (
                  <div key={index} className="flex items-start gap-2 text-xs">
                    <Icon className={`h-3 w-3 mt-0.5 ${criteria.color}`} />
                    <div className="flex-1">
                      <span className={criteria.status ? 'text-foreground' : 'text-muted-foreground'}>
                        {criteria.label}
                      </span>
                      {criteria.detail && (
                        <span className="text-muted-foreground ml-1">
                          ({criteria.detail})
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cálculo da Porcentagem */}
            <div className="pt-2 border-t border-muted">
              <div className="text-xs text-muted-foreground">
                <div className="font-medium mb-1">Cálculo da Completude:</div>
                <div>• Arquivos obrigatórios: {hasRequiredFiles ? '80%' : '0%'}</div>
                <div>• Arquivos opcionais: {Math.round((optionalFilesFound / optionalFiles.length) * 20)}%</div>
                <div>• Penalização por erros: {hasSyntaxErrors ? '-50%' : '0%'}</div>
                <div className="font-medium mt-1 text-foreground">
                  Total: {percentage}%
                </div>
              </div>
            </div>

            {/* Problemas encontrados */}
            {implementationHealth.errors.length > 0 && (
              <div className="pt-2 border-t border-muted">
                <div className="text-xs">
                  <div className="font-medium text-red-600 mb-1">Problemas:</div>
                  {implementationHealth.errors.slice(0, 2).map((error, index) => (
                    <div key={index} className="text-red-600 mb-1">
                      • {error}
                    </div>
                  ))}
                  {implementationHealth.errors.length > 2 && (
                    <div className="text-muted-foreground">
                      ... e mais {implementationHealth.errors.length - 2} problemas
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 