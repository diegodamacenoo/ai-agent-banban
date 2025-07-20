'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader } from '@/shared/ui/card';
import { cn } from '@/shared/utils/utils';
import { Insight, ChatMessage } from '../types';

interface FloatingChatProps {
  isOpen: boolean;
  onToggle: () => void;
  selectedInsight?: Insight | null;
  availableInsights: Insight[];
}

const mockResponses = {
  stockCritical: "📊 Análise: Os 3 produtos de calçados estão com estoque baixo porque tiveram 40% mais vendas que o normal nos últimos 7 dias. Isso coincide com o início do inverno.\n\n🎯 Recomendações:\n1. Reabastecer urgentemente - prazo: até amanhã\n2. Promover tênis similares enquanto isso\n3. Ajustar previsão para próxima temporada",
  priceInconsistency: "🔍 Identifiquei que a diferença de preços aconteceu depois da última atualização manual. A Loja Centro ainda tem o preço antigo.\n\n⚡ Ação rápida:\n1. Sincronizar preços automaticamente\n2. Verificar outros produtos\n3. Configurar alertas de inconsistência",
  opportunity: "💡 Perfeita conexão! Enquanto calçados estão em falta, os tênis Nike têm 40% mais procura. \n\n🚀 Estratégia sugerida:\n1. Promoção flash de tênis\n2. Bundle: 'tênis + meia grátis'\n3. Comunicar: 'alternativa perfeita para calçados'"
};

export function FloatingChat({ isOpen, onToggle, selectedInsight, availableInsights }: FloatingChatProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sugestões baseadas no contexto
  const getSuggestions = () => {
    if (selectedInsight) {
      switch (selectedInsight.type) {
        case 'critical':
          return [
            'Como resolver este estoque crítico?',
            'Por que isso aconteceu?',
            'Quanto tempo tenho para agir?'
          ];
        case 'opportunity':
          return [
            'Como aproveitar esta oportunidade?',
            'Qual o potencial de receita?',
            'Que ações tomar agora?'
          ];
        case 'attention':
          return [
            'Como corrigir rapidamente?',
            'Isso já aconteceu antes?',
            'Como prevenir no futuro?'
          ];
        default:
          return [
            'Me explique melhor este insight',
            'Que dados você tem sobre isso?',
            'Como posso melhorar isso?'
          ];
      }
    }

    return [
      'Por que tenho estoque baixo em várias lojas?',
      'Como resolver inconsistências de preço?',
      'Que produtos devo repor primeiro?',
      'Mostre tendências de vendas'
    ];
  };

  const suggestions = getSuggestions();

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const handleSendMessage = async (text: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: text,
      timestamp: new Date(),
      relatedInsightId: selectedInsight?.id
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    setIsExpanded(true);

    // Simular resposta da IA
    setTimeout(() => {
      let response = "Entendi sua pergunta! Vou analisar os dados e te dar uma resposta detalhada com recomendações práticas.";
      
      if (text.toLowerCase().includes('estoque')) {
        response = mockResponses.stockCritical;
      } else if (text.toLowerCase().includes('preço')) {
        response = mockResponses.priceInconsistency;
      } else if (text.toLowerCase().includes('oportunidade') || text.toLowerCase().includes('aproveitar')) {
        response = mockResponses.opportunity;
      }

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date(),
        suggestions: [
          'Criar tarefas para isso',
          'Ver dados históricos',
          'Próxima ação recomendada'
        ]
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      handleSendMessage(inputValue.trim());
    }
  };

  useEffect(() => {
    if (isOpen && !isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isExpanded]);

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <div className="flex flex-col items-center gap-3">
          {/* Mensagem Proativa da IA */}
          <div className="bg-white border border-border rounded-xl p-4 shadow-lg max-w-md animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-foreground">
                  "Notei que você sempre age rápido em insights de estoque. Destacando esses para você primeiro!"
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Assistente IA • Agora
                </div>
              </div>
            </div>
          </div>

          {/* Botão de Chat */}
          <Button
            onClick={onToggle}
            className="px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg transition-all duration-300 hover:shadow-xl"
            size="lg"
          >
            <MessageCircle className="h-5 w-5 mr-2" />
            Converse comigo sobre seus insights...
            <Sparkles className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Overlay para modo expandido */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Chat Interface */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <Card className={cn(
          'transition-all duration-300 shadow-xl',
          isExpanded 
            ? 'w-[600px] h-[500px]' 
            : 'w-[400px] h-auto'
        )}>
          {/* Header */}
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <div className="font-medium text-sm">Assistente IA</div>
                  <div className="text-xs text-muted-foreground">
                    {selectedInsight ? `Contexto: ${selectedInsight.title}` : 'Pronto para ajudar'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {!isExpanded && messages.length > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsExpanded(true)}
                    className="h-8 w-8"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggle}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Conversa (apenas se expandido) */}
            {isExpanded && (
              <div className="h-[280px] overflow-y-auto space-y-3 p-2 border rounded-lg bg-muted/30">
                {messages.length === 0 && (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    💭 Como posso te ajudar com os insights de hoje?
                  </div>
                )}
                
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex',
                      message.type === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[80%] rounded-lg px-3 py-2 text-sm',
                        message.type === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background border'
                      )}
                    >
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      
                      {/* Sugestões de ação */}
                      {message.suggestions && (
                        <div className="mt-2 space-y-1">
                          {message.suggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              className="block w-full text-left px-2 py-1 text-xs bg-accent hover:bg-accent/80 rounded border text-accent-foreground"
                              onClick={() => handleSuggestionClick(suggestion)}
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-background border rounded-lg px-3 py-2">
                      <div className="flex items-center gap-1">
                        <div className="flex gap-1">
                          <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                          <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce"></div>
                        </div>
                        <span className="text-xs text-muted-foreground ml-2">Analisando...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sugestões */}
            {!isExpanded && (
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground font-medium">💡 Sugestões:</div>
                <div className="space-y-1">
                  {suggestions.slice(0, 3).map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="block w-full text-left px-3 py-2 text-sm bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                    >
                      • {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Digite sua pergunta..."
                className="flex-1 px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <Button type="submit" size="icon" disabled={!inputValue.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}