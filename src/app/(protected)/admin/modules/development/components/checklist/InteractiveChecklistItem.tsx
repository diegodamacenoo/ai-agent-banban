'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Checkbox } from '@/shared/ui/checkbox';
import { FolderOpen, FileText, ExternalLink, Clock, ChevronDown, ChevronRight, Terminal, Code2, Info } from 'lucide-react';

export interface ChecklistTask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  estimatedTime: string;
  actionType: 'open-folder' | 'open-file' | 'external-link' | 'none';
  actionData?: {
    path?: string;
    filePath?: string;
    url?: string;
  };
  instructions?: {
    summary: string;
    commands?: string[];
    codeExample?: string;
    notes?: string[];
  };
}

export interface InteractiveChecklistItemProps {
  task: ChecklistTask;
  moduleData?: any; // Dados do módulo criado
  onToggle: (taskId: string, completed: boolean) => void;
}

export function InteractiveChecklistItem({ 
  task, 
  moduleData, 
  onToggle 
}: InteractiveChecklistItemProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  
  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Feedback visual opcional
      console.log('Comando copiado para área de transferência');
    } catch (error) {
      console.error('Erro ao copiar:', error);
    }
  }, []);

  const handleAction = useCallback(async () => {
    if (!task.actionData || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      switch (task.actionType) {
        case 'open-folder':
          if (task.actionData.path) {
            // Tentar abrir no VS Code via protocol
            window.open(`vscode://file/${task.actionData.path}`, '_blank');
            // Fallback: mostrar caminho para o usuário copiar
            console.info(`📁 Abrir pasta: ${task.actionData.path}`);
          }
          break;
          
        case 'open-file':
          if (task.actionData.filePath) {
            window.open(`vscode://file/${task.actionData.filePath}`, '_blank');
            console.info(`📄 Abrir arquivo: ${task.actionData.filePath}`);
          }
          break;
          
        case 'external-link':
          if (task.actionData.url) {
            window.open(task.actionData.url, '_blank', 'noopener,noreferrer');
          }
          break;
          
        default:
          // Ação 'none' - apenas toggle
          break;
      }
    } catch (error) {
      console.error('Erro ao executar ação do checklist:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [task, isProcessing]);

  const handleToggle = useCallback((checked: boolean) => {
    onToggle(task.id, checked);
  }, [task.id, onToggle]);

  const getActionIcon = () => {
    switch (task.actionType) {
      case 'open-folder':
        return <FolderOpen className="h-4 w-4" />;
      case 'open-file':
        return <FileText className="h-4 w-4" />;
      case 'external-link':
        return <ExternalLink className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getActionTooltip = () => {
    switch (task.actionType) {
      case 'open-folder':
        return `Abrir pasta: ${task.actionData?.path || 'N/A'}`;
      case 'open-file':
        return `Abrir arquivo: ${task.actionData?.filePath || 'N/A'}`;
      case 'external-link':
        return `Abrir link: ${task.actionData?.url || 'N/A'}`;
      default:
        return 'Sem ação disponível';
    }
  };

  return (
    <div className={`flex items-start justify-between p-4 border rounded-lg transition-colors ${
      task.completed 
        ? 'bg-green-50 border-green-200' 
        : 'hover:bg-gray-50 border-gray-200'
    }`}>
      <div className="flex items-start gap-3 flex-1">
        <Checkbox
          checked={task.completed}
          onCheckedChange={handleToggle}
          className="mt-0.5"
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`font-medium break-words ${
              task.completed ? 'line-through text-gray-500' : 'text-gray-900'
            }`}>
              {task.title}
            </p>
            
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-xs whitespace-nowrap">
                <Clock className="h-3 w-3 mr-1" />
                {task.estimatedTime}
              </Badge>
              
              {task.completed && (
                <Badge variant="default" className="text-xs bg-green-600">
                  ✓ Concluído
                </Badge>
              )}
            </div>
          </div>
          
          <p className={`text-sm mt-1 break-words ${
            task.completed ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {task.description}
          </p>
          
          {/* Mostrar caminho/URL se disponível */}
          {task.actionData && (task.actionData.path || task.actionData.filePath || task.actionData.url) && (
            <div className="mt-2 text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded break-all">
              {task.actionData.path || task.actionData.filePath || task.actionData.url}
            </div>
          )}
          
          {/* Botão para mostrar instruções detalhadas */}
          {task.instructions && (
            <div className="mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInstructions(!showInstructions)}
                className="text-xs text-blue-600 hover:text-blue-700 p-0 h-auto font-medium"
              >
                {showInstructions ? <ChevronDown className="h-3 w-3 mr-1" /> : <ChevronRight className="h-3 w-3 mr-1" />}
                Ver instruções detalhadas
              </Button>
              
              {/* Conteúdo das instruções expandido */}
              {showInstructions && (
                <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-blue-800">{task.instructions.summary}</p>
                  </div>
                  
                  {/* Comandos de terminal */}
                  {task.instructions.commands && task.instructions.commands.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Terminal className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">Comandos:</span>
                      </div>
                      <div className="space-y-2">
                        {task.instructions.commands.map((command, index) => (
                          <div key={index} className="relative group">
                            <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
                              <code>{command}</code>
                            </pre>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(command)}
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-xs h-6 px-2"
                            >
                              Copiar
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Exemplo de código */}
                  {task.instructions.codeExample && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Code2 className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">Exemplo de código:</span>
                      </div>
                      <div className="relative group">
                        <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
                          <code>{task.instructions.codeExample}</code>
                        </pre>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(task.instructions.codeExample!)}
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-xs h-6 px-2"
                        >
                          Copiar
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Notas importantes */}
                  {task.instructions.notes && task.instructions.notes.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-blue-900">Notas importantes:</span>
                      <ul className="mt-1 text-xs text-blue-700 space-y-1">
                        {task.instructions.notes.map((note, index) => (
                          <li key={index} className="flex items-start gap-1">
                            <span className="text-blue-500 font-bold mt-0.5">•</span>
                            <span>{note}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Botões de ação */}
      <div className="flex gap-1 ml-4 flex-shrink-0 items-start">
        {task.actionType !== 'none' && task.actionData && (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleAction}
            disabled={isProcessing}
            title={getActionTooltip()}
            className="whitespace-nowrap"
          >
            {isProcessing ? (
              <span className="animate-spin">⏳</span>
            ) : (
              getActionIcon()
            )}
          </Button>
        )}
      </div>
    </div>
  );
}