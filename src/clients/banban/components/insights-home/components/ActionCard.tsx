'use client';

import { useState, useEffect } from 'react';
import { CheckSquare, Square, Clock, AlertCircle, ExternalLink, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/utils/utils';
import { Insight } from '../types';

interface ActionItem {
  id: string;
  title: string;
  description: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  deadline: string;
  estimatedTime: string;
  category: 'immediate' | 'planning' | 'monitoring';
  completed: boolean;
  actionType?: 'navigate' | 'external' | 'task';
  actionUrl?: string;
}

interface ActionCardProps {
  insight: Insight;
}

const getActionPlan = (insight: Insight): ActionItem[] => {
  switch (insight.type) {
    case 'critical':
      return [
        {
          id: 'crit-1',
          title: 'Criar pedido de reposição urgente',
          description: 'Contactar fornecedor para entrega em até 24h dos produtos críticos',
          priority: 'urgent',
          deadline: 'Próximas 2 horas',
          estimatedTime: '15 min',
          category: 'immediate',
          completed: false,
          actionType: 'navigate',
          actionUrl: '/inventory/orders/new'
        },
        {
          id: 'crit-2',
          title: 'Verificar transferência entre lojas',
          description: 'Consultar estoque disponível em outras unidades para transferência imediata',
          priority: 'urgent',
          deadline: 'Próximas 3 horas',
          estimatedTime: '20 min',
          category: 'immediate',
          completed: false,
          actionType: 'navigate',
          actionUrl: '/inventory/transfers'
        },
        {
          id: 'crit-3',
          title: 'Notificar equipe de vendas',
          description: 'Alertar vendedores sobre produtos em falta para sugerir alternativas',
          priority: 'high',
          deadline: 'Hoje',
          estimatedTime: '10 min',
          category: 'immediate',
          completed: false,
          actionType: 'task'
        },
        {
          id: 'crit-4',
          title: 'Ajustar previsão de demanda',
          description: 'Atualizar algoritmo de previsão com base no padrão atual',
          priority: 'medium',
          deadline: 'Esta semana',
          estimatedTime: '45 min',
          category: 'planning',
          completed: false,
          actionType: 'navigate',
          actionUrl: '/analytics/forecasting'
        }
      ];
    
    case 'attention':
      return [
        {
          id: 'att-1',
          title: 'Sincronizar preços entre lojas',
          description: 'Executar sincronização automática e verificar consistência',
          priority: 'high',
          deadline: 'Hoje',
          estimatedTime: '10 min',
          category: 'immediate',
          completed: false,
          actionType: 'navigate',
          actionUrl: '/pricing/sync'
        },
        {
          id: 'att-2',
          title: 'Revisar outros produtos',
          description: 'Verificar se existem outras inconsistências de preço no sistema',
          priority: 'medium',
          deadline: 'Hoje',
          estimatedTime: '25 min',
          category: 'immediate',
          completed: false,
          actionType: 'navigate',
          actionUrl: '/pricing/audit'
        },
        {
          id: 'att-3',
          title: 'Configurar alertas preventivos',
          description: 'Implementar notificações automáticas para inconsistências futuras',
          priority: 'medium',
          deadline: 'Esta semana',
          estimatedTime: '30 min',
          category: 'planning',
          completed: false,
          actionType: 'navigate',
          actionUrl: '/settings/alerts'
        }
      ];
    
    case 'opportunity':
      return [
        {
          id: 'opp-1',
          title: 'Criar promoção direcionada',
          description: 'Configurar promoção "Alternativa Perfeita" para produtos em alta',
          priority: 'high',
          deadline: 'Hoje',
          estimatedTime: '20 min',
          category: 'immediate',
          completed: false,
          actionType: 'navigate',
          actionUrl: '/promotions/create'
        },
        {
          id: 'opp-2',
          title: 'Preparar comunicação de marketing',
          description: 'Criar materiais destacando produtos como "alternativa perfeita"',
          priority: 'high',
          deadline: 'Hoje',
          estimatedTime: '30 min',
          category: 'immediate',
          completed: false,
          actionType: 'external',
          actionUrl: '/marketing/campaigns'
        },
        {
          id: 'opp-3',
          title: 'Monitorar performance da promoção',
          description: 'Acompanhar vendas e ajustar estratégia conforme necessário',
          priority: 'medium',
          deadline: 'Próximos 7 dias',
          estimatedTime: '15 min/dia',
          category: 'monitoring',
          completed: false,
          actionType: 'navigate',
          actionUrl: '/analytics/promotions'
        }
      ];
    
    case 'achievement':
      return [
        {
          id: 'ach-1',
          title: 'Documentar estratégias de sucesso',
          description: 'Registrar fatores que levaram ao sucesso para replicação',
          priority: 'medium',
          deadline: 'Esta semana',
          estimatedTime: '30 min',
          category: 'planning',
          completed: false,
          actionType: 'task'
        },
        {
          id: 'ach-2',
          title: 'Aplicar estratégia a outras categorias',
          description: 'Identificar categorias com potencial similar e aplicar mesma abordagem',
          priority: 'medium',
          deadline: 'Próximas 2 semanas',
          estimatedTime: '60 min',
          category: 'planning',
          completed: false,
          actionType: 'navigate',
          actionUrl: '/analytics/categories'
        },
        {
          id: 'ach-3',
          title: 'Compartilhar resultados com equipe',
          description: 'Apresentar conquista e aprendizados para toda a equipe',
          priority: 'low',
          deadline: 'Este mês',
          estimatedTime: '45 min',
          category: 'planning',
          completed: false,
          actionType: 'task'
        }
      ];
    
    default:
      return [
        {
          id: 'def-1',
          title: 'Continuar monitoramento',
          description: 'Manter acompanhamento da situação atual',
          priority: 'low',
          deadline: 'Contínuo',
          estimatedTime: '5 min/dia',
          category: 'monitoring',
          completed: false,
          actionType: 'task'
        }
      ];
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return 'destructive';
    case 'high':
      return 'warning';
    case 'medium':
      return 'secondary';
    case 'low':
      return 'outline';
    default:
      return 'outline';
  }
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'immediate':
      return AlertCircle;
    case 'planning':
      return Plus;
    case 'monitoring':
      return Clock;
    default:
      return CheckSquare;
  }
};

