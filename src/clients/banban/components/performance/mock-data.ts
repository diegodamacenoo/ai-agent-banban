// Mock data para o módulo Performance Banban
export interface PerformanceKPI {
  id: string;
  title: string;
  value: string;
  change: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
    period: string;
  };
  format: 'currency' | 'percentage' | 'number' | 'days';
  status: 'success' | 'warning' | 'danger' | 'info';
  icon: string;
}

export interface FashionMetrics {
  seasonal: {
    current: string;
    performance: number;
    target: number;
    previousYear: number;
  };
  categories: Array<{
    name: string;
    revenue: number;
    margin: number;
    units: number;
    growth: number;
  }>;
  collections: Array<{
    name: string;
    launchDate: string;
    revenue: number;
    roi: number;
    sellThrough: number;
    status: 'success' | 'warning' | 'danger';
  }>;
}

export interface BrandPerformance {
  ranking: Array<{
    position: number;
    brand: string;
    revenue: number;
    margin: number;
    marketShare: number;
    growth: number;
    category: string;
  }>;
  marketShare: Array<{
    brand: string;
    percentage: number;
    color: string;
  }>;
}

export interface MarginAnalysis {
  byCategory: Array<{
    category: string;
    currentMargin: number;
    targetMargin: number;
    variance: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  sizeColorMatrix: Array<{
    size: string;
    colors: Array<{
      color: string;
      margin: number;
      units: number;
      revenue: number;
    }>;
  }>;
}

export interface CriticalAlert {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  timestamp: string;
  category: string;
}

// Dados Mock
export const mockKPIs: PerformanceKPI[] = [
  {
    id: 'total-sales',
    title: 'Vendas Total',
    value: 'R$ 2.847.230',
    change: { value: 12.5, type: 'increase', period: 'vs mês anterior' },
    format: 'currency',
    status: 'success',
    icon: 'TrendingUp'
  },
  {
    id: 'avg-margin',
    title: 'Margem Média',
    value: '42.8%',
    change: { value: 3.2, type: 'increase', period: 'vs mês anterior' },
    format: 'percentage',
    status: 'success',
    icon: 'Percent'
  },
  {
    id: 'stock-coverage',
    title: 'Cobertura de Estoque',
    value: '28 dias',
    change: { value: 5, type: 'decrease', period: 'vs mês anterior' },
    format: 'days',
    status: 'warning',
    icon: 'Package'
  },
  {
    id: 'sell-through',
    title: 'Sell Through',
    value: '68.4%',
    change: { value: 8.1, type: 'increase', period: 'vs mês anterior' },
    format: 'percentage',
    status: 'success',
    icon: 'Target'
  },
  {
    id: 'turnover-rate',
    title: 'Giro de Estoque',
    value: '7.2x',
    change: { value: 15.3, type: 'increase', period: 'vs mês anterior' },
    format: 'number',
    status: 'success',
    icon: 'RotateCcw'
  },
  {
    id: 'out-of-stock',
    title: 'Produtos em Falta',
    value: '143',
    change: { value: 23, type: 'increase', period: 'vs semana anterior' },
    format: 'number',
    status: 'danger',
    icon: 'AlertTriangle'
  },
  {
    id: 'seasonal-performance',
    title: 'Performance Sazonal',
    value: '95.6%',
    change: { value: 2.4, type: 'decrease', period: 'vs meta' },
    format: 'percentage',
    status: 'warning',
    icon: 'Calendar'
  },
  {
    id: 'collection-roi',
    title: 'ROI Coleções',
    value: '156.7%',
    change: { value: 24.2, type: 'increase', period: 'vs coleção anterior' },
    format: 'percentage',
    status: 'success',
    icon: 'Crown'
  }
];

export const mockFashionMetrics: FashionMetrics = {
  seasonal: {
    current: 'Verão 2024',
    performance: 95.6,
    target: 100,
    previousYear: 89.3
  },
  categories: [
    {
      name: 'Calçados Femininos',
      revenue: 1245600,
      margin: 45.2,
      units: 2847,
      growth: 18.5
    },
    {
      name: 'Bolsas e Carteiras',
      revenue: 876400,
      margin: 52.8,
      units: 1632,
      growth: 23.1
    },
    {
      name: 'Calçados Masculinos',
      revenue: 654300,
      margin: 38.7,
      units: 1456,
      growth: 8.9
    },
    {
      name: 'Acessórios',
      revenue: 342800,
      margin: 48.3,
      units: 3241,
      growth: 31.2
    }
  ],
  collections: [
    {
      name: 'Verão Vibrante 2024',
      launchDate: '2024-01-15',
      revenue: 1456800,
      roi: 178.3,
      sellThrough: 72.5,
      status: 'success'
    },
    {
      name: 'Elegância Urbana',
      launchDate: '2024-02-20',
      revenue: 987200,
      roi: 134.7,
      sellThrough: 58.9,
      status: 'warning'
    },
    {
      name: 'Beach Collection',
      launchDate: '2024-03-10',
      revenue: 756400,
      roi: 142.1,
      sellThrough: 81.2,
      status: 'success'
    }
  ]
};

export const mockBrandPerformance: BrandPerformance = {
  ranking: [
    {
      position: 1,
      brand: 'Nike',
      revenue: 1245600,
      margin: 42.8,
      marketShare: 28.5,
      growth: 15.2,
      category: 'Calçados Esportivos'
    },
    {
      position: 2,
      brand: 'Adidas',
      revenue: 987400,
      margin: 39.6,
      marketShare: 22.7,
      growth: 8.9,
      category: 'Calçados Esportivos'
    },
    {
      position: 3,
      brand: 'Melissa',
      revenue: 756300,
      margin: 48.2,
      marketShare: 17.3,
      growth: 24.1,
      category: 'Calçados Femininos'
    },
    {
      position: 4,
      brand: 'Havaianas',
      revenue: 654200,
      margin: 35.7,
      marketShare: 15.0,
      growth: 6.8,
      category: 'Calçados Casuais'
    },
    {
      position: 5,
      brand: 'Vizzano',
      revenue: 543100,
      margin: 44.1,
      marketShare: 12.4,
      growth: 18.7,
      category: 'Calçados Femininos'
    }
  ],
  marketShare: [
    { brand: 'Nike', percentage: 28.5, color: '#FF6B35' },
    { brand: 'Adidas', percentage: 22.7, color: '#004B87' },
    { brand: 'Melissa', percentage: 17.3, color: '#E91E63' },
    { brand: 'Havaianas', percentage: 15.0, color: '#FF9800' },
    { brand: 'Outros', percentage: 16.5, color: '#9E9E9E' }
  ]
};

export const mockMarginAnalysis: MarginAnalysis = {
  byCategory: [
    {
      category: 'Calçados Femininos',
      currentMargin: 45.2,
      targetMargin: 48.0,
      variance: -2.8,
      trend: 'up'
    },
    {
      category: 'Bolsas e Carteiras',
      currentMargin: 52.8,
      targetMargin: 50.0,
      variance: 2.8,
      trend: 'up'
    },
    {
      category: 'Calçados Masculinos',
      currentMargin: 38.7,
      targetMargin: 42.0,
      variance: -3.3,
      trend: 'down'
    },
    {
      category: 'Acessórios',
      currentMargin: 48.3,
      targetMargin: 45.0,
      variance: 3.3,
      trend: 'stable'
    }
  ],
  sizeColorMatrix: [
    {
      size: '34',
      colors: [
        { color: 'Preto', margin: 45.2, units: 156, revenue: 23400 },
        { color: 'Branco', margin: 42.8, units: 134, revenue: 20100 },
        { color: 'Nude', margin: 48.1, units: 189, revenue: 28350 },
        { color: 'Vermelho', margin: 39.6, units: 98, revenue: 14700 }
      ]
    },
    {
      size: '35',
      colors: [
        { color: 'Preto', margin: 46.8, units: 234, revenue: 35100 },
        { color: 'Branco', margin: 44.2, units: 198, revenue: 29700 },
        { color: 'Nude', margin: 49.7, units: 267, revenue: 40050 },
        { color: 'Vermelho', margin: 41.3, units: 145, revenue: 21750 }
      ]
    },
    {
      size: '36',
      colors: [
        { color: 'Preto', margin: 47.5, units: 312, revenue: 46800 },
        { color: 'Branco', margin: 45.1, units: 276, revenue: 41400 },
        { color: 'Nude', margin: 50.3, units: 334, revenue: 50100 },
        { color: 'Vermelho', margin: 42.7, units: 187, revenue: 28050 }
      ]
    },
    {
      size: '37',
      colors: [
        { color: 'Preto', margin: 48.2, units: 287, revenue: 43050 },
        { color: 'Branco', margin: 46.3, units: 251, revenue: 37650 },
        { color: 'Nude', margin: 51.1, units: 298, revenue: 44700 },
        { color: 'Vermelho', margin: 43.8, units: 167, revenue: 25050 }
      ]
    }
  ]
};

export const mockCriticalAlerts: CriticalAlert[] = [
  {
    id: 'alert-1',
    title: 'Estoque Baixo - Tênis Nike Air Max',
    description: 'Apenas 12 unidades restantes. Reposição necessária em 3 dias.',
    severity: 'critical',
    timestamp: '2024-01-15T10:30:00Z',
    category: 'Estoque'
  },
  {
    id: 'alert-2',
    title: 'Margem Abaixo da Meta - Categoria Masculina',
    description: 'Margem atual de 38.7% está 3.3% abaixo da meta de 42%.',
    severity: 'high',
    timestamp: '2024-01-15T09:15:00Z',
    category: 'Margem'
  },
  {
    id: 'alert-3',
    title: 'Performance Sazonal em Declínio',
    description: 'Performance da estação atual 2.4% abaixo da meta estabelecida.',
    severity: 'medium',
    timestamp: '2024-01-15T08:45:00Z',
    category: 'Sazonal'
  }
];

// Dados para gráficos
export const mockTrendData = {
  sales: [
    { date: '2024-01-01', value: 2450000 },
    { date: '2024-01-08', value: 2680000 },
    { date: '2024-01-15', value: 2847230 },
    { date: '2024-01-22', value: 2756000 },
    { date: '2024-01-29', value: 2934000 }
  ],
  seasonal: [
    { period: 'Verão 2023', value: 89.3 },
    { period: 'Outono 2023', value: 92.7 },
    { period: 'Inverno 2023', value: 96.1 },
    { period: 'Primavera 2023', value: 88.9 },
    { period: 'Verão 2024', value: 95.6 }
  ]
};