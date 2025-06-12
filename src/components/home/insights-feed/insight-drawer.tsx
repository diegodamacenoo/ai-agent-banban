"use client"

import { useState, useEffect, useRef } from "react"
import { 
  Drawer, 
  DrawerClose, 
  DrawerContent, 
  DrawerDescription, 
  DrawerFooter, 
  DrawerHeader, 
  DrawerTitle 
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { InsightSummary } from "./insight-summary"
import { InsightMetaGrid } from "./insight-meta-grid"
import { AffectedLocations } from "./affected-locations"
import { AffectedProducts } from "./affected-products"
import { InsightChat } from "./insight-chat"
import { InsightChatInput } from "./insight-chat-input"
import { InsightAnalytics } from "./insight-analytics"
import { InsightDetailsMap, type InsightDetails } from "./insight-details"
import { Insight } from "@/types/insights"
import { X, ExternalLink } from "lucide-react"
import { type ProductData } from "./affected-products-columns"
import { type LocationData } from "./affected-locations-columns"
import { Skeleton } from "@/components/ui/skeleton"
import { ContextualDataMapper } from './contextual-data-mapper'

interface InsightDrawerProps {
  insight: Insight | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ChatMessage {
  id: string
  content: string
  isAI: boolean
  timestamp: Date
}

// Componente de Skeleton para o conteúdo do Drawer
function InsightDrawerSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Skeleton para InsightSummary */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      
      {/* Skeleton para InsightMetaGrid */}
      <div className="space-y-4 p-4 border rounded-lg">
        <Skeleton className="h-6 w-1/3 mb-4" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="mt-4 p-3 border bg-zinc-50 rounded-lg">
           <Skeleton className="h-5 w-1/4 mb-3" />
           <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
           </div>
        </div>
      </div>
      
      {/* Skeleton para Analytics */}
      <div className="space-y-3 p-4 border rounded-lg">
         <Skeleton className="h-5 w-1/3" />
         <Skeleton className="h-4 w-full" />
         <Skeleton className="h-32 w-full mt-2" />
      </div>
      
      <Separator />
      
      {/* Skeleton para Tabelas */}
      <div className="space-y-2">
         <Skeleton className="h-6 w-1/4 mb-2" />
         <Skeleton className="h-8 w-full" />
         <Skeleton className="h-10 w-full" />
         <Skeleton className="h-10 w-full" />
      </div>
    </div>
  )
}