export function ActionCard({ insight }: ActionCardProps) {
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    // Load action plan and check localStorage for completed items
    const baseActions = getActionPlan(insight);
    const storageKey = `insight-actions-${insight.id}`;
    const savedState = localStorage.getItem(storageKey);
    
    if (savedState) {
      try {
        const savedActions = JSON.parse(savedState);
        const mergedActions = baseActions.map(action => {
          const savedAction = savedActions.find((saved: ActionItem) => saved.id === action.id);
          return savedAction ? { ...action, completed: savedAction.completed } : action;
        });
        setActionItems(mergedActions);
        setCompletedCount(mergedActions.filter(action => action.completed).length);
      } catch (error) {
        setActionItems(baseActions);
        setCompletedCount(0);
      }
    } else {
      setActionItems(baseActions);
      setCompletedCount(0);
    }
  }, [insight.id]);

  const toggleActionComplete = (actionId: string) => {
    const updatedActions = actionItems.map(action => 
      action.id === actionId ? { ...action, completed: !action.completed } : action
    );
    
    setActionItems(updatedActions);
    const newCompletedCount = updatedActions.filter(action => action.completed).length;
    setCompletedCount(newCompletedCount);
    
    // Save to localStorage
    const storageKey = `insight-actions-${insight.id}`;
    localStorage.setItem(storageKey, JSON.stringify(updatedActions));
  };

  const handleActionClick = (action: ActionItem) => {
    if (action.actionType === 'navigate' && action.actionUrl) {
      // In a real app, this would use router.push
      console.debug(`Navigate to: ${action.actionUrl}`);
    } else if (action.actionType === 'external' && action.actionUrl) {
      window.open(action.actionUrl, '_blank');
    }
  };

  const progressPercentage = actionItems.length > 0 ? (completedCount / actionItems.length) * 100 : 0;

  // Group actions by category
  const groupedActions = actionItems.reduce((acc, action) => {
    if (!acc[action.category]) {
      acc[action.category] = [];
    }
    acc[action.category].push(action);
    return acc;
  }, {} as Record<string, ActionItem[]>);

  const categoryLabels = {
    immediate: 'Ações Imediatas',
    planning: 'Planejamento',
    monitoring: 'Monitoramento'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-green-500" />
            Plano de Ação
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {completedCount}/{actionItems.length} concluídas
            </span>
            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {Object.entries(groupedActions).map(([category, actions]) => {
          const CategoryIcon = getCategoryIcon(category);
          
          return (
            <div key={category} className="space-y-3">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                <CategoryIcon className="h-4 w-4" />
                {categoryLabels[category as keyof typeof categoryLabels]}
              </h4>
              
              <div className="space-y-3">
                {actions.map((action) => (
                  <div 
                    key={action.id}
                    className={cn(
                      'p-4 rounded-lg border transition-all duration-200',
                      action.completed 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-background border-border hover:border-primary/50'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleActionComplete(action.id)}
                        className="mt-1 p-1 hover:bg-accent rounded"
                      >
                        {action.completed ? (
                          <CheckSquare className="h-5 w-5 text-green-600" />
                        ) : (
                          <Square className="h-5 w-5 text-muted-foreground" />
                        )}
                      </button>
                      
                      {/* Content */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h5 className={cn(
                            'font-medium leading-tight',
                            action.completed ? 'text-muted-foreground line-through' : 'text-foreground'
                          )}>
                            {action.title}
                          </h5>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant={getPriorityColor(action.priority) as any} className="text-xs">
                              {action.priority.charAt(0).toUpperCase() + action.priority.slice(1)}
                            </Badge>
                          </div>
                        </div>
                        
                        <p className={cn(
                          'text-sm leading-relaxed',
                          action.completed ? 'text-muted-foreground' : 'text-muted-foreground'
                        )}>
                          {action.description}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {action.deadline}
                            </span>
                            <span>Tempo: {action.estimatedTime}</span>
                          </div>
                          
                          {action.actionType && action.actionUrl && !action.completed && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleActionClick(action)}
                              className="text-xs"
                            >
                              {action.actionType === 'navigate' ? 'Ir para' : 'Abrir'}
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        
        {/* Summary */}
        {completedCount === actionItems.length && actionItems.length > 0 && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
            <div className="text-green-700 font-medium">
              🎉 Parabéns! Todas as ações foram concluídas.
            </div>
            <div className="text-sm text-green-600 mt-1">
              Continue monitorando a situação para garantir que os resultados sejam mantidos.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}