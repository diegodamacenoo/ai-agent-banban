'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';

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

interface ProgressMetrics {
  total: number;
  completed: number;
  percentage: number;
  estimatedTimeRemaining: string;
}

interface ExportMetadata {
  moduleName: string;
  moduleSlug: string;
  createdAt: string;
  moduleId?: string;
}

/**
 * Hook para gerenciar progresso de checklist com persistência no localStorage
 */
export function useChecklistProgress(tasks: ChecklistTask[]) {
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  
  const STORAGE_KEY = 'module-checklist-progress';

  // Carregar progresso do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsedData = JSON.parse(saved);
        // Carregar apenas tasks que ainda existem na lista atual
        const validCompletedTasks = parsedData.filter((taskId: string) => 
          tasks.some(task => task.id === taskId)
        );
        setCompletedTasks(validCompletedTasks);
      }
    } catch (error) {
      console.debug('Erro ao carregar progresso do checklist:', error);
    }
  }, [tasks]);

  // Salvar progresso no localStorage
  const saveProgress = useCallback((newCompletedTasks: string[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newCompletedTasks));
    } catch (error) {
      console.debug('Erro ao salvar progresso do checklist:', error);
    }
  }, []);

  // Toggle task completion
  const toggleTask = useCallback((taskId: string, completed: boolean) => {
    setCompletedTasks(prev => {
      const newCompleted = completed 
        ? [...prev.filter(id => id !== taskId), taskId]
        : prev.filter(id => id !== taskId);
      
      saveProgress(newCompleted);
      return newCompleted;
    });
  }, [saveProgress]);

  // Calcular métricas de progresso
  const getProgress = useCallback((): ProgressMetrics => {
    const total = tasks.length;
    const completed = completedTasks.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // Calcular tempo estimado restante
    const remainingTasks = tasks.filter(task => !completedTasks.includes(task.id));
    const totalMinutes = remainingTasks.reduce((acc, task) => {
      // Parse estimated time (ex: "15 min", "2 min")
      const match = task.estimatedTime.match(/(\d+)/);
      return acc + (match ? parseInt(match[1], 10) : 5); // default 5 min se não conseguir parse
    }, 0);
    
    const estimatedTimeRemaining = totalMinutes === 0 
      ? '0 min' 
      : totalMinutes >= 60 
        ? `${Math.round(totalMinutes / 60)}h ${totalMinutes % 60}min`
        : `${totalMinutes} min`;

    return {
      total,
      completed,
      percentage,
      estimatedTimeRemaining
    };
  }, [tasks, completedTasks]);

  // Exportar progresso em JSON
  const exportProgressJSON = useCallback((metadata: ExportMetadata) => {
    const progress = getProgress();
    const exportData = {
      metadata: {
        ...metadata,
        exportedAt: new Date().toISOString(),
        exportFormat: 'json'
      },
      progress,
      tasks: tasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        estimatedTime: task.estimatedTime,
        completed: completedTasks.includes(task.id),
        completedAt: completedTasks.includes(task.id) ? new Date().toISOString() : null
      })),
      summary: {
        totalTasks: progress.total,
        completedTasks: progress.completed,
        remainingTasks: progress.total - progress.completed,
        completionPercentage: progress.percentage,
        estimatedTimeRemaining: progress.estimatedTimeRemaining
      }
    };

    return {
      content: JSON.stringify(exportData, null, 2),
      filename: `module-${metadata.moduleSlug}-checklist-${new Date().toISOString().slice(0, 10)}.json`
    };
  }, [tasks, completedTasks, getProgress]);

  // Exportar progresso em Markdown
  const exportProgressMarkdown = useCallback((metadata: ExportMetadata) => {
    const progress = getProgress();
    const completedTasksList = tasks.filter(task => completedTasks.includes(task.id));
    const remainingTasksList = tasks.filter(task => !completedTasks.includes(task.id));

    const markdown = `# Checklist de Implementação - ${metadata.moduleName}

## Informações do Módulo
- **Nome:** ${metadata.moduleName}
- **Slug:** ${metadata.moduleSlug}
- **Criado em:** ${new Date(metadata.createdAt).toLocaleString('pt-BR')}
- **Módulo ID:** ${metadata.moduleId || 'N/A'}
- **Relatório gerado em:** ${new Date().toLocaleString('pt-BR')}

## Progresso Geral
- **Total de tarefas:** ${progress.total}
- **Tarefas concluídas:** ${progress.completed}
- **Tarefas pendentes:** ${progress.total - progress.completed}
- **Progresso:** ${progress.percentage}%
- **Tempo estimado restante:** ${progress.estimatedTimeRemaining}

## ✅ Tarefas Concluídas (${completedTasksList.length})

${completedTasksList.length === 0 ? '*Nenhuma tarefa concluída ainda.*' : 
  completedTasksList.map(task => 
    `- [x] **${task.title}** *(${task.estimatedTime})*\n  ${task.description}`
  ).join('\n\n')
}

## 📋 Tarefas Pendentes (${remainingTasksList.length})

${remainingTasksList.length === 0 ? '*🎉 Todas as tarefas foram concluídas! Parabéns!*' :
  remainingTasksList.map(task => 
    `- [ ] **${task.title}** *(${task.estimatedTime})*\n  ${task.description}${
      task.actionData ? `\n  📁 ${task.actionData.path || task.actionData.filePath || task.actionData.url || ''}` : ''
    }`
  ).join('\n\n')
}

## Próximos Passos

${remainingTasksList.length === 0 
  ? `🎉 **Implementação Completa!**\n\nTodas as tarefas foram concluídas. Seu módulo "${metadata.moduleName}" está pronto para uso!`
  : `1. Foque nas **${Math.min(3, remainingTasksList.length)} primeiras tarefas** da lista pendente
2. Marque cada tarefa como concluída conforme finaliza
3. Use os links/caminhos fornecidos para navegar rapidamente aos arquivos
4. Teste o módulo após cada etapa importante

**Tempo estimado para conclusão:** ${progress.estimatedTimeRemaining}`
}

---
*Relatório gerado automaticamente pelo Module Creation Wizard*`;

    return {
      content: markdown,
      filename: `module-${metadata.moduleSlug}-checklist-${new Date().toISOString().slice(0, 10)}.md`
    };
  }, [tasks, completedTasks, getProgress]);

  // Função genérica de export
  const exportProgress = useCallback((format: 'json' | 'markdown', metadata: ExportMetadata) => {
    return format === 'json' 
      ? exportProgressJSON(metadata)
      : exportProgressMarkdown(metadata);
  }, [exportProgressJSON, exportProgressMarkdown]);

  // Reset do progresso
  const resetProgress = useCallback(() => {
    setCompletedTasks([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Marcar todas as tarefas como concluídas
  const completeAll = useCallback(() => {
    const allTaskIds = tasks.map(task => task.id);
    setCompletedTasks(allTaskIds);
    saveProgress(allTaskIds);
  }, [tasks, saveProgress]);

  // Progress metrics memoized
  const progress = useMemo(() => getProgress(), [getProgress]);

  // Lista de tarefas com status atualizado
  const tasksWithStatus = useMemo(() => 
    tasks.map(task => ({
      ...task,
      completed: completedTasks.includes(task.id)
    }))
  , [tasks, completedTasks]);

  return {
    // Estado
    completedTasks,
    tasksWithStatus,
    progress,
    
    // Ações
    toggleTask,
    resetProgress,
    completeAll,
    
    // Métricas
    getProgress,
    
    // Export
    exportProgress,
    exportProgressJSON,
    exportProgressMarkdown,
    
    // Helpers
    isCompleted: (taskId: string) => completedTasks.includes(taskId),
    getCompletedCount: () => completedTasks.length,
    getTotalCount: () => tasks.length,
    getCompletionPercentage: () => progress.percentage
  };
}