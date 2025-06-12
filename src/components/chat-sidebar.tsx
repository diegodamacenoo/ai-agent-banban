"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { X, ArrowUp, Bot, User, Sparkles, GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import { generateMockAIResponse, simulateStreamingResponse } from "@/lib/mock-ai-responses"

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isStreaming?: boolean
  suggestedActions?: string[]
}

interface ChatSidebarProps {
  isOpen: boolean
  onClose: () => void
  initialMessage?: string
  onWidthChange?: (width: number) => void
}

export function ChatSidebar({ isOpen, onClose, initialMessage, onWidthChange }: ChatSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasInitialized, setHasInitialized] = useState(false)
  const [width, setWidth] = useState(320) // w-80 = 320px
  const [isResizing, setIsResizing] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Limites de largura
  const MIN_WIDTH = 280 // Mínimo
  const MAX_WIDTH = 600 // Máximo

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Initialize chat when sidebar opens
  useEffect(() => {
    if (isOpen && !hasInitialized) {
      if (initialMessage && initialMessage.trim()) {
        // Se tem mensagem inicial, enviar diretamente
        const sendInitialMessage = async () => {
          await handleSendMessage(initialMessage)
        }
        sendInitialMessage()
      } else {
        // Se não tem mensagem inicial, mostrar mensagem de boas-vindas
        setMessages([{
          id: '1',
          role: 'assistant',
          content: 'Olá! Como posso ajudá-lo com o que você está vendo no sistema?',
          timestamp: new Date(),
        }])
      }
      setHasInitialized(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialMessage, hasInitialized])

  // Reset state when sidebar closes
  useEffect(() => {
    if (!isOpen) {
      setHasInitialized(false)
      setMessages([])
    }
  }, [isOpen])

  // Focus input when sidebar opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 300)
    }
  }, [isOpen])

  // Notify parent about width changes
  useEffect(() => {
    onWidthChange?.(width)
  }, [width, onWidthChange])

  // Handle input focus/blur like the floating bar
  const handleFocus = () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current)
      blurTimeoutRef.current = null
    }
    setIsFocused(true)
  }

  const handleBlur = (e: React.FocusEvent) => {
    blurTimeoutRef.current = setTimeout(() => {
      if (!e.relatedTarget || !e.currentTarget.closest('form')?.contains(e.relatedTarget as Node)) {
        setIsFocused(false)
      }
    }, 150)
  }

  // Resize functionality
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return
    
    const newWidth = window.innerWidth - e.clientX
    const clampedWidth = Math.min(Math.max(newWidth, MIN_WIDTH), MAX_WIDTH)
    setWidth(clampedWidth)
  }, [isResizing, MIN_WIDTH, MAX_WIDTH])

  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
    document.body.style.userSelect = ''
    document.body.style.cursor = ''
  }, [])

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  const handleSendMessage = async (messageText?: string) => {
    const messageToSend = messageText || input.trim()
    if (!messageToSend || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageToSend,
      timestamp: new Date(),
    }

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    }

    setMessages(prev => [...prev, userMessage, assistantMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Gera resposta mock contextualizada
      const mockResponse = generateMockAIResponse(messageToSend)
      
      // Simula streaming da resposta
      for await (const streamedContent of simulateStreamingResponse(mockResponse.response)) {
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessage.id 
            ? { ...msg, content: streamedContent }
            : msg
        ))
      }

      // Finaliza o streaming e adiciona ações sugeridas
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessage.id 
          ? { ...msg, isStreaming: false, suggestedActions: mockResponse.suggestedActions }
          : msg
      ))

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      // Remove a mensagem de streaming em caso de erro
      setMessages(prev => prev.filter(msg => msg.id !== assistantMessage.id))
      
      // Adiciona mensagem de erro
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      handleSendMessage()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  if (!isOpen) return null

  return (
    <div 
      ref={sidebarRef}
      className="fixed right-0 top-0 h-full bg-background border-l z-40 flex transform transition-all duration-300 ease-in-out"
      style={{ width: `${width}px` }}
    >
      {/* Resize Handle */}
      <div
        className="absolute left-0 top-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors group"
        onMouseDown={handleMouseDown}
      >
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-3 h-3 text-muted-foreground" />
        </div>
      </div>

      {/* Chat Content */}
      <div className="flex flex-col w-full ml-1">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Assistente IA</h3>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-3 max-w-[90%]',
                    message.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                  )}
                >
                  <div className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  )}>
                    {message.role === 'user' ? (
                      <User className="w-3 h-3" />
                    ) : (
                      <Bot className="w-3 h-3" />
                    )}
                  </div>

                  <div className={cn(
                    'rounded-lg px-3 py-2 text-sm',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}>
                    <div 
                      className="whitespace-pre-wrap prose prose-sm max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{
                        __html: message.content
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.*?)\*/g, '<em>$1</em>')
                          .replace(/\n/g, '<br/>')
                      }}
                    />
                    {message.isStreaming && (
                      <span className="inline-block w-1 h-3 bg-current animate-pulse ml-1" />
                    )}
                    
                    {/* Ações sugeridas para mensagens do assistente */}
                    {message.role === 'assistant' && message.suggestedActions && !message.isStreaming && (
                      <SuggestedActions 
                        actions={message.suggestedActions} 
                        onActionClick={(action) => handleSendMessage(action)}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>
        </div>

        {/* Input - Styled like floating bar */}
        <div className="p-4 border-t">
          <div className={`w-full mx-auto duration-300 rounded-full backdrop-blur supports-[backdrop-filter]:bg-background/60 border transition-all ${isFocused ? 'shadow-lg' : 'shadow-md'}`}>
            <div className="p-2">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Digite sua mensagem..."
                    disabled={isLoading}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    className="pl-4 pr-4 py-2 min-h-[40px] resize-none border-none bg-transparent shadow-none focus-visible:ring-0"
                  />
                </div>
                <Button 
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="shrink-0 rounded-full text-black bg-gray-200 h-10 w-10 hover:bg-gray-300 shadow-none"
                >
                  <ArrowUp className="size-7" strokeWidth={2.5}/>
                  <span className="sr-only">Enviar mensagem</span>
                </Button>
              </form>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Enter para enviar, Shift+Enter para nova linha
          </p>
        </div>
      </div>
    </div>
  )
}

// Componente para exibir ações sugeridas
function SuggestedActions({ actions, onActionClick }: { actions: string[], onActionClick: (action: string) => void }) {
  if (!actions || actions.length === 0) return null
  
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {actions.map((action, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          onClick={() => onActionClick(action)}
          className="text-xs h-7 px-2 rounded-full bg-muted/50 hover:bg-muted border-muted-foreground/20"
        >
          {action}
        </Button>
      ))}
    </div>
  )
} 