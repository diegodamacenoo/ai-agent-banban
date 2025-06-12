"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCcw, Calendar, EyeOff, MessageCircle, Sparkles } from "lucide-react"
import { InsightsFeed } from "@/components/home/insights-feed/insights-feed"
import { ChatWrapper } from "@/components/home/chat-interface/chat-wrapper"
import { TypingAnimation } from "@/components/ui/typing-animation"
import { cn } from "@/lib/utils"

interface HomePageClientProps {
  userName: string
  insights: any[]
}

export function HomePageClient({ userName, insights }: HomePageClientProps) {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatWidth, setChatWidth] = useState(320)
  const [showAnimation, setShowAnimation] = useState(true)
  const [sparkleComplete, setSparkleComplete] = useState(false)
  const [headerComplete, setHeaderComplete] = useState(false)

  const [ignoredInsights, setIgnoredInsights] = useState<string[]>([])
  const [postponedInsights, setPostponedInsights] = useState<string[]>([])
  const [showIgnored, setShowIgnored] = useState(false)
  const [showPostponed, setShowPostponed] = useState(false)

  const filteredInsights = insights.filter(insight => {
    if (showIgnored) return ignoredInsights.includes(insight.id)
    if (showPostponed) return postponedInsights.includes(insight.id)
    return !ignoredInsights.includes(insight.id) && !postponedInsights.includes(insight.id)
  })

  const handleIgnoreInsight = (insightId: string) => {
    setIgnoredInsights(prev => [...prev, insightId])
  }

  const handlePostponeInsight = (insightId: string) => {
    setPostponedInsights(prev => [...prev, insightId])
  }

  const handleRestoreInsight = (insightId: string) => {
    setIgnoredInsights(prev => prev.filter(id => id !== insightId))
    setPostponedInsights(prev => prev.filter(id => id !== insightId))
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Botão flutuante do chat */}
      {!isChatOpen && (
        <Button
          variant="ghost"
          onClick={() => setIsChatOpen(true)}
          className="fixed top-6 right-6 z-50 size-12 rounded-full hover:bg-muted/50 backdrop-blur-sm border border-border/20 animate-in fade-in slide-in-from-top-2 duration-500 delay-1000"
          size="icon"
        >
          <MessageCircle className="size-5 text-muted-foreground hover:text-foreground transition-colors" />
        </Button>
      )}
      
      {/* Conteúdo Principal */}
      <main 
        className={cn(
          "flex-1 px-4 pb-24 lg:px-6 transition-all duration-300",
          "animate-in fade-in slide-in-from-bottom-4 duration-700"
        )}
        style={{ 
          marginRight: isChatOpen ? `${chatWidth}px` : '0px'
        }}
      >
        {/* Header Conversacional */}
        <header className="max-w-4xl mx-auto mb-12 pt-24">
          <div className="flex items-start gap-4">
            {/* Ícone Sparkles com animação de pulo */}
            <div 
              className="animate-in slide-in-from-bottom-8 duration-700 delay-200"
              onAnimationEnd={() => {
                setTimeout(() => setSparkleComplete(true), 100)
              }}
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="size-6 text-primary animate-pulse" />
              </div>
            </div>
            
            {/* Título com animação */}
            <div className="flex-1 min-h-[4rem] flex items-start">
              {sparkleComplete && (
                <h1 className="text-5xl leading-tight font-bold tracking-tight animate-in fade-in slide-in-from-left-4 duration-500">
                  {showAnimation ? (
                    <TypingAnimation 
                      text={`Olá ${userName}, aqui estão os principais insights de hoje`}
                      speed={120}
                      onComplete={() => {
                        setShowAnimation(false)
                        setHeaderComplete(true)
                      }}
                    />
                  ) : (
                    `Olá ${userName}, aqui estão os principais insights de hoje`
                  )}
                </h1>
              )}
            </div>
          </div>
        </header>
        
        {/* Feed de Insights */}
        <div className={cn(
          "max-w-4xl mx-auto transition-all duration-500",
          headerComplete && "animate-in fade-in slide-in-from-bottom-2 duration-700"
        )}>
          {/* Header com controles */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              {/* Badges de insights ignorados/postergados */}
              {ignoredInsights.length > 0 && (
                <Button
                  variant={showIgnored ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setShowIgnored(!showIgnored)
                    setShowPostponed(false)
                  }}
                  className="relative"
                >
                  <EyeOff className="size-4 mr-2" />
                  Ignorados
                  <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full">
                    {ignoredInsights.length}
                  </span>
                </Button>
              )}
              
              {postponedInsights.length > 0 && (
                <Button
                  variant={showPostponed ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setShowPostponed(!showPostponed)
                    setShowIgnored(false)
                  }}
                  className="relative"
                >
                  <Calendar className="size-4 mr-2" />
                  Postergados
                  <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full">
                    {postponedInsights.length}
                  </span>
                </Button>
              )}
            </div>
            
            <Button variant="ghost" size="sm">
              <RefreshCcw className="size-4" />
            </Button>
          </div>

          {/* Título da seção atual */}
          {(showIgnored || showPostponed) && (
            <div className="mb-4 p-3 bg-muted/50 rounded-lg">
              <h3 className="font-medium">
                {showIgnored && "Insights Ignorados"}
                {showPostponed && "Insights Postergados"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {showIgnored && "Insights que você escolheu ignorar"}
                {showPostponed && "Insights que você decidiu revisar mais tarde"}
              </p>
              <Button
                variant="link"
                size="sm"
                onClick={() => {
                  setShowIgnored(false)
                  setShowPostponed(false)
                }}
                className="p-0 h-auto mt-2"
              >
                Voltar aos insights ativos
              </Button>
            </div>
          )}
          
          <InsightsFeed 
            insights={filteredInsights} 
            onIgnore={handleIgnoreInsight}
            onPostpone={handlePostponeInsight}
            onRestore={handleRestoreInsight}
            showActions={!showIgnored && !showPostponed}
            showRestoreActions={showIgnored || showPostponed}
          />
          

        </div>
      </main>
      
      {/* Chat Interface Fixa no Bottom */}
      <ChatWrapper 
        className="fixed bottom-0 left-0 transition-all duration-300 right-0 pl-[250px]"
        style={{
          right: isChatOpen ? `${chatWidth}px` : '0px'
        }}
        onChatOpen={() => setIsChatOpen(true)}
        onChatClose={() => setIsChatOpen(false)}
        onChatWidthChange={(width) => setChatWidth(width)}
        isChatOpen={isChatOpen}
      />
    </div>
  )
} 