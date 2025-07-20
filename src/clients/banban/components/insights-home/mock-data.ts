import { Insight } from './types';

export const mockInsights: Insight[] = [
  {
    id: '1',
    type: 'critical',
    title: 'Estoque Crítico',
    description: 'Produtos com estoque muito baixo',
    naturalLanguageText: '3 produtos da categoria Calçados estão com estoque crítico em 3 lojas',
    isNew: true,
    badges: ['🔥 Novo hoje'],
    data: {
      products: ['Bota Feminina Classic', 'Sapato Social Masculino', 'Tênis Casual Unissex'],
      stores: ['Loja Centro', 'Loja Shopping', 'Loja Norte'],
      metrics: { 
        unitsLeft: 2, 
        daysToStockout: 1,
        averageDailySales: 3.5
      }
    },
    actions: [
      { id: '1', label: 'Ver detalhes', type: 'navigation', payload: { route: '/inventory/critical' } },
      { id: '2', label: 'Criar pedido', type: 'task', payload: { task: 'restock' } }
    ],
    createdAt: new Date(),
    urgency: 'urgent'
  },
  {
    id: '2',
    type: 'attention',
    title: 'Inconsistência de Preços',
    description: 'Preços diferentes entre lojas',
    naturalLanguageText: 'Inconsistência de preços detectada em 2 produtos (diferença de 15%)',
    data: {
      products: ['Tênis Nike Air Max', 'Jaqueta de Couro'],
      stores: ['Loja Centro', 'Loja Shopping'],
      metrics: { 
        priceDifference: 15,
        affectedProducts: 2 
      }
    },
    actions: [
      { id: '3', label: 'Corrigir preços', type: 'task', payload: { task: 'price-sync' } }
    ],
    createdAt: new Date(),
    urgency: 'today'
  },
  {
    id: '3',
    type: 'opportunity',
    title: 'Produto em Alta',
    description: 'Oportunidade de aumento de estoque',
    naturalLanguageText: 'Produto similar "Tênis Nike Air" está em alta. Que tal promover enquanto calçados estão em falta?',
    isConnected: true,
    connectionText: 'CONECTADO',
    badges: ['↗️ CONECTADO'],
    data: {
      products: ['Tênis Nike Air Max', 'Tênis Adidas Ultraboost'],
      metrics: { 
        demandIncrease: 40,
        opportunityRevenue: 15000 
      }
    },
    actions: [
      { id: '4', label: 'Criar promoção', type: 'task', payload: { task: 'promotion' } }
    ],
    createdAt: new Date()
  },
  {
    id: '4',
    type: 'achievement',
    title: 'Meta Superada',
    description: 'Vendas acima do esperado',
    naturalLanguageText: 'Parabéns! Meta de vendas batida 5 dias antes! Moda Feminina liderou.',
    badges: ['⭐ 95% úteis'],
    trend: 'up',
    data: {
      metrics: { 
        salesGrowth: 12,
        daysEarly: 5,
        leadingCategory: 'Moda Feminina'
      }
    },
    actions: [
      { id: '5', label: 'Ver análise', type: 'navigation', payload: { route: '/analytics/achievement' } }
    ],
    createdAt: new Date()
  },
  {
    id: '5',
    type: 'moderate',
    title: 'Baixo Estoque Sazonal',
    description: 'Estoque baixo normal para época',
    naturalLanguageText: '8 produtos com menos de 5 unidades no estoque (normal para esta época)',
    data: {
      products: ['Casaco de Lã', 'Luvas de Inverno', 'Cachecol Listrado'],
      metrics: { 
        lowStockProducts: 8,
        seasonalPattern: 'normal' 
      }
    },
    actions: [
      { id: '6', label: 'Monitorar', type: 'task', payload: { task: 'monitor' } }
    ],
    createdAt: new Date()
  },
  {
    id: '6',
    type: 'attention',
    title: 'Atraso de Fornecedor',
    description: 'Entregas atrasadas',
    naturalLanguageText: 'Fornecedor XYZ atrasou entregas por 3 dias consecutivos',
    data: {
      suppliers: ['Fornecedor XYZ'],
      metrics: { 
        delayDays: 3,
        affectedOrders: 5 
      }
    },
    actions: [
      { id: '7', label: 'Contatar fornecedor', type: 'task', payload: { task: 'contact-supplier' } }
    ],
    createdAt: new Date(),
    urgency: 'today'
  },
  {
    id: '7',
    type: 'opportunity',
    title: 'Promoção Terminando',
    description: 'Oportunidade de últimas vendas',
    naturalLanguageText: 'Promoção de Bolsas termina amanhã. Últimas 12 unidades podem esgotar.',
    badges: ['⏰ Até amanhã'],
    urgency: 'tomorrow',
    data: {
      products: ['Bolsa de Couro Premium', 'Carteira Feminina'],
      metrics: { 
        unitsLeft: 12,
        hoursLeft: 18 
      }
    },
    actions: [
      { id: '8', label: 'Intensificar divulgação', type: 'task', payload: { task: 'promotion-boost' } }
    ],
    createdAt: new Date()
  },
  {
    id: '8',
    type: 'critical',
    title: 'Loja Sem Estoque',
    description: 'Categoria totalmente em falta',
    naturalLanguageText: 'Loja Centro ficou sem estoque de Calçados Femininos (produto em alta)',
    badges: ['🔥 Urgente agora'],
    isNew: true,
    urgency: 'urgent',
    data: {
      stores: ['Loja Centro'],
      products: ['Calçados Femininos'],
      metrics: { 
        hoursWithoutStock: 4,
        lostSales: 8 
      }
    },
    actions: [
      { id: '9', label: 'Transferir estoque', type: 'task', payload: { task: 'transfer-stock' } }
    ],
    createdAt: new Date()
  }
];

export const getTimeBasedGreeting = (userName?: string): string => {
  const hour = new Date().getHours();
  const name = userName || 'Loja Exemplo';
  
  if (hour < 12) {
    return `Olá ${name},`;
  } else if (hour < 18) {
    return `Boa tarde, ${name}!`;
  } else {
    return `Boa noite, ${name}!`;
  }
};

export const getTimeBasedSubtitle = (): string => {
  const hour = new Date().getHours();
  
  if (hour < 12) {
    return 'aqui estão os principais insights desta manhã';
  } else if (hour < 18) {
    return 'vamos ver como o dia está evoluindo';
  } else {
    return 'aqui está o resumo do seu dia';
  }
};

export const formatDateTime = (): string => {
  const now = new Date();
  const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  
  const dayName = days[now.getDay()];
  const day = now.getDate();
  const month = months[now.getMonth()];
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  
  return `${dayName}, ${day} de ${month} • ${hours}:${minutes}`;
};