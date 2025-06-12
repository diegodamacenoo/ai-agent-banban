import {
  AlertTriangle,
  Award,
  Rocket,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react'

export interface ContextualFinancialMetrics {
  label1: string
  value1: string
  color1?: string
  description1?: string
  label2: string
  value2: string
  color2?: string
  description2?: string
  label3: string
  value3: string
  color3?: string
  description3?: string
  label4: string
  value4: string
  color4?: string
  description4?: string
}

export interface ContextualMetadata {
  impact: string
  timeline: string
  impactColor?: string
  timelineIcon?: string
}

export interface ContextualChatData {
  initialMessage: string
  suggestedQuestions: string[]
  contextualResponses: {
    [key: string]: string
  }
  quickActions: {
    label: string
    action: string
    type: 'primary' | 'secondary' | 'warning'
  }[]
}

export interface ContextualAnalyticsData {
  title: string
  description: string
  charts: {
    id: string
    title: string
    type: 'line' | 'bar' | 'progress' | 'trend'
    description: string
    data: any
    insights: string[]
    color: string
  }[]
}

export interface RecommendedAction {
  icon: React.ElementType
  title: string
  description: string
  color: string
}

export interface ContextualLocationData {
  name: string
  
  // Para insights de estoque
  stockContext?: {
    currentStock: number
    minStock: number
    suggestedRestock: number
    stockStatus: 'critical' | 'low' | 'adequate' | 'high'
  }
  
  // Para insights de precificação  
  pricingContext?: {
    currentPrice: string
    suggestedPrice: string
    competitorPrice: string
    priceStatus: 'underpriced' | 'overpriced' | 'competitive'
  }
  
  // Para insights de devoluções
  returnsContext?: {
    returnCount: number
    returnRate: string
    avgProcessTime: string
    returnTrend: 'increasing' | 'stable' | 'decreasing'
  }
  
  // Para insights de tendências
  trendsContext?: {
    salesGrowth: string
    weeklyTraffic: number
    conversionRate: string
    trendDirection: 'rising' | 'stable' | 'falling'
  }
  
  // Para otimização
  optimizationContext?: {
    efficiency: string
    transferNeed: number
    priority: 'high' | 'medium' | 'low'
    potentialGain: string
  }
  
  // Para conquistas
  achievementContext?: {
    contribution: string
    growth: string
    ranking: number
    performance: 'excellent' | 'good' | 'average'
  }
}

// Mapeamento de tipos de insight para categorias contextuais
const INSIGHT_CONTEXT_MAP = {
  // Problemas de Estoque
  'insight-1': 'stockIssues',    // Estoque Baixo - Risco de Ruptura
  'insight-2': 'stockIssues',    // Potencial de Ruptura  
  'insight-9': 'stockIssues',    // Produtos Parados

  // Precificação
  'insight-3': 'pricing',        // Inconsistência de Preços
  'insight-8': 'pricing',        // Baixo Markup Detectado

  // Conquistas/Positivos
  'insight-5': 'achievements',   // Marco de Vendas Atingido

  // Tendências
  'insight-6': 'trends',         // Produto em Alta

  // Devoluções
  'insight-7': 'returns',        // Pico de Devolução

  // Otimização/Oportunidades
  'insight-4': 'optimization',   // Oportunidade de Remanejamento
  'insight-10': 'optimization',  // Promoção Direcionada
} as const

export const ContextualDataMapper = {
  getInsightContext: (insightId: string): string => {
    return INSIGHT_CONTEXT_MAP[insightId as keyof typeof INSIGHT_CONTEXT_MAP] || 'default'
  },

  getFinancialMetrics: (insightId: string, baseMetrics?: any): ContextualFinancialMetrics => {
    const context = ContextualDataMapper.getInsightContext(insightId)
    const getRandomValue = () => Math.floor(Math.random() * 10000) + 1000

    switch (context) {
      case 'stockIssues':
        return {
          label1: 'Perda Potencial',
          value1: baseMetrics?.potentialLoss || `R$ ${getRandomValue()}`,
          color1: 'text-red-600',
          description1: 'Estimativa de receita perdida se o estoque não for reabastecido a tempo.',
          label2: 'Custo Reposição',
          value2: baseMetrics?.restockCost || `R$ ${getRandomValue()}`,
          color2: 'text-blue-600',
          description2: 'Custo total para comprar e disponibilizar o novo estoque.',
          label3: 'Estoque Atual',
          value3: baseMetrics?.currentStock || `${Math.floor(Math.random() * 50) + 10} un`,
          color3: 'text-amber-600',
          description3: 'Quantidade de unidades do produto atualmente em estoque.',
          label4: 'Dias de Estoque',
          value4: baseMetrics?.daysOfStock || `${Math.floor(Math.random() * 20) + 5} dias`,
          color4: 'text-gray-600',
          description4: 'Para quantos dias o estoque atual é suficiente, com base na média de vendas.'
        }

      case 'pricing':
        return {
          label1: 'Impacto na Receita',
          value1: baseMetrics?.revenueImpact || `R$ ${getRandomValue()}`,
          color1: 'text-orange-600',
          description1: 'Variação estimada na receita total se os ajustes de preço forem aplicados.',
          label2: 'Variação Margem',
          value2: baseMetrics?.marginVariation || `${Math.floor(Math.random() * 15) + 5}%`,
          color2: 'text-red-600',
          description2: 'Aumento ou diminuição percentual na margem de lucro do produto.',
          label3: 'Diferença Competitiva',
          value3: baseMetrics?.competitiveDiff || `${Math.floor(Math.random() * 25) + 10}%`,
          color3: 'text-blue-600',
          description3: 'Diferença percentual do seu preço em relação à média do mercado.',
          label4: 'Preço Ótimo Sugerido',
          value4: baseMetrics?.priceOptimal || `R$ ${Math.floor(Math.random() * 50) + 50}`,
          color4: 'text-green-600',
          description4: 'Preço de venda que otimiza a relação entre volume de vendas e margem de lucro.'
        }

      case 'achievements':
        return {
          label1: 'Receita Adicional',
          value1: baseMetrics?.additionalRevenue || `R$ ${getRandomValue()}`,
          color1: 'text-green-600',
          description1: 'Receita gerada acima da média histórica ou da meta estabelecida.',
          label2: 'Taxa de Crescimento',
          value2: baseMetrics?.growthRate || `+${Math.floor(Math.random() * 30) + 15}%`,
          color2: 'text-green-600',
          description2: 'Aumento percentual nas vendas em comparação com o período anterior.',
          label3: 'Participação Mercado',
          value3: baseMetrics?.marketShare || `${Math.floor(Math.random() * 10) + 5}%`,
          color3: 'text-blue-600',
          description3: 'Sua fatia de vendas no mercado total para esta categoria de produto.',
          label4: 'Projeção Próx. Mês',
          value4: baseMetrics?.projectedGain || `R$ ${getRandomValue()}`,
          color4: 'text-green-600',
          description4: 'Estimativa de ganhos para o próximo período com base na tendência atual.'
        }

      case 'returns':
        return {
          label1: 'Perda por Devoluções',
          value1: baseMetrics?.returnLoss || `R$ ${getRandomValue()}`,
          color1: 'text-red-600',
          description1: 'Valor total dos produtos devolvidos que não puderam ser revendidos.',
          label2: 'Custo Reprocessamento',
          value2: baseMetrics?.replacementCost || `R$ ${Math.floor(getRandomValue() * 0.3)}`,
          color2: 'text-orange-600',
          description2: 'Custo logístico e de mão de obra para processar as devoluções.',
          label3: 'Impacto Cliente (NPS)',
          value3: baseMetrics?.customerImpact || `-${Math.floor(Math.random() * 20) + 5} pts`,
          color3: 'text-red-600',
          description3: 'Impacto estimado na satisfação do cliente, medido em pontos de Net Promoter Score.',
          label4: 'Tempo Médio Processo',
          value4: baseMetrics?.processTime || `${Math.floor(Math.random() * 5) + 2} dias`,
          color4: 'text-gray-600',
          description4: 'Tempo médio que leva para uma devolução ser finalizada no sistema.'
        }

      case 'trends':
        return {
          label1: 'Valor da Oportunidade',
          value1: baseMetrics?.opportunityValue || `R$ ${getRandomValue()}`,
          color1: 'text-green-600',
          description1: 'Receita adicional estimada se a empresa capitalizar sobre esta tendência.',
          label2: 'Potencial Crescimento',
          value2: baseMetrics?.growthPotential || `+${Math.floor(Math.random() * 40) + 20}%`,
          color2: 'text-green-600',
          description2: 'Crescimento de vendas projetado se a oportunidade for aproveitada.',
          label3: 'Demanda do Mercado',
          value3: baseMetrics?.marketDemand || `${Math.floor(Math.random() * 200) + 100}/mês`,
          color3: 'text-blue-600',
          description3: 'Volume de busca ou de vendas estimado para este produto no mercado.',
          label4: 'Custo Expansão',
          value4: baseMetrics?.expansionCost || `R$ ${Math.floor(getRandomValue() * 0.5)}`,
          color4: 'text-orange-600',
          description4: 'Investimento necessário em marketing e estoque para capturar a tendência.'
        }

      case 'optimization':
        return {
          label1: 'Ganho de Eficiência',
          value1: baseMetrics?.efficiencyGain || `R$ ${getRandomValue()}`,
          color1: 'text-green-600',
          description1: 'Valor economizado ou ganho ao otimizar a alocação de recursos.',
          label2: 'Custo Transferência',
          value2: baseMetrics?.transferCost || `R$ ${Math.floor(getRandomValue() * 0.2)}`,
          color2: 'text-blue-600',
          description2: 'Custo logístico para mover produtos entre lojas ou centros de distribuição.',
          label3: 'Tempo até ROI',
          value3: baseMetrics?.timeToROI || `${Math.floor(Math.random() * 6) + 2} meses`,
          color3: 'text-gray-600',
          description3: 'Tempo estimado para que o ganho de eficiência pague o custo da otimização.',
          label4: 'Economia de Recursos',
          value4: baseMetrics?.resourceSaving || `${Math.floor(Math.random() * 25) + 10}%`,
          color4: 'text-green-600',
          description4: 'Redução percentual no uso de recursos (tempo, pessoal, etc.).'
        }

      default:
        return {
          label1: 'Perda Potencial',
          value1: baseMetrics?.potentialLoss || `R$ ${getRandomValue()}`,
          color1: 'text-red-600',
          description1: 'Estimativa de receita perdida devido a este insight.',
          label2: 'Margem Atual',
          value2: baseMetrics?.currentMargin || `${Math.floor(Math.random() * 20) + 20}%`,
          color2: 'text-gray-600',
          description2: 'Margem de lucro atual do produto ou categoria afetada.',
          label3: 'Valor em Estoque',
          value3: baseMetrics?.stockValue || `R$ ${getRandomValue() * 2}`,
          color3: 'text-blue-600',
          description3: 'Valor de custo total dos produtos em estoque relacionados a este insight.',
          label4: 'Taxa de Giro',
          value4: baseMetrics?.turnoverRate || `${(Math.random() * 3 + 1).toFixed(1)}x/mês`,
          color4: 'text-gray-600',
          description4: 'Quantas vezes o estoque deste produto é vendido e reposto em um período.'
        }
    }
  },

  getContextualMetadata: (insightId: string, baseMetadata?: any): ContextualMetadata => {
    const context = ContextualDataMapper.getInsightContext(insightId)

    switch (context) {
      case 'stockIssues':
        return {
          impact: baseMetadata?.impact || 'Crítico',
          timeline: baseMetadata?.timeline || 'Imediato - 24h',
          impactColor: 'text-red-600',
          timelineIcon: '⚡'
        }

      case 'pricing':
        return {
          impact: baseMetadata?.impact || 'Médio-Alto',
          timeline: baseMetadata?.timeline || '48-72 horas',
          impactColor: 'text-orange-600',
          timelineIcon: '💰'
        }

      case 'achievements':
        return {
          impact: baseMetadata?.impact || 'Positivo',
          timeline: baseMetadata?.timeline || 'Conquista Atual',
          impactColor: 'text-green-600',
          timelineIcon: '🎉'
        }

      case 'returns':
        return {
          impact: baseMetadata?.impact || 'Alto',
          timeline: baseMetadata?.timeline || 'Urgente - 12h',
          impactColor: 'text-red-600',
          timelineIcon: '🔄'
        }

      case 'trends':
        return {
          impact: baseMetadata?.impact || 'Oportunidade',
          timeline: baseMetadata?.timeline || '24-48 horas',
          impactColor: 'text-green-600',
          timelineIcon: '📈'
        }

      case 'optimization':
        return {
          impact: baseMetadata?.impact || 'Médio',
          timeline: baseMetadata?.timeline || '3-5 dias',
          impactColor: 'text-blue-600',
          timelineIcon: '⚙️'
        }

      default:
        return {
          impact: baseMetadata?.impact || 'Médio',
          timeline: baseMetadata?.timeline || '24-48 horas',
          impactColor: 'text-gray-600',
          timelineIcon: '📊'
        }
    }
  },

  getContextualLocationData: (insightId: string, baseLocations: any[]): ContextualLocationData[] => {
    const context = ContextualDataMapper.getInsightContext(insightId)
    const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
    const getRandomPrice = () => (Math.random() * 100 + 50).toFixed(2)
    
    if (!baseLocations || baseLocations.length === 0) {
      return []
    }

    return baseLocations.map((location, index) => {
      const baseLocation: ContextualLocationData = {
        name: location.name || `Loja ${index + 1}`
      }

      switch (context) {
        case 'stockIssues':
          const currentStock = location.currentStock || getRandomInt(0, 50)
          const minStock = getRandomInt(5, 15)
          const suggestedRestock = Math.max(0, minStock + getRandomInt(10, 20) - currentStock)
          let stockStatus: 'critical' | 'low' | 'adequate' | 'high' = 'adequate'
          
          if (currentStock === 0) stockStatus = 'critical'
          else if (currentStock < minStock) stockStatus = 'low'
          else if (currentStock > minStock * 3) stockStatus = 'high'
          
          baseLocation.stockContext = {
            currentStock,
            minStock,
            suggestedRestock,
            stockStatus
          }
          break

        case 'pricing':
          const currentPrice = location.currentPrice || `R$ ${getRandomPrice()}`
          const basePrice = parseFloat(currentPrice.replace('R$ ', ''))
          const variation = (Math.random() * 0.3 - 0.15) // ±15%
          const suggestedPrice = `R$ ${(basePrice * (1 + variation)).toFixed(2)}`
          const competitorPrice = `R$ ${(basePrice * (1 + Math.random() * 0.2 - 0.1)).toFixed(2)}`
          
          let priceStatus: 'underpriced' | 'overpriced' | 'competitive' = 'competitive'
          if (variation < -0.05) priceStatus = 'underpriced'
          else if (variation > 0.05) priceStatus = 'overpriced'
          
          baseLocation.pricingContext = {
            currentPrice,
            suggestedPrice,
            competitorPrice,
            priceStatus
          }
          break

        case 'returns':
          const returnCount = getRandomInt(2, 15)
          const returnRate = `${getRandomInt(8, 25)}%`
          const avgProcessTime = `${getRandomInt(2, 7)} dias`
          const returnTrend: 'increasing' | 'stable' | 'decreasing' = 
            Math.random() < 0.4 ? 'increasing' : Math.random() < 0.7 ? 'stable' : 'decreasing'
          
          baseLocation.returnsContext = {
            returnCount,
            returnRate,
            avgProcessTime,
            returnTrend
          }
          break

        case 'trends':
          const salesGrowth = `+${getRandomInt(15, 45)}%`
          const weeklyTraffic = getRandomInt(150, 400)
          const conversionRate = `${getRandomInt(15, 35)}%`
          const trendDirection: 'rising' | 'stable' | 'falling' = 
            Math.random() < 0.7 ? 'rising' : Math.random() < 0.9 ? 'stable' : 'falling'
          
          baseLocation.trendsContext = {
            salesGrowth,
            weeklyTraffic,
            conversionRate,
            trendDirection
          }
          break

        case 'optimization':
          const efficiency = `${getRandomInt(60, 95)}%`
          const transferNeed = location.suggestedTransfer || getRandomInt(-10, 15)
          const priority: 'high' | 'medium' | 'low' = 
            Math.abs(transferNeed) > 10 ? 'high' : Math.abs(transferNeed) > 5 ? 'medium' : 'low'
          const potentialGain = `R$ ${getRandomInt(500, 2500)}`
          
          baseLocation.optimizationContext = {
            efficiency,
            transferNeed,
            priority,
            potentialGain
          }
          break

        case 'achievements':
          const contribution = `${getRandomInt(15, 35)}%`
          const growth = `+${getRandomInt(20, 50)}%`
          const ranking = index + 1
          const performance: 'excellent' | 'good' | 'average' = 
            ranking === 1 ? 'excellent' : ranking <= 2 ? 'good' : 'average'
          
          baseLocation.achievementContext = {
            contribution,
            growth,
            ranking,
            performance
          }
          break

        default:
          // Manter compatibilidade com dados antigos
          if (location.currentStock !== undefined) {
            baseLocation.stockContext = {
              currentStock: location.currentStock,
              minStock: getRandomInt(5, 15),
              suggestedRestock: location.suggestedTransfer || 0,
              stockStatus: location.currentStock < 10 ? 'low' : 'adequate'
            }
          }
          break
      }

      return baseLocation
    })
  },

  getContextualChatData: (insightId: string): ContextualChatData => {
    const context = ContextualDataMapper.getInsightContext(insightId)
    
    const chatContexts: Record<string, ContextualChatData> = {
      stockIssues: {
        initialMessage: "Olá! Identifiquei problemas críticos de estoque que podem resultar em ruptura. Como posso ajudar você a resolver essa situação?",
        suggestedQuestions: [
          "Qual a urgência para reabastecer esses produtos?",
          "Como calcular a quantidade ideal de reposição?",
          "Quais fornecedores têm menor lead time?",
          "Como priorizar os produtos mais críticos?",
          "Existe risco de perda de vendas?"
        ],
        contextualResponses: {
          "urgência": "Com base nos dados atuais, produtos com estoque zero precisam de reposição imediata (24-48h). Produtos com estoque baixo podem aguardar 1-2 semanas, mas devem ser monitorados diariamente.",
          "quantidade": "Para calcular a reposição ideal, considere: demanda média semanal × lead time do fornecedor × fator de segurança (1.2-1.5). Sempre verifique sazonalidade e promoções planejadas.",
          "fornecedores": "Priorizei fornecedores por lead time: Fornecedor A (2-3 dias), Fornecedor B (5-7 dias). Verifique também histórico de qualidade e confiabilidade de entrega.",
          "priorização": "Produtos prioritários são aqueles com: 1) Estoque zero, 2) Alto giro, 3) Alta margem, 4) Sem substitutos próximos. Foque primeiro nos produtos classe A da curva ABC."
        },
        quickActions: [
          { label: "Gerar Pedido de Compra", action: "generate_purchase_order", type: "primary" },
          { label: "Contatar Fornecedores", action: "contact_suppliers", type: "secondary" },
          { label: "Definir Alertas", action: "set_stock_alerts", type: "secondary" }
        ]
      },

      pricing: {
        initialMessage: "Detectei inconsistências de preços que podem estar impactando sua competitividade e margem. Vamos otimizar sua estratégia de precificação?",
        suggestedQuestions: [
          "Como os preços atuais afetam as vendas?",
          "Qual deve ser a estratégia de precificação?",
          "Como monitorar preços da concorrência?",
          "Quando aplicar os novos preços?",
          "Como comunicar mudanças aos clientes?"
        ],
        contextualResponses: {
          "vendas": "Preços desalinhados podem reduzir vendas em 15-30%. Produtos subprecificados perdem margem, enquanto sobreprecificados perdem volume. O equilíbrio é essencial para maximizar receita.",
          "estratégia": "Recomendo precificação baseada em valor: analise elasticidade da demanda, posicionamento de marca e objetivos (volume vs margem). Considere preços psicológicos (R$ 99,90 vs R$ 100,00).",
          "concorrência": "Configure monitoramento automático de preços com ferramentas especializadas. Atualize semanalmente e ajuste quando necessário, mantendo sua proposta de valor clara.",
          "aplicação": "Aplique reajustes gradualmente: 5-10% por vez. Evite mudanças bruscas que podem confundir clientes. Monitore impacto nas vendas por 2-3 semanas antes de novos ajustes."
        },
        quickActions: [
          { label: "Aplicar Novos Preços", action: "apply_new_prices", type: "primary" },
          { label: "Analisar Concorrência", action: "analyze_competition", type: "secondary" },
          { label: "Simular Impacto", action: "simulate_price_impact", type: "secondary" }
        ]
      },

      returns: {
        initialMessage: "Identifiquei um padrão preocupante de devoluções. Vamos investigar as causas e implementar ações para reduzir esse índice?",
        suggestedQuestions: [
          "Quais são as principais causas das devoluções?",
          "Como reduzir a taxa de devolução?",
          "O processo está otimizado?",
          "Como melhorar a experiência do cliente?",
          "Existe padrão por produto ou loja?"
        ],
        contextualResponses: {
          "causas": "Principais causas identificadas: defeitos de qualidade (35%), tamanho inadequado (25%), divergência da expectativa (20%), arrependimento (15%), defeito de transporte (5%).",
          "redução": "Para reduzir devoluções: melhore descrições de produtos, implemente guias de tamanho, invista em qualidade, ofereça troca antes da compra, e treine equipe de vendas.",
          "processo": "Processo atual tem média de 4-6 dias. Recomendo: recebimento em 24h, triagem em 48h, reposição em estoque em 72h. Automatize quando possível.",
          "experiência": "Transforme devoluções em oportunidades: processo ágil, sem burocracia, ofereça crédito/troca, colete feedback para melhorias, e mantenha comunicação proativa."
        },
        quickActions: [
          { label: "Melhorar Processo", action: "improve_return_process", type: "primary" },
          { label: "Analisar Causas", action: "analyze_return_causes", type: "secondary" },
          { label: "Treinar Equipe", action: "train_staff", type: "secondary" }
        ]
      },

      trends: {
        initialMessage: "Excelente! Detectei uma tendência muito positiva que merece atenção. Vamos aproveitar esse momentum para maximizar resultados?",
        suggestedQuestions: [
          "Como potencializar essa tendência?",
          "Devo aumentar o investimento?",
          "Como expandir para outras lojas?",
          "Qual a sustentabilidade da tendência?",
          "Como capturar mais demanda?"
        ],
        contextualResponses: {
          "potencializar": "Para amplificar a tendência: aumente estoque dos produtos em alta, otimize merchandising, lance campanhas direcionadas, e treine equipe para vendas consultivas.",
          "investimento": "Sim, momento ideal para investir: aumente mix de produtos relacionados, expanda marketing digital, melhore experiência de compra, e considere novos pontos de venda.",
          "expansão": "Replique estratégias vencedoras: copie layout, treinamento, mix de produtos e campanhas. Adapte ao perfil local, mas mantenha elementos de sucesso.",
          "sustentabilidade": "Tendência tem potencial de 3-6 meses. Monitore indicadores-chave, diversifique ofertas, construa relacionamento com clientes, e prepare transição suave."
        },
        quickActions: [
          { label: "Ampliar Estoque", action: "increase_inventory", type: "primary" },
          { label: "Lançar Campanha", action: "launch_campaign", type: "primary" },
          { label: "Expandir Estratégia", action: "expand_strategy", type: "secondary" }
        ]
      },

      optimization: {
        initialMessage: "Identifiquei oportunidades de otimização que podem gerar ganhos significativos. Vamos implementar essas melhorias estratégicas?",
        suggestedQuestions: [
          "Qual o potencial de ganho real?",
          "Como priorizar as ações?",
          "Quais recursos são necessários?",
          "Quanto tempo para ver resultados?",
          "Como medir o sucesso?"
        ],
        contextualResponses: {
          "ganho": "Potencial estimado: 8-15% de aumento na eficiência operacional, redução de 20-30% em custos desnecessários, e melhoria de 10-25% na experiência do cliente.",
          "priorização": "Priorize por: 1) Baixo esforço + Alto impacto, 2) Rápido retorno, 3) Facilidade de implementação. Comece com transferências de estoque e otimização de layout.",
          "recursos": "Recursos necessários: equipe de 2-3 pessoas, budget de R$ 5-15k, ferramentas de gestão, e 4-8 semanas de implementação. ROI esperado em 2-3 meses.",
          "resultados": "Primeiros resultados em 2-4 semanas (transferências), resultados consolidados em 2-3 meses. Monitore KPIs semanalmente e ajuste conforme necessário."
        },
        quickActions: [
          { label: "Executar Transferências", action: "execute_transfers", type: "primary" },
          { label: "Otimizar Layout", action: "optimize_layout", type: "secondary" },
          { label: "Agendar Revisão", action: "schedule_review", type: "secondary" }
        ]
      },

      achievements: {
        initialMessage: "Parabéns pelo excelente resultado! Vamos analisar os fatores de sucesso e replicar essas conquistas em outras áreas?",
        suggestedQuestions: [
          "O que levou a esse sucesso?",
          "Como replicar em outras lojas?",
          "Devo expandir o investimento?",
          "Como sustentar os resultados?",
          "Quais próximos passos?"
        ],
        contextualResponses: {
          "sucesso": "Fatores-chave identificados: equipe engajada (40%), estratégia de produto assertiva (25%), execução comercial (20%), timing de mercado (10%), sorte/fatores externos (5%).",
          "replicação": "Para replicar: documente processos vencedores, treine outras equipes, padronize melhores práticas, adapte ao contexto local, e monitore indicadores de progresso.",
          "investimento": "Momento ideal para dobrar a aposta: expanda produtos de sucesso, aumente equipe comercial, invista em marketing, e considere novas oportunidades de mercado.",
          "sustentação": "Para manter resultados: celebre conquistas, mantenha equipe motivada, invista em inovação contínua, monitore concorrência, e prepare-se para próximos desafios."
        },
        quickActions: [
          { label: "Documentar Práticas", action: "document_practices", type: "primary" },
          { label: "Replicar Estratégia", action: "replicate_strategy", type: "primary" },
          { label: "Planejar Expansão", action: "plan_expansion", type: "secondary" }
        ]
      }
    }

    return chatContexts[context] || {
      initialMessage: "Olá! Como posso ajudar você com este insight?",
      suggestedQuestions: [
        "Qual a próxima ação recomendada?",
        "Como isso impacta meu negócio?",
        "Preciso de mais informações",
        "Como implementar melhorias?"
      ],
      contextualResponses: {
        "próxima": "Analise os dados apresentados e priorize ações de maior impacto. Posso ajudar a elaborar um plano detalhado.",
        "impacto": "Este insight pode impactar significativamente seus resultados. Vamos detalhar as implicações específicas para seu contexto.",
        "informações": "Posso fornecer análises mais detalhadas, histórico de dados, comparações e projeções. O que especificamente gostaria de saber?",
        "implementação": "Recomendo uma abordagem estruturada: planejamento, execução em fases, monitoramento e ajustes. Posso guiá-lo em cada etapa."
      },
      quickActions: [
        { label: "Analisar Dados", action: "analyze_data", type: "secondary" },
        { label: "Criar Plano", action: "create_plan", type: "primary" }
      ]
    }
  },

  getRecommendedAction: (insightId: string): RecommendedAction => {
    const context = ContextualDataMapper.getInsightContext(insightId)
    const iconMap = {
      alert: AlertTriangle,
      rocket: Rocket,
      trendingUp: TrendingUp,
      trendingDown: TrendingDown,
      zap: Zap,
      award: Award,
    }

    switch (context) {
      case 'stockIssues':
        return {
          icon: iconMap.zap,
          title: "Ação Imediata: Criar Pedido de Compra",
          description: "O passo mais crítico é criar um pedido de compra para os itens com risco de ruptura. Isso evitará perdas de vendas iminentes e garantirá a disponibilidade para seus clientes.",
          color: 'border-red-500/80'
        }
      case 'pricing':
        return {
          icon: iconMap.trendingDown,
          title: "Ação Imediata: Otimizar Preços",
          description: "Ajuste os preços dos produtos identificados para otimizar a margem de lucro e fortalecer sua competitividade. Recomendo uma análise comparativa antes do ajuste final.",
          color: 'border-orange-500/80'
        }
      case 'achievements':
        return {
          icon: iconMap.award,
          title: "Ação Estratégica: Replicar o Sucesso",
          description: "O primeiro passo é documentar os fatores que levaram a este resultado. Com isso, podemos criar um plano de ação para replicar essa conquista em outras lojas ou linhas de produto.",
          color: 'border-green-500/80'
        }
      case 'returns':
        return {
          icon: iconMap.alert,
          title: "Ação Imediata: Investigar Causa Raiz",
          description: "Priorize a análise dos motivos de devolução. Entender a causa raiz (seja qualidade, descrição ou tamanho) é fundamental para implementar uma solução eficaz e reduzir perdas.",
          color: 'border-red-500/80'
        }
      case 'trends':
        return {
          icon: iconMap.rocket,
          title: "Ação Estratégica: Capitalizar a Tendência",
          description: "Para maximizar o potencial desta tendência, a ação recomendada é aumentar o investimento em marketing e garantir estoque suficiente. Isso pode impulsionar o crescimento de forma significativa.",
          color: 'border-blue-500/80'
        }
      case 'optimization':
        return {
          icon: iconMap.zap,
          title: "Ação Imediata: Executar Otimização",
          description: "Implemente as transferências de estoque ou ajustes operacionais sugeridos. Esta ação tem alto potencial para gerar ganhos de eficiência e economia de recursos no curto prazo.",
          color: 'border-purple-500/80'
        }
      default:
        return {
          icon: iconMap.trendingUp,
          title: "Primeiro Passo: Análise Detalhada",
          description: "Mergulhe nos gráficos e dados disponíveis para obter uma compreensão completa do cenário. A partir daí, podemos traçar o melhor plano de ação para este insight.",
          color: 'border-gray-500/80'
        }
    }
  },

  getContextualAnalyticsData: (insightId: string): ContextualAnalyticsData => {
    const context = ContextualDataMapper.getInsightContext(insightId)
    const getRandomData = (min: number, max: number, count: number) => 
      Array.from({ length: count }, () => Math.floor(Math.random() * (max - min + 1)) + min)
    
    const analyticsContexts: Record<string, ContextualAnalyticsData> = {
      stockIssues: {
        title: "Análise de Estoque e Ruptura",
        description: "Visualização detalhada da evolução do estoque e identificação de padrões críticos",
        charts: [
          {
            id: "stock-timeline",
            title: "Evolução do Estoque (30 dias)",
            type: "line",
            description: "Mostra a diminuição progressiva do estoque ao longo do tempo",
            data: ['01', '05', '10', '15', '20', '25', '30'].map((day, index) => ({
                date: day,
                estoque: Math.max(0, 120 - (index * 18) - Math.random() * 10) // Tendência decrescente
            })),
            insights: [
              "Queda de 85% no estoque nos últimos 30 dias",
              "Velocidade de saída: 4-6 unidades/dia",
              "Ponto crítico atingido em 3 dias"
            ],
            color: "rgb(239 68 68)" // red-500
          },
          {
            id: "rupture-forecast",
            title: "Previsão de Ruptura",
            type: "bar",
            description: "Probabilidade de ruptura por categoria de produto",
            data: [
                { name: "Calçados Infantis", risco: 95, days: 2 },
                { name: "Tênis Esportivos", risco: 78, days: 5 },
                { name: "Sapatos Sociais", risco: 45, days: 12 },
                { name: "Sandálias", risco: 23, days: 20 }
            ],
            insights: [
              "95% de chance de ruptura em calçados infantis",
              "Maior impacto nas vendas de fim de semana",
              "Necessário reposição urgente"
            ],
            color: "rgb(249 115 22)" // orange-500
          },
          {
            id: "sales-vs-stock",
            title: "Vendas vs. Disponibilidade",
            type: "trend",
            description: "Correlação entre vendas perdidas e níveis de estoque",
            data: [
                { week: "Sem 1", sales: 120, lost: 5, stock: 100 },
                { week: "Sem 2", sales: 98, lost: 15, stock: 75 },
                { week: "Sem 3", sales: 76, lost: 35, stock: 45 },
                { week: "Sem 4", sales: 45, lost: 60, stock: 15 }
            ],
            insights: [
              "Perda de 60 vendas na última semana",
              "Queda de 62% na performance de vendas",
              "R$ 8.400 em receita perdida"
            ],
            color: "rgb(168 85 247)" // purple-500
          }
        ]
      },

      pricing: {
        title: "Análise de Precificação e Competitividade",
        description: "Comparativo de preços e impacto na performance comercial",
        charts: [
          {
            id: "price-comparison",
            title: "Comparativo de Preços",
            type: "bar",
            description: "Posicionamento dos preços vs. concorrência",
            data: [
                { name: "Air Max 270", nosso_preço: 459, concorrente: 429, variacao: 4.6 },
                { name: "Stan Smith", nosso_preço: 349, concorrente: 369, variacao: -2.8 },
                { name: "Chuck Taylor", nosso_preço: 259, concorrente: 279, variacao: -3.7 },
                { name: "Vans Old Skool", nosso_preço: 329, concorrente: 309, variacao: 3.1 }
            ],
            insights: [
              "Preços 4,6% acima da média em produtos chave",
              "Margem de competitividade: 5-8%",
              "Ajuste recomendado: -R$ 20 a R$ 30"
            ],
            color: "rgb(34 197 94)" // green-500
          },
          {
            id: "price-elasticity",
            title: "Elasticidade de Preço",
            type: "line",
            description: "Resposta das vendas às variações de preço",
            data: [
                { preco: 259, vendas: 45, margem: 32 },
                { preco: 279, vendas: 38, margem: 38 },
                { preco: 299, vendas: 31, margem: 42 },
                { preco: 319, vendas: 22, margem: 47 },
                { preco: 339, vendas: 15, margem: 51 }
            ],
            insights: [
              "Elasticidade de -1.2 (alta sensibilidade)",
              "Ponto ótimo: R$ 289 (35 vendas/semana)",
              "Receita máxima: R$ 10.115/semana"
            ],
            color: "rgb(59 130 246)" // blue-500
          },
          {
            id: "margin-optimization",
            title: "Otimização de Margem",
            type: "progress",
            description: "Análise do potencial de melhoria por categoria",
            data: [
                { name: "Tênis Premium", atual: 32, otima: 38, potencial: 18.7 },
                { name: "Calçados Casuais", atual: 28, otima: 35, potencial: 25.0 },
                { name: "Sapatos Infantis", atual: 25, otima: 31, potencial: 24.0 },
                { name: "Acessórios", atual: 45, otima: 48, potencial: 6.7 }
            ],
            insights: [
              "Potencial de +25% na margem de casuais",
              "Oportunidade total: R$ 12.500/mês",
              "Ajustes graduais recomendados"
            ],
            color: "rgb(16 185 129)" // emerald-500
          }
        ]
      },

      returns: {
        title: "Análise de Devoluções e Qualidade",
        description: "Padrões de devolução e oportunidades de melhoria",
        charts: [
          {
            id: "return-causes",
            title: "Principais Causas de Devolução",
            type: "bar",
            description: "Distribuição das causas raiz das devoluções",
            data: [
                { reason: "Tamanho inadequado", count: 45, percentage: 35.7, cost: 2250 },
                { reason: "Defeito de qualidade", count: 38, percentage: 30.2, cost: 1900 },
                { reason: "Divergência da expectativa", count: 25, percentage: 19.8, cost: 1250 },
                { reason: "Arrependimento", count: 12, percentage: 9.5, cost: 600 },
                { reason: "Defeito de transporte", count: 6, percentage: 4.8, cost: 300 }
            ],
            insights: [
              "35% das devoluções por problemas de tamanho",
              "Custo total de devoluções: R$ 6.300",
              "Foco em guias de tamanho e qualidade"
            ],
            color: "rgb(239 68 68)" // red-500
          },
          {
            id: "return-timeline",
            title: "Evolução das Devoluções",
            type: "line",
            description: "Tendência de devoluções ao longo do tempo",
            data: [
                { month: "Jan", returns: 28, rate: 8.2 },
                { month: "Fev", returns: 32, rate: 9.1 },
                { month: "Mar", returns: 41, rate: 11.3 },
                { month: "Abr", returns: 38, rate: 10.8 },
                { month: "Mai", returns: 35, rate: 10.1 },
                { month: "Jun", returns: 42, rate: 12.1 }
            ],
            insights: [
              "Taxa de devolução cresceu 47% em 6 meses",
              "Pico em junho: 12,1% das vendas",
              "Meta recomendada: manter abaixo de 8%"
            ],
            color: "rgb(249 115 22)" // orange-500
          },
          {
            id: "quality-score",
            title: "Score de Qualidade por Produto",
            type: "progress",
            description: "Avaliação de qualidade baseada em devoluções e feedback",
            data: [
                { name: "Nike Air Force", score: 92, returns: 3, feedback: 4.8 },
                { name: "Adidas Ultraboost", score: 88, returns: 5, feedback: 4.6 },
                { name: "Converse All Star", score: 75, returns: 12, feedback: 4.1 },
                { name: "Vans Authentic", score: 71, returns: 15, feedback: 3.9 }
            ],
            insights: [
              "Nike Air Force: melhor performance (92 pts)",
              "Converse e Vans precisam de atenção",
              "Correlação forte entre score e satisfação"
            ],
            color: "rgb(16 185 129)" // emerald-500
          }
        ]
      },

      trends: {
        title: "Análise de Tendências e Crescimento",
        description: "Métricas de crescimento e oportunidades de expansão",
        charts: [
          {
            id: "growth-trajectory",
            title: "Trajetória de Crescimento",
            type: "line",
            description: "Evolução das vendas e indicadores de tendência",
            data: [
                { period: "Jan", sales: 120, growth: 0, momentum: 45 },
                { period: "Fev", sales: 135, growth: 12.5, momentum: 58 },
                { period: "Mar", sales: 156, growth: 15.6, momentum: 72 },
                { period: "Abr", sales: 178, growth: 14.1, momentum: 85 },
                { period: "Mai", sales: 205, growth: 15.2, momentum: 92 },
                { period: "Jun", sales: 238, growth: 16.1, momentum: 98 }
            ],
            insights: [
              "Crescimento consistente de 15,2% a/m",
              "Aceleração do momentum: +98%",
              "Projeção Q3: 320 vendas/mês"
            ],
            color: "rgb(34 197 94)" // green-500
          },
          {
            id: "market-penetration",
            title: "Penetração de Mercado",
            type: "bar",
            description: "Participação por segmento e potencial de expansão",
            data: [
                { segment: "Jovens 18-25", current: 35, potential: 60, opportunity: 71.4 },
                { segment: "Adultos 26-40", current: 28, potential: 45, opportunity: 60.7 },
                { segment: "Teens 13-17", current: 15, potential: 40, opportunity: 166.7 },
                { segment: "40+ anos", current: 12, potential: 25, opportunity: 108.3 }
            ],
            insights: [
              "Maior oportunidade: Teens (166% potencial)",
              "Segmento jovem já bem explorado",
              "Potencial total: +78 vendas/mês"
            ],
            color: "rgb(168 85 247)" // purple-500
          },
          {
            id: "viral-coefficient",
            title: "Coeficiente Viral e Engajamento",
            type: "trend",
            description: "Indicadores de viralização e recomendação",
            data: [
                { metric: "NPS Score", value: 78, trend: "+15%" },
                { metric: "Share Rate", value: 23, trend: "+45%" },
                { metric: "Recompra", value: 68, trend: "+28%" },
                { metric: "Indicação", value: 34, trend: "+67%" }
            ],
            insights: [
              "NPS excelente: 78 pontos (+15%)",
              "Taxa de indicação disparou: +67%",
              "Momentum orgânico muito forte"
            ],
            color: "rgb(59 130 246)" // blue-500
          }
        ]
      },

      optimization: {
        title: "Análise de Otimização Operacional",
        description: "Oportunidades de melhoria e eficiência operacional",
        charts: [
          {
            id: "efficiency-gaps",
            title: "Gaps de Eficiência",
            type: "bar",
            description: "Identificação de pontos de melhoria operacional",
            data: [
                { process: "Gestão de Estoque", current: 72, benchmark: 90, gap: 25.0 },
                { process: "Atendimento", current: 85, benchmark: 92, gap: 8.2 },
                { process: "Logística", current: 68, benchmark: 88, gap: 29.4 },
                { process: "Marketing", current: 78, benchmark: 85, gap: 9.0 }
            ],
            insights: [
              "Maior gap: Logística (29,4%)",
              "Oportunidade prioritária: Estoque",
              "Potencial de ROI: 340% a/a"
            ],
            color: "rgb(249 115 22)" // orange-500
          },
          {
            id: "roi-projections",
            title: "Projeções de ROI",
            type: "line",
            description: "Retorno esperado dos investimentos em otimização",
            data: [
                { month: 1, conservative: 2500, realistic: 4200, optimistic: 6800 },
                { month: 3, conservative: 8100, realistic: 12600, optimistic: 19200 },
                { month: 6, conservative: 18500, realistic: 28700, optimistic: 41300 },
                { month: 12, conservative: 42000, realistic: 64500, optimistic: 89200 }
            ],
            insights: [
              "ROI realístico: R$ 64.500 em 12 meses",
              "Payback esperado: 4-6 meses",
              "Cenário otimista: +89k de retorno"
            ],
            color: "rgb(34 197 94)" // green-500
          },
          {
            id: "automation-impact",
            title: "Impacto da Automação",
            type: "progress",
            description: "Benefícios esperados com automação de processos",
            data: [
                { area: "Reposição Automática", saving: 85, hours: 32, accuracy: 95 },
                { area: "Alertas Inteligentes", saving: 70, hours: 24, accuracy: 88 },
                { area: "Relatórios Auto", saving: 60, hours: 18, accuracy: 92 },
                { area: "Previsão Demanda", saving: 45, hours: 12, accuracy: 82 }
            ],
            insights: [
              "Economia total: 86 horas/mês",
              "Precisão média: +89%",
              "Redução de erros: 74%"
            ],
            color: "rgb(168 85 247)" // purple-500
          }
        ]
      },

      achievements: {
        title: "Análise de Conquistas e Performance",
        description: "Celebração de resultados e identificação de fatores de sucesso",
        charts: [
          {
            id: "performance-highlights",
            title: "Destaques de Performance",
            type: "bar",
            description: "Principais métricas de sucesso do período",
            data: [
                { metric: "Vendas", value: 245, target: 200, performance: 122.5 },
                { metric: "Margem", value: 38.5, target: 35, performance: 110.0 },
                { metric: "NPS", value: 82, target: 75, performance: 109.3 },
                { metric: "Giro Estoque", value: 3.8, target: 3.2, performance: 118.8 }
            ],
            insights: [
              "Todas as metas superadas!",
              "Destaque: Vendas (+22,5%)",
              "Performance geral: 115% das metas"
            ],
            color: "rgb(34 197 94)" // green-500
          },
          {
            id: "success-factors",
            title: "Fatores de Sucesso",
            type: "progress",
            description: "Análise dos elementos que contribuíram para o sucesso",
            data: [
                { factor: "Estratégia de Produto", contribution: 35, impact: "Alto" },
                { factor: "Execução Comercial", contribution: 28, impact: "Alto" },
                { factor: "Engajamento da Equipe", contribution: 22, impact: "Médio" },
                { factor: "Timing de Mercado", contribution: 15, impact: "Médio" }
            ],
            insights: [
              "Estratégia de produto foi decisiva (35%)",
              "Execução comercial exemplar",
              "Equipe altamente engajada"
            ],
            color: "rgb(59 130 246)" // blue-500
          },
          {
            id: "momentum-sustainability",
            title: "Sustentabilidade do Momentum",
            type: "line",
            description: "Análise da capacidade de manter o crescimento",
            data: [
                { aspect: "Demanda", current: 92, trend: "stable", forecast: 88 },
                { aspect: "Capacidade", current: 85, trend: "growing", forecast: 95 },
                { aspect: "Competição", current: 78, trend: "increasing", forecast: 72 },
                { aspect: "Recursos", current: 88, trend: "stable", forecast: 85 }
            ],
            insights: [
              "Demanda sustentável: 88% de confiança",
              "Capacidade em expansão (+12%)",
              "Atenção à pressão competitiva"
            ],
            color: "rgb(168 85 247)" // purple-500
          }
        ]
      }
    }

    return analyticsContexts[context] || {
      title: "Análise Geral",
      description: "Visualização dos dados principais do insight",
      charts: [
        {
          id: "general-trend",
          title: "Tendência Geral",
          type: "line",
          description: "Análise temporal dos principais indicadores",
          data: getRandomData(20, 80, 6).map((value, index) => ({
              period: `P${index + 1}`,
              value
          })),
          insights: [
            "Variação observada nos dados",
            "Tendência em análise",
            "Acompanhamento necessário"
          ],
          color: "rgb(59 130 246)"
        }
      ]
    }
  }
} 