export function InsightDrawer({ insight, open, onOpenChange }: InsightDrawerProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [details, setDetails] = useState<InsightDetails | null>(null)
  const [isDetailsLoading, setIsDetailsLoading] = useState(false)
  const [isChatEngaged, setIsChatEngaged] = useState(false)
  const insightIdRef = useRef<string | null>(null)
  const bottomChatRef = useRef<HTMLDivElement>(null)

  // Gera dados mock dinâmicos para locais e produtos baseado no insight específico
  const generateMockLocationsAndProducts = (insight: Insight) => {
    const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
    
    // Extrai números da descrição para usar como base
    const numbersInDescription = insight.description.match(/\d+/g)?.map(Number) || [1]
    const affectedItemsCount = numbersInDescription[0] || 1
    const affectedStoresCount = numbersInDescription[1] || 2
    
    const allLocations = [
      { name: 'Loja Shopping Center', currentStock: getRandomInt(0, 15), suggestedTransfer: getRandomInt(-10, 15) },
      { name: 'Loja Centro', currentStock: getRandomInt(0, 20), suggestedTransfer: getRandomInt(-8, 12) },
      { name: 'Loja Outlet', currentStock: getRandomInt(0, 10), suggestedTransfer: getRandomInt(-5, 8) },
      { name: 'Loja Norte Shopping', currentStock: getRandomInt(0, 12), suggestedTransfer: getRandomInt(-6, 10) }
    ]
    
    const allProducts = [
      'Tênis Casual Masculino',
      'Sapato Social Feminino', 
      'Sandália de Verão',
      'Bota Couro Premium',
      'Chinelo Conforto',
      'Sapato Casual Masculino',
      'Tênis Esportivo',
      'Sandália Rasteira',
      'Bota Ankle Boot',
      'Sapato Salto Alto'
    ]
    
    // Gera produtos baseado na quantidade real do insight
    const mockProducts = Array.from({ length: Math.min(affectedItemsCount, allProducts.length) }, (_, i) => ({
        name: allProducts[i],
        lastSaleDate: `${10 + i}/12/2024`,
        currentStock: getRandomInt(1, 25),
        daysWithoutSale: getRandomInt(0, 60)
    }));
    
    // Seleciona lojas baseado na quantidade mencionada
    const mockLocations = allLocations.slice(0, Math.min(affectedStoresCount, allLocations.length));
    
    return { mockLocations, mockProducts }
  }

  // Dados mock para exemplificar os detalhes expandidos
  const getInsightDetails = (insight: Insight): InsightDetails => {
    const { mockLocations, mockProducts } = generateMockLocationsAndProducts(insight)
    const detailsFromMap = InsightDetailsMap[insight.id] || {}
    
    const baseDetails: InsightDetails = {
      createdAt: new Date().toLocaleDateString('pt-BR'),
      category: 'Gestão de Estoque',
      affectedItems: parseInt(insight.description.match(/\d+/)?.[0] || '1'),
      recommendedActions: [],
      impact: 'Médio',
      timeline: '24-48 horas',
      aiMessage: 'Olá! Analisei este insight e tenho algumas recomendações para você.',
      locations: mockLocations.map(loc => ({
          name: loc.name,
          currentStock: loc.currentStock,
          suggestedTransfer: loc.suggestedTransfer,
      })),
      products: mockProducts.map(prod => ({
          name: prod.name,
          lastSaleDate: prod.lastSaleDate,
          currentStock: prod.currentStock,
          daysWithoutSale: prod.daysWithoutSale,
      })),
      financialMetrics: {
        potentialLoss: 'R$ 2.500',
        currentMargin: '35%',
        stockValue: 'R$ 15.000',
        turnoverRate: '2.3x/mês'
      },
      analyticsData: {
        salesHistory: [
          { month: 'Jan', sales: Math.floor(Math.random() * 50) + 30 },
          { month: 'Fev', sales: Math.floor(Math.random() * 50) + 30 },
          { month: 'Mar', sales: Math.floor(Math.random() * 50) + 30 },
          { month: 'Abr', sales: Math.floor(Math.random() * 50) + 30 },
          { month: 'Mai', sales: Math.floor(Math.random() * 50) + 30 },
          { month: 'Jun', sales: Math.floor(Math.random() * 50) + 30 }
        ],
        stockMovement: [
          { date: '01', stock: Math.floor(Math.random() * 50) + 50 },
          { date: '08', stock: Math.floor(Math.random() * 50) + 40 },
          { date: '15', stock: Math.floor(Math.random() * 50) + 30 },
          { date: '22', stock: Math.floor(Math.random() * 50) + 20 },
          { date: '30', stock: Math.floor(Math.random() * 50) + 10 }
        ],
        storeComparison: [
          { store: 'Shopping', performance: Math.floor(Math.random() * 30) + 70 },
          { store: 'Centro', performance: Math.floor(Math.random() * 40) + 50 },
          { store: 'Outlet', performance: Math.floor(Math.random() * 50) + 30 }
        ]
      }
    }

    // Merge dados do mapa, mas preserva locations e products gerados dinamicamente se não estão no mapa
    return {
      ...baseDetails,
      ...detailsFromMap,
      // Só usa dados dinâmicos se não há dados específicos no mapa
      locations: detailsFromMap.locations || baseDetails.locations,
      products: detailsFromMap.products || baseDetails.products,
    }
  }

  // Gerencia o carregamento dos detalhes e o chat inicial
  useEffect(() => {
    if (open && insight) {
      // Se for um novo insight, reseta tudo e carrega
      if (insightIdRef.current !== insight.id) {
        insightIdRef.current = insight.id
        setChatMessages([])
        setDetails(null)
        setIsDetailsLoading(true)
        setIsChatEngaged(false)

        // Simula o fetch dos detalhes do insight
        const timer = setTimeout(() => {
          const newDetails = getInsightDetails(insight)
          setDetails(newDetails)
          setIsDetailsLoading(false)

          // Inicia o chat com a mensagem da IA
          const initialMessage: ChatMessage = {
            id: `ai-${Date.now()}`,
            content: newDetails.aiMessage,
            isAI: true,
            timestamp: new Date()
          }
          setChatMessages([initialMessage])
        }, 750) // Simula um delay de rede

        return () => clearTimeout(timer)
      }
    }
  }, [open, insight])

  useEffect(() => {
    if (isChatEngaged) {
      setTimeout(() => {
        bottomChatRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100) // Pequeno delay para garantir que o DOM foi atualizado
    }
  }, [isChatEngaged, chatMessages])

  const handleSendMessage = (message: string) => {
    if (!isChatEngaged) {
      setIsChatEngaged(true)
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      content: message,
      isAI: false,
      timestamp: new Date()
    }

    setChatMessages(prev => [...prev, userMessage])
    setIsChatLoading(true)

    // Simular resposta da IA após um delay
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: `ai-${Date.now()}`,
        content: "Entendi sua pergunta! Deixe-me analisar os dados e te dar uma resposta mais específica. Por enquanto, essa é uma funcionalidade em desenvolvimento, mas em breve poderei te ajudar com análises detalhadas em tempo real.",
        isAI: true,
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, aiResponse])
      setIsChatLoading(false)
    }, 1000)
  }

  // Resetar estados quando o drawer for fechado
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setChatMessages([])
      setDetails(null)
      insightIdRef.current = null
      setIsChatEngaged(false)
    }
    onOpenChange(newOpen)
  }

  if (!insight) return null

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} direction="right">
      <DrawerContent className="max-w-2xl h-full flex flex-col ml-auto mt-0 rounded-none">
        <DrawerHeader className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-start justify-between">
            <DrawerTitle>Análise do Insight</DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>
        
        <div className="flex-1 overflow-y-auto">
          {isDetailsLoading || !details ? (
            <InsightDrawerSkeleton />
          ) : (
            <div className="p-6 space-y-6">
              {/* Resumo do Insight */}
              <InsightSummary insight={insight} category={details.category} />

              {/* Chat no topo (Apenas na visualização inicial) */}
              {!isChatEngaged && (
                <>
                  <InsightChat
                    insightId={insight.id}
                    messages={chatMessages}
                    onSendMessage={handleSendMessage}
                    isLoading={isChatLoading}
                  />
                  <Separator />
                </>
              )}

              {/* General Info */}
              <h3 className="mb-3 text-lg font-semibold text-gray-800 dark:text-gray-200">
                Informações de Suporte
              </h3>
              <InsightMetaGrid
                metadata={ContextualDataMapper.getContextualMetadata(insight.id)}
                financials={ContextualDataMapper.getFinancialMetrics(
                  insight.id
                )}
              />
              
              {/* Analytics Padrão */}
              <InsightAnalytics insightId={insight.id} />
              
              <Separator />

              {/* Lojas Afetadas */}
              {details.locations && (
                <AffectedLocations
                  insightId={insight.id}
                  locations={details.locations as LocationData[]}
                />
              )}

              {/* Produtos Afetados */}
              {details.products && (
                <AffectedProducts
                  insightId={insight.id}
                  products={details.products as ProductData[]}
                />
              )}

              {/* Chat movido para o final quando o usuário interage */}
              {isChatEngaged && (
                <div ref={bottomChatRef}>
                  <Separator className="mb-6" />
                  <InsightChat
                    insightId={insight.id}
                    messages={chatMessages}
                    onSendMessage={handleSendMessage}
                    isLoading={isChatLoading}
                  />
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Chat Footer (Sticky) */}
        <DrawerFooter className="bg-background border-t p-4">
          <InsightChatInput 
            onSendMessage={handleSendMessage} 
            isLoading={isChatLoading} 
          />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
} 