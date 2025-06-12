"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowUp } from "lucide-react"

interface ChatInputProps {
  onSendMessage?: (message: string) => void
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({ 
  onSendMessage, 
  disabled = false,
  placeholder = "Pergunte algo sobre o que está vendo..."
}: ChatInputProps) {
  const [message, setMessage] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleFocus = () => {
    // Cancela qualquer timeout de blur pendente
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current)
      blurTimeoutRef.current = null
    }
    setIsFocused(true)
  }

  const handleBlur = (e: React.FocusEvent) => {
    // Adiciona um pequeno delay para permitir clicks no botão
    blurTimeoutRef.current = setTimeout(() => {
      // Verifica se o foco não foi para o botão de enviar
      if (!e.relatedTarget || !e.currentTarget.closest('form')?.contains(e.relatedTarget as Node)) {
        setIsFocused(false)
      }
    }, 150)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && onSendMessage) {
      onSendMessage(message.trim())
      setMessage("")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className={`w-full mx-auto duration-300 rounded-full backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-lg transition-all ${isFocused ? 'max-w-lg' : 'max-w-sm'}`}>
      <div className="p-2">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Input
              title="text-input"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={disabled}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className="pl-4 pr-4 py-2 min-h-[40px] resize-none border-none bg-transparent shadow-none focus-visible:ring-0"
            />
          </div>
          <Button 
            type="submit" 
            disabled={disabled || !message.trim()}
            className="shrink-0 rounded-full text-black bg-gray-200 h-10 w-10 hover:bg-gray-300 shadow-none"
          >
            <ArrowUp className="size-7" strokeWidth={2.5}/>
            <span className="sr-only">Enviar mensagem</span>
          </Button>
        </form>
      </div>
    </div>
  )
} 