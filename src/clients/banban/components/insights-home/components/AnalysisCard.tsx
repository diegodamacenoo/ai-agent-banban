'use client';

import { Sparkles, Brain, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/utils/utils';
import { Insight } from '../types';

interface AnalysisCardProps {
  insight: Insight;
  onStartChat?: (insight: Insight) => void;
}

const getChatMessages = (insight: Insight) => {
  switch (insight.type) {
    case 'critical':
      return [
        {
          id: '1',
          type: 'assistant',
          content: `🚨 Detectei uma situação crítica que precisa da sua atenção imediata!\n\nAnalisei os dados e identifiquei que este problema pode resultar em perdas significativas se não for resolvido nas próximas horas.`,
          timestamp: 'Agora'
        },
        {
          id: '2', 
          type: 'assistant',
          content: `🔍 **Causa raiz identificada:**\nAumento inesperado de 40% nas vendas dos produtos afetados nos últimos 7 dias, coincidindo com mudanças sazonais e promoções de concorrentes.`,
          timestamp: 'Agora'
        },
        {
          id: '3',
          type: 'assistant', 
          content: `💡 **Minha recomendação:**\nImplementar reposição de emergência com prazo máximo de 24h e criar transferências entre lojas para minimizar perdas imediatas.\n\n⏰ **Urgência:** Ação necessária nas próximas 2 horas!`,
          timestamp: 'Agora'
        }
      ];
    
    case 'attention':
      return [
        {
          id: '1',
          type: 'assistant',
          content: `⚠️ Identifiquei uma situação que merece sua atenção hoje.\n\nEmbora não seja crítica, pode evoluir para um problema maior se não for endereçada.`,
          timestamp: 'Há 5 min'
        },
        {
          id: '2',
          type: 'assistant',
          content: `🔍 **Análise da situação:**\nDiferença de preços resultante de atualização manual incompleta. O sistema detectou inconsistências que podem confundir clientes.`,
          timestamp: 'Há 5 min'
        },
        {
          id: '3',
          type: 'assistant',
          content: `🎯 **Plano de ação:**\nSincronizar preços automaticamente e implementar alertas preventivos para evitar recorrência.\n\n📅 **Prazo:** Resolver ainda hoje`,
          timestamp: 'Há 5 min'
        }
      ];
    
    case 'opportunity':
      return [
        {
          id: '1',
          type: 'assistant',
          content: `🚀 Excelente notícia! Detectei uma oportunidade valiosa para você!\n\nCom base em análise preditiva e tendências de mercado, agir agora pode gerar receita adicional significativa.`,
          timestamp: 'Há 2 min'
        },
        {
          id: '2',
          type: 'assistant',
          content: `📊 **Oportunidade baseada em:**\nAlta demanda por produtos similares (40% acima da média) enquanto produtos relacionados estão em falta, criando uma janela ideal para capitalização.`,
          timestamp: 'Há 2 min'
        },
        {
          id: '3',
          type: 'assistant',
          content: `💰 **Estratégia recomendada:**\nCriar promoção direcionada com foco em produtos substitutos e implementar estratégia de comunicação "alternativa perfeita".\n\n⭐ **Potencial:** Alta conversão esperada!`,
          timestamp: 'Há 2 min'
        }
      ];
    
    case 'achievement':
      return [
        {
          id: '1',
          type: 'assistant',
          content: `🎉 Parabéns! Tenho ótimas notícias para compartilhar!\n\nEste resultado superou as expectativas e merece análise para replicação. Você está no caminho certo!`,
          timestamp: 'Há 10 min'
        },
        {
          id: '2',
          type: 'assistant',
          content: `🏆 **Fatores de sucesso identificados:**\nCombinação de sazonalidade favorável, estratégia de marketing efetiva na categoria Moda Feminina e otimização de estoque realizada no mês anterior.`,
          timestamp: 'Há 10 min'
        },
        {
          id: '3',
          type: 'assistant',
          content: `📈 **Próximos passos:**\nDocumentar estratégias utilizadas e aplicar mesma abordagem para outras categorias com potencial similar.\n\n🎯 **Objetivo:** Replicar este sucesso!`,
          timestamp: 'Há 10 min'
        }
      ];
    
    default:
      return [
        {
          id: '1',
          type: 'assistant',
          content: `🤖 Identifiquei alguns padrões interessantes que merecem acompanhamento.\n\nEsta situação está dentro do esperado, mas há oportunidades de otimização.`,
          timestamp: 'Há 15 min'
        },
        {
          id: '2',
          type: 'assistant',
          content: `📊 **Padrão identificado:**\nVariação dentro do esperado para esta época do ano, mas com alguns pontos que merecem observação contínua.`,
          timestamp: 'Há 15 min'
        },
        {
          id: '3',
          type: 'assistant',
          content: `👀 **Recomendação:**\nManter monitoramento e avaliar tendências ao longo da próxima semana.\n\n📅 **Próxima análise:** Em 7 dias`,
          timestamp: 'Há 15 min'
        }
      ];
  }
};

const getUrgencyBadge = (insight: Insight) => {
  switch (insight.type) {
    case 'critical':
      return { variant: 'destructive', label: 'URGENTE' };
    case 'attention':
      return { variant: 'warning', label: 'HOJE' };
    case 'opportunity':
      return { variant: 'success', label: 'OPORTUNIDADE' };
    case 'achievement':
      return { variant: 'success', label: 'SUCESSO' };
    default:
      return { variant: 'secondary', label: 'MODERADO' };
  }
};

export function AnalysisCard({ insight, onStartChat }: AnalysisCardProps) {
  const messages = getChatMessages(insight);
  const urgencyBadge = getUrgencyBadge(insight);

  const handleStartChat = () => {
    if (onStartChat) {
      onStartChat(insight);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <div className="font-medium text-base">Análise da IA</div>
              <div className="text-sm text-muted-foreground">Assistente Inteligente</div>
            </div>
          </div>
          <Badge variant={urgencyBadge.variant as any} className="text-xs">
            {urgencyBadge.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {/* Chat Messages */}
        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className="flex justify-start animate-in fade-in slide-in-from-left-2"
              style={{
                animationDelay: `${index * 200}ms`,
                animationDuration: '400ms',
                animationFillMode: 'both'
              }}
            >
              <div className="max-w-[90%] bg-background border rounded-lg px-4 py-3 shadow-sm">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content}
                </div>
                <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Brain className="h-3 w-3" />
                  {message.timestamp}
                </div>
              </div>
            </div>
          ))}
          
          {/* Insight Original como mensagem do usuário */}
          <div className="flex justify-end">
            <div className="max-w-[90%] bg-muted/60 border rounded-lg px-4 py-3">
              <div className="text-sm leading-relaxed">
                📊 {insight.naturalLanguageText}
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Insight Original • Sistema
              </div>
            </div>
          </div>
        </div>

        {/* Chat Button & Status */}
        <div className="mt-4 pt-3 border-t border-border space-y-3">
          {/* Botão de Conversa */}
          <div className="flex justify-center">
            <Button
              onClick={handleStartChat}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              Conversar com a IA sobre este insight
              <Sparkles className="h-3 w-3" />
            </Button>
          </div>

          {/* Status da IA */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>IA ativa • Monitorando situação</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}