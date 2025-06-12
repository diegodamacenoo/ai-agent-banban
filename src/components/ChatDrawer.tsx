"use client";

import { useState, useRef, useEffect } from 'react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, User, Send, X, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export function ChatDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Olá! Como posso ajudá-lo hoje?',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Só faz scroll automático após a primeira interação do usuário
  useEffect(() => {
    if (isOpen && hasInteracted && messages.length > 1) {
      scrollToBottom();
    }
  }, [messages, isOpen, hasInteracted]);

  // Quando o drawer abre, reseta o scroll para o topo
  useEffect(() => {
    if (isOpen) {
      // Reset direto no scroll container
      const resetScroll = () => {
        const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
        if (viewport) {
          viewport.scrollTop = 0;
        }
      };
      
      // Executa imediatamente e com delay para garantir
      resetScroll();
      setTimeout(resetScroll, 50);
      setTimeout(resetScroll, 150);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // Marca que o usuário interagiu
    setHasInteracted(true);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: userMessage.content,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro na requisição');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Stream não disponível');
      }

      let streamedContent = '';

      // Processa o stream de dados
      for await (const chunk of readableStreamAsyncIterator(reader)) {
        const text = new TextDecoder().decode(chunk);
        streamedContent += text;

        // Atualiza a mensagem do assistente com o conteúdo acumulado
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessage.id 
            ? { ...msg, content: streamedContent }
            : msg
        ));
      }

      // Finaliza o streaming
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessage.id 
          ? { ...msg, isStreaming: false }
          : msg
      ));

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      // Remove a mensagem de streaming em caso de erro
      setMessages(prev => prev.filter(msg => msg.id !== assistantMessage.id));
      
      // Adiciona mensagem de erro
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Botão flutuante fixo */}
      <div className="fixed bottom-6 right-6 z-50">
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <DrawerTrigger asChild>
            <Button 
              size="lg" 
              className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <MessageCircle className="w-6 h-6" />
              <span className="sr-only">Abrir chat IA</span>
            </Button>
          </DrawerTrigger>
          <DrawerContent className="h-[80vh] max-h-[600px]">
            <div className="mx-auto w-full max-w-4xl h-full flex flex-col">
              <DrawerHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <DrawerTitle className="flex items-center gap-2">
                      <Bot className="w-5 h-5" />
                      Assistente IA
                    </DrawerTitle>
                    <DrawerDescription>
                      Faça perguntas sobre o sistema e obtenha respostas inteligentes
                    </DrawerDescription>
                  </div>
                  <DrawerClose asChild>
                    <Button variant="ghost" size="icon">
                      <X className="w-4 h-4" />
                    </Button>
                  </DrawerClose>
                </div>
              </DrawerHeader>

              {/* Lista de mensagens */}
              <div className="flex-1 p-4">
                <ScrollArea ref={scrollAreaRef} className="h-full pr-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          'flex gap-3 max-w-[80%]',
                          message.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                        )}
                      >
                        <div className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                          message.role === 'user' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted'
                        )}>
                          {message.role === 'user' ? (
                            <User className="w-4 h-4" />
                          ) : (
                            <Bot className="w-4 h-4" />
                          )}
                        </div>

                        <div className={cn(
                          'rounded-lg px-3 py-2 text-sm',
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        )}>
                          <p className="whitespace-pre-wrap">{message.content}</p>
                          {message.isStreaming && (
                            <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div ref={messagesEndRef} />
                </ScrollArea>
              </div>

              {/* Input de mensagem */}
              <DrawerFooter className="border-t">
                <div className="flex gap-2">
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Digite sua mensagem... (Enter para enviar, Shift+Enter para nova linha)"
                    className="min-h-[44px] max-h-32 resize-none"
                    disabled={isLoading}
                  />
                  <Button 
                    onClick={handleSend} 
                    disabled={!input.trim() || isLoading}
                    size="icon"
                    className="w-11 h-11 flex-shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  As respostas são geradas por IA e podem conter imprecisões.
                </p>
              </DrawerFooter>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </>
  );
}

// Função auxiliar para converter ReadableStream em AsyncIterator
async function* readableStreamAsyncIterator(reader: ReadableStreamDefaultReader<Uint8Array>) {
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
} 