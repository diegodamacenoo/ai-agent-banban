"use client"

import { useState } from "react"
import { ChatInput } from "./chat-input"
import { ChatSidebar } from "../../chat-sidebar"

interface ChatWrapperProps {
  className?: string
  style?: React.CSSProperties
  onChatOpen?: () => void
  onChatClose?: () => void
  onChatWidthChange?: (width: number) => void
  isChatOpen?: boolean
}

export function ChatWrapper({ 
  className, 
  style, 
  onChatOpen, 
  onChatClose, 
  onChatWidthChange, 
  isChatOpen: externalChatOpen 
}: ChatWrapperProps) {
  const [internalChatOpen, setInternalChatOpen] = useState(false)
  const [pendingMessage, setPendingMessage] = useState("")
  
  // Use prop externa se fornecida, senão use estado interno
  const isChatOpen = externalChatOpen !== undefined ? externalChatOpen : internalChatOpen

  const handleSendMessage = (message: string) => {
    // Define a mensagem pendente para ser enviada quando a sidebar abrir
    setPendingMessage(message)
    
    // Abre a sidebar
    if (externalChatOpen === undefined) {
      setInternalChatOpen(true)
    }
    onChatOpen?.()
    
    console.log('Opening chat with message:', message)
  }

  const handleCloseChatSidebar = () => {
    if (externalChatOpen === undefined) {
      setInternalChatOpen(false)
    }
    setPendingMessage("")
    onChatClose?.()
  }

  return (
    <>
      {/* Mostrar barra flutuante apenas quando chat não estiver aberto */}
      {!isChatOpen && (
        <div className={className} style={style}>
          <div className="max-w-lg mx-auto pb-4">
            <ChatInput 
              onSendMessage={handleSendMessage}
              placeholder="Pergunte algo sobre o que está vendo..."
            />
          </div>
        </div>
      )}
      
      <ChatSidebar 
        isOpen={isChatOpen}
        onClose={handleCloseChatSidebar}
        initialMessage={pendingMessage}
        onWidthChange={onChatWidthChange}
      />
    </>
  )
} 