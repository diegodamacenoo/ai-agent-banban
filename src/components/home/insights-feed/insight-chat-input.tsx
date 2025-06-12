"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowUp } from "lucide-react"

interface InsightChatInputProps {
  onSendMessage: (message: string) => void
  isLoading?: boolean
}

export function InsightChatInput({ onSendMessage, isLoading = false }: InsightChatInputProps) {
  const [chatInput, setChatInput] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleFocus = () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current)
      blurTimeoutRef.current = null
    }
    setIsFocused(true)
  }

  const handleBlur = (e: React.FocusEvent) => {
    blurTimeoutRef.current = setTimeout(() => {
      // Usamos 'closest' para verificar se o novo foco ainda está dentro do formulário
      if (!e.relatedTarget || !e.currentTarget?.closest('form')?.contains(e.relatedTarget as Node)) {
        setIsFocused(false)
      }
    }, 150) // Pequeno delay para permitir cliques em botões dentro do form
  }

  const handleSendMessage = () => {
    if (!chatInput.trim() || isLoading) return
    onSendMessage(chatInput)
    setChatInput("")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSendMessage()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className={`w-full mx-auto duration-300 rounded-full border backdrop-blur supports-[backdrop-filter]:bg-background/60 bg-background shadow-md transition-all ${isFocused ? 'max-w-full' : 'max-w-md'}`}>
      <div className="p-2">
        <form onSubmit={handleSubmit} onFocus={handleFocus} onBlur={handleBlur} className="flex gap-2">
          <div className="relative flex-1">
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua pergunta..."
              disabled={isLoading}
              aria-label="Digite sua pergunta para o assistente IA"
              className="pl-4 pr-4 py-2 min-h-[40px] resize-none border-none bg-transparent shadow-none focus-visible:ring-0"
            />
          </div>
          <Button 
            type="submit"
            disabled={!chatInput.trim() || isLoading}
            aria-label="Enviar mensagem"
            className="shrink-0 rounded-full text-black bg-gray-200 h-10 w-10 hover:bg-gray-300 shadow-none"
          >
            <ArrowUp className="size-7" strokeWidth={2.5}/>
          </Button>
        </form>
      </div>
    </div>
  )
} 