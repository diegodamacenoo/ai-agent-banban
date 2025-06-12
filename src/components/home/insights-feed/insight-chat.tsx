"use client"

import { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { highlightKeywords } from "./text-highlighter"
import { ContextualDataMapper } from "./contextual-data-mapper"
import { Sparkles, Lightbulb, Zap, User } from "lucide-react"
import { cn } from '@/lib/utils'

interface ChatMessage {
  id: string
  content: string
  isAI: boolean
  timestamp: Date
}

interface InsightChatProps {
  insightId: string
  messages: ChatMessage[]
  onSendMessage: (message: string) => void
  isLoading?: boolean
}

export function InsightChat({ insightId, messages, onSendMessage, isLoading = false }: InsightChatProps) {
  const [showSuggestions, setShowSuggestions] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const contextualData = ContextualDataMapper.getContextualChatData(insightId)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if(messages.length > 1) { // Hide suggestions after the first user message
        setShowSuggestions(false)
    } else {
        setShowSuggestions(true)
    }
  }, [messages])


  const handleSuggestedQuestion = (question: string) => {
    onSendMessage(question)
  }

  const handleQuickAction = (action: string, label: string) => {
    const actionMessage = `Executar ação: ${label}`
    onSendMessage(actionMessage)
  }

  const shouldShowContextualSuggestions = showSuggestions && messages.length <= 1

  return (
    <div className="space-y-3">
      <h3 className="font-medium flex items-center gap-2">
        <Sparkles className="h-4 w-4" />
        Assistente IA
      </h3>
      
      {/* Chat Messages */}
      <div 
        className="space-y-4 bg-muted/20 rounded-lg p-3"
        aria-live="polite"
        aria-label="Conversa com assistente IA"
      >
        {messages.map((message) => (
          <div key={message.id} className={`flex gap-3 ${message.isAI ? 'justify-start' : 'justify-end'}`}>
            {message.isAI && (
              <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
            )}
            <div className={`max-w-[80%] p-3 rounded-lg text-sm ${
              message.isAI 
                ? 'bg-background border text-left' 
                : 'bg-primary text-primary-foreground text-right ml-auto'
            }`}>
              {message.isAI ? highlightKeywords(message.content) : message.content}
            </div>
             {!message.isAI && (
               <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                 <User className="h-4 w-4 text-primary-foreground" />
               </div>
             )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            </div>
            <div className="bg-background border text-left p-3 rounded-lg text-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Sugestões Contextuais */}
      {shouldShowContextualSuggestions && (
        <div className="space-y-3">
          {/* Perguntas Sugeridas */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Perguntas sugeridas</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {contextualData.suggestedQuestions.slice(0, 3).map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestedQuestion(question)}
                  className="text-xs h-auto py-2 px-3 rounded-full border-dashed hover:border-solid transition-all"
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>

          {/* Ações Rápidas - Temporariamente ocultas */}
          {false && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Ações rápidas</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {contextualData.quickActions.slice(0, 3).map((action, index) => {
                  const buttonVariant = action.type === 'primary' ? 'default' : action.type === 'warning' ? 'destructive' : 'secondary'
                  return (
                    <Button
                      key={index}
                      variant={buttonVariant}
                      size="sm"
                      onClick={() => handleQuickAction(action.action, action.label)}
                      className="text-xs h-auto py-2 px-3 rounded-full transition-all"
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      {action.label}
                    </Button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 