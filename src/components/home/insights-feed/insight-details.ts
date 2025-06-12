interface LocationData {
  name: string
  currentStock: number
  suggestedTransfer: number
}

interface ProductData {
  name: string
  lastSaleDate?: string
  currentStock: number
  daysWithoutSale: number
  // Contexto específicos
  returnRate?: string
  returnReason?: string
  lastReturnDate?: string
  salesGrowth?: string
  weeklyViews?: number
  priceVariation?: string
  marginPercent?: string
}

interface AnalyticsData {
  salesHistory: { month: string; sales: number }[]
  stockMovement: { date: string; stock: number }[]
  storeComparison: { store: string; performance: number }[]
}

export interface InsightDetails {
  createdAt: string
  category: string
  affectedItems: number
  recommendedActions: string[]
  impact: string
  timeline: string
  locations?: LocationData[]
  products?: ProductData[]
  aiMessage: string
  financialMetrics?: {
    potentialLoss: string
    currentMargin: string
    stockValue: string
    turnoverRate: string
  }
  analyticsData?: AnalyticsData
}

// Dados expandidos para cada insight
export const InsightDetailsMap: Record<string, Partial<InsightDetails>> = {
  'insight-1': {
    category: 'Gestão de Estoque',
    impact: 'Alto',
    timeline: 'Imediato',
    recommendedActions: [
      'Verificar histórico de vendas dos últimos 30 dias',
      'Contatar fornecedores para reposição urgente',
      'Considerar transferência entre lojas'
    ],
    financialMetrics: {
      potentialLoss: 'R$ 8.500',
      currentMargin: '32%',
      stockValue: 'R$ 25.000',
      turnoverRate: '1.8x/mês'
    },
    aiMessage: 'Identifiquei produtos com estoque baixo em lojas importantes. Recomendo verificar o histórico de vendas dos últimos 30 dias para entender o padrão de consumo. Em seguida, contatem os fornecedores para reposição urgente, pois o risco de ruptura é alto.'
  },
  'insight-2': {
    category: 'Prevenção de Ruptura',
    impact: 'Alto',
    timeline: '24-48 horas',
    recommendedActions: [
      'Revisar política de estoque mínimo',
      'Agendar reposição preventiva',
      'Monitorar vendas diárias'
    ],
    financialMetrics: {
      potentialLoss: 'R$ 12.000',
      currentMargin: '28%',
      stockValue: 'R$ 8.500',
      turnoverRate: '3.2x/mês'
    },
    aiMessage: 'Detectei produtos próximos da ruptura. Sugiro revisar urgentemente a política de estoque mínimo desses itens, pois pode estar subdimensionada. Agendem reposição preventiva imediatamente.'
  },
  'insight-3': {
    category: 'Precificação',
    impact: 'Médio',
    timeline: '72 horas',
    recommendedActions: [
      'Padronizar preços entre lojas',
      'Revisar estratégia de precificação',
      'Verificar custos operacionais por loja'
    ],
    locations: [
      { name: 'Loja Shopping Center', currentStock: 25, suggestedTransfer: 0 },
      { name: 'Loja Centro', currentStock: 18, suggestedTransfer: 0 },
      { name: 'Loja Outlet', currentStock: 32, suggestedTransfer: 0 }
    ],
    products: [
      { name: 'Sapato Oxford Executive', priceVariation: 'R$89,90 - R$109,90', marginPercent: '28%', currentStock: 75, daysWithoutSale: 0, lastSaleDate: 'N/A' }
    ],
    financialMetrics: {
      potentialLoss: 'R$ 3.200',
      currentMargin: '35%',
      stockValue: 'R$ 12.000',
      turnoverRate: '2.5x/mês'
    },
    aiMessage: 'Encontrei inconsistência de preços entre lojas. Isso pode confundir clientes e gerar perda de margem. Recomendo padronizar os preços considerando os custos operacionais de cada loja.'
  },
  'insight-4': {
    category: 'Otimização de Estoque',
    impact: 'Médio',
    timeline: '48-72 horas',
    recommendedActions: [
      'Calcular demanda por loja',
      'Planejar transferência entre lojas',
      'Monitorar performance pós-transferência'
    ],
    financialMetrics: {
      potentialLoss: 'R$ 5.800',
      currentMargin: '40%',
      stockValue: 'R$ 18.000',
      turnoverRate: '2.8x/mês'
    },
    aiMessage: 'Identifiquei oportunidade de remanejamento! Produtos parados em uma loja têm alta demanda em outra. Sugiro transferir o estoque para maximizar as vendas.'
  },
  'insight-5': {
    category: 'Conquista',
    impact: 'Positivo',
    timeline: 'Concluído',
    recommendedActions: [
      'Analisar produtos best-sellers',
      'Identificar padrões de sucesso',
      'Replicar estratégias bem-sucedidas'
    ],
    financialMetrics: {
      potentialLoss: 'R$ 0',
      currentMargin: '42%',
      stockValue: 'R$ 125.000',
      turnoverRate: '4.1x/mês'
    },
    aiMessage: 'Parabéns pelo marco atingido! 🎉 Esse crescimento mostra estratégias bem-sucedidas. Que tal analisarmos quais produtos mais contribuíram para essa conquista?'
  },
  'insight-6': {
    category: 'Análise de Tendências',
    impact: 'Oportunidade',
    timeline: '24 horas',
    recommendedActions: [
      'Aumentar estoque do produto',
      'Expandir linha similar',
      'Investigar causa do pico de vendas'
    ],
    locations: [
      { name: 'Loja Shopping Center', currentStock: 12, suggestedTransfer: 15 },
      { name: 'Loja Centro', currentStock: 8, suggestedTransfer: 12 }
    ],
    products: [
      { name: 'Tênis Runner', salesGrowth: '+35%', weeklyViews: 245, currentStock: 25, lastSaleDate: '19/12/2024', daysWithoutSale: 1 }
    ],
    financialMetrics: {
      potentialLoss: 'R$ 0',
      currentMargin: '38%',
      stockValue: 'R$ 8.750',
      turnoverRate: '5.2x/mês'
    },
    aiMessage: 'Ótima notícia! Produto com crescimento significativo nas vendas. Isso indica tendência positiva que vocês podem aproveitar. Sugiro aumentar o estoque e investigar a causa do pico.'
  },
  'insight-7': {
    category: 'Gestão de Devoluções',
    impact: 'Alto',
    timeline: 'Imediato',
    recommendedActions: [
      'Investigar motivos das devoluções',
      'Revisar qualidade dos produtos',
      'Treinar equipe de vendas'
    ],
    locations: [
      { name: 'Loja Shopping Center', currentStock: 45, suggestedTransfer: 0 },
      { name: 'Loja Centro', currentStock: 38, suggestedTransfer: 0 },
      { name: 'Loja Outlet', currentStock: 22, suggestedTransfer: 0 }
    ],
    products: [
      { name: 'Tênis Sport Pro', returnRate: '18%', returnReason: 'Tamanho inadequado', lastReturnDate: '18/12/2024', currentStock: 23, daysWithoutSale: 5, lastSaleDate: '13/12/2024' },
      { name: 'Sapato Social Premium', returnRate: '22%', returnReason: 'Defeito de fabricação', lastReturnDate: '17/12/2024', currentStock: 15, daysWithoutSale: 8, lastSaleDate: '10/12/2024' },
      { name: 'Sandália Comfort+', returnRate: '15%', returnReason: 'Não agradou', lastReturnDate: '16/12/2024', currentStock: 31, daysWithoutSale: 2, lastSaleDate: '15/12/2024' },
      { name: 'Bota Trail Adventure', returnRate: '25%', returnReason: 'Qualidade inferior', lastReturnDate: '15/12/2024', currentStock: 18, daysWithoutSale: 12, lastSaleDate: '06/12/2024' },
      { name: 'Chinelo Relax', returnRate: '12%', returnReason: 'Tamanho inadequado', lastReturnDate: '14/12/2024', currentStock: 42, daysWithoutSale: 3, lastSaleDate: '14/12/2024' },
      { name: 'Tênis Running Max', returnRate: '20%', returnReason: 'Desconforto', lastReturnDate: '13/12/2024', currentStock: 27, daysWithoutSale: 9, lastSaleDate: '09/12/2024' }
    ],
    financialMetrics: {
      potentialLoss: 'R$ 6.800',
      currentMargin: '25%',
      stockValue: 'R$ 22.000',
      turnoverRate: '1.9x/mês'
    },
    aiMessage: 'Detectei pico de devoluções acima da média. Isso impacta diretamente a margem e pode indicar problemas de qualidade ou vendas inadequadas. Recomendo investigar os motivos urgentemente.'
  },
  'insight-8': {
    category: 'Otimização de Margem',
    impact: 'Alto',
    timeline: '48 horas',
    recommendedActions: [
      'Revisar precificação dos produtos',
      'Negociar melhores condições com fornecedores',
      'Considerar descontinuar produtos não rentáveis'
    ],
    locations: [
      { name: 'Loja Shopping Center', currentStock: 45, suggestedTransfer: 0 },
      { name: 'Loja Centro', currentStock: 32, suggestedTransfer: 0 },
      { name: 'Loja Outlet', currentStock: 28, suggestedTransfer: 0 }
    ],
    products: [
      { name: 'Tênis Casual Basic', marginPercent: '12%', priceVariation: 'R$45,90', currentStock: 35, daysWithoutSale: 10, lastSaleDate: '08/12/2024' },
      { name: 'Chinelo Simples', marginPercent: '8%', priceVariation: 'R$12,90', currentStock: 48, daysWithoutSale: 4, lastSaleDate: '14/12/2024' },
      { name: 'Sandália Básica', marginPercent: '15%', priceVariation: 'R$23,90', currentStock: 22, daysWithoutSale: 7, lastSaleDate: '11/12/2024' }
    ],
    financialMetrics: {
      potentialLoss: 'R$ 15.600',
      currentMargin: '18%',
      stockValue: 'R$ 35.000',
      turnoverRate: '1.5x/mês'
    },
    aiMessage: 'Produtos com margem muito baixa estão impactando significativamente a rentabilidade. Recomendo revisar a precificação e considerar negociar melhores condições com fornecedores.'
  },
  'insight-9': {
    category: 'Produtos Parados',
    impact: 'Médio',
    timeline: '72 horas',
    recommendedActions: [
      'Criar campanhas promocionais',
      'Transferir para outlet',
      'Revisar estratégia de compras'
    ],
    locations: [
      { name: 'Loja Shopping Center', currentStock: 15, suggestedTransfer: -8 },
      { name: 'Loja Centro', currentStock: 12, suggestedTransfer: -6 },
      { name: 'Loja Outlet', currentStock: 8, suggestedTransfer: -4 }
    ],
    products: [
      { name: 'Bota Ankle Boot Vintage', lastSaleDate: '15/11/2024', currentStock: 8, daysWithoutSale: 25 },
      { name: 'Sapato Oxford Clássico', lastSaleDate: '10/11/2024', currentStock: 6, daysWithoutSale: 30 },
      { name: 'Sandália Plataforma Retro', lastSaleDate: '08/11/2024', currentStock: 12, daysWithoutSale: 32 },
      { name: 'Tênis Vintage Edition', lastSaleDate: '05/11/2024', currentStock: 9, daysWithoutSale: 35 }
    ],
    financialMetrics: {
      potentialLoss: 'R$ 9.200',
      currentMargin: '30%',
      stockValue: 'R$ 28.000',
      turnoverRate: '0.8x/mês'
    },
    aiMessage: 'Produtos sem movimento há muito tempo estão travando capital e ocupando espaço. Sugiro criar campanhas promocionais ou transferir para outlets para liberar recursos.'
  },
  'insight-10': {
    category: 'Oportunidades de Promoção',
    impact: 'Oportunidade',
    timeline: '24-48 horas',
    recommendedActions: [
      'Criar campanha promocional direcionada',
      'Definir desconto estratégico',
      'Monitorar resultados da promoção'
    ],
    locations: [
      { name: 'Loja Shopping Center', currentStock: 8, suggestedTransfer: 0 },
      { name: 'Loja Centro', currentStock: 12, suggestedTransfer: 0 },
      { name: 'Loja Outlet', currentStock: 5, suggestedTransfer: 0 }
    ],
    financialMetrics: {
      potentialLoss: 'R$ 0',
      currentMargin: '28%',
      stockValue: 'R$ 16.500',
      turnoverRate: '1.2x/mês'
    },
    aiMessage: 'Identifiquei produtos slow-movers com potencial de resposta positiva a promoções. Uma campanha direcionada pode acelerar o giro e liberar capital para novos investimentos.'
  }
} 