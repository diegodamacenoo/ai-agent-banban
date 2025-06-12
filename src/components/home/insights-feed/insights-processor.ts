import { Insight } from '@/types/insights';

export const InsightsProcessor = {
  // Gera dados aleatórios para tornar os mocks mais dinâmicos
  generateRandomData() {
    const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
    const getRandomLojas = () => getRandomInt(1, 4);
    const getRandomProdutos = () => getRandomInt(1, 8);
    const getRandomDias = () => getRandomInt(1, 45);
    
    return {
      lojas: getRandomLojas(),
      produtos: getRandomProdutos(),
      dias: getRandomDias(),
      unidades: getRandomInt(1, 15),
      percentual: getRandomInt(15, 35),
      valor: getRandomInt(500, 15000)
    };
  },

  generateMockInsights(): Insight[] {
    const random = this.generateRandomData();
    
    return [
      {
        id: 'insight-1',
        priority: 'critical',
        title: 'Estoque Baixo - Risco de Ruptura',
        description: `Você possui ${random.produtos} produtos da categoria Calçados com estoque baixo em ${random.lojas} lojas`,
        icon: 'package',
        actions: [{ label: 'Analisar', url: '/inventory/low-stock' }],
      },
      {
        id: 'insight-2',
        priority: 'attention',
        title: 'Potencial de Ruptura',
        description: `Você possui ${random.produtos + 2} produtos com menos de 5 unidades em ${random.lojas + 1} lojas`,
        icon: 'alert-triangle',
        actions: [{ label: 'Analisar', url: '/reports/stock-out-risk' }],
      },
      {
        id: 'insight-3',
        priority: 'warning',
        title: 'Inconsistência de Preços',
        description: `Detectada inconsistência de preços em ${random.produtos - 1 > 0 ? random.produtos - 1 : 1} produto entre lojas (diferença de ${random.percentual}%)`,
        icon: 'dollar-sign',
        actions: [{ label: 'Analisar', url: '/pricing/inconsistencies' }],
      },
      {
        id: 'insight-4',
        priority: 'opportunity',
        title: 'Oportunidade de Remanejamento',
        description: `Remaneje ${random.unidades} unidades de ${random.produtos} produtos para lojas com maior demanda`,
        icon: 'shuffle',
        actions: [{ label: 'Analisar', url: '/inventory/transfer-opportunity' }],
      },
      {
        id: 'insight-5',
        priority: 'success',
        title: 'Marco de Vendas Atingido',
        description: `Parabéns! Você vendeu ${random.valor + 500} produtos este mês - crescimento de ${random.percentual}%`,
        icon: 'award',
        actions: [{ label: 'Analisar', url: '/reports/sales-milestones' }],
      },
      {
        id: 'insight-6',
        priority: 'info',
        title: 'Produto em Alta',
        description: `"Tênis Runner" teve aumento de ${random.percentual + 10}% nas vendas nos últimos ${random.dias} dias`,
        icon: 'trending-up',
        actions: [{ label: 'Analisar', url: '/products/TEN-RUN-01' }],
      },
      {
        id: 'insight-7',
        priority: 'attention',
        title: 'Pico de Devolução',
        description: `Taxa de devolução ${random.percentual}% acima da média em ${random.produtos} produtos nos últimos ${random.dias} dias`,
        icon: 'undo-2',
        actions: [{ label: 'Analisar', url: '/reports/returns-analysis' }],
      },
      {
        id: 'insight-8',
        priority: 'warning',
        title: 'Baixo Markup Detectado',
        description: `${random.produtos} produtos com margem abaixo de ${random.percentual}% - impacto de R$ ${random.valor * 3} na rentabilidade`,
        icon: 'trending-down',
        actions: [{ label: 'Analisar', url: '/pricing/low-margin' }],
      },
      {
        id: 'insight-9',
        priority: 'warning',
        title: 'Produtos Parados',
        description: `${random.produtos + 1} produtos sem venda há ${random.dias} dias em ${random.lojas} lojas`,
        icon: 'clock',
        actions: [{ label: 'Analisar', url: '/inventory/slow-movers' }],
      },
      {
        id: 'insight-10',
        priority: 'opportunity',
        title: 'Promoção Direcionada',
        description: `Oportunidade de promover ${random.produtos} produtos slow-movers com potencial de R$ ${random.valor * 2}`,
        icon: 'tag',
        actions: [{ label: 'Analisar', url: '/promotions/slow-movers' }],
      }
    ];
  },

  generateInsights: (
    alerts: any[], 
    metrics: any, 
    coverageData: any[], 
    abcData: any[], 
    supplierData: any[]
  ): Insight[] => {
    // Por enquanto, vamos sempre retornar os mocks para garantir o visual.
    // A lógica de processamento de dados reais pode ser reimplementada aqui no futuro.
    return InsightsProcessor.generateMockInsights();
  }
}; 