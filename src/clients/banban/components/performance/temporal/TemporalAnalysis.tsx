'use client';

import { useState } from 'react';
import { 
  TrendingUp, 
  Calendar, 
  BarChart3, 
  LineChart,
  Activity,
  Clock,
  Zap,
  Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { TimeSeriesData, TemporalAnalysis as TemporalAnalysisType } from '../types';

interface TemporalAnalysisProps {
  data?: TemporalAnalysisType;
  onPeriodClick?: (period: string) => void;
  isLoading?: boolean;
}

// Mock data para análise temporal
const mockTemporalData: TemporalAnalysisType = {
  sales_over_time: {
    daily: [
      { date: '2024-01-01', value: 87450, period_type: 'daily' },
      { date: '2024-01-02', value: 92300, period_type: 'daily' },
      { date: '2024-01-03', value: 78900, period_type: 'daily' },
      { date: '2024-01-04', value: 95600, period_type: 'daily' },
      { date: '2024-01-05', value: 101200, period_type: 'daily' },
      { date: '2024-01-06', value: 88700, period_type: 'daily' },
      { date: '2024-01-07', value: 76500, period_type: 'daily' }
    ],
    weekly: [
      { date: '2024-W01', value: 620500, period_type: 'weekly' },
      { date: '2024-W02', value: 678300, period_type: 'weekly' },
      { date: '2024-W03', value: 598700, period_type: 'weekly' },
      { date: '2024-W04', value: 723400, period_type: 'weekly' }
    ],
    monthly: [
      { date: '2023-10', value: 2450000, period_type: 'monthly' },
      { date: '2023-11', value: 2680000, period_type: 'monthly' },
      { date: '2023-12', value: 3200000, period_type: 'monthly' },
      { date: '2024-01', value: 2847230, period_type: 'monthly' }
    ],
    yearly_comparison: [{
      current_year: [
        { date: '2024-01', value: 2847230, period_type: 'monthly' },
        { date: '2024-02', value: 2965000, period_type: 'monthly' },
        { date: '2024-03', value: 3120000, period_type: 'monthly' }
      ],
      previous_year: [
        { date: '2023-01', value: 2450000, period_type: 'monthly' },
        { date: '2023-02', value: 2580000, period_type: 'monthly' },
        { date: '2023-03', value: 2750000, period_type: 'monthly' }
      ],
      growth_percentage: 15.2
    }]
  },
  margin_evolution: {
    by_period: [
      { date: '2024-01-01', value: 42.5, period_type: 'daily' },
      { date: '2024-01-02', value: 43.1, period_type: 'daily' },
      { date: '2024-01-03', value: 41.8, period_type: 'daily' },
      { date: '2024-01-04', value: 44.2, period_type: 'daily' },
      { date: '2024-01-05', value: 43.7, period_type: 'daily' }
    ],
    by_category: [
      { date: '2024-01', value: 45.2, period_type: 'monthly', category: 'Calçados Femininos' },
      { date: '2024-01', value: 52.8, period_type: 'monthly', category: 'Bolsas' },
      { date: '2024-01', value: 38.7, period_type: 'monthly', category: 'Calçados Masculinos' }
    ],
    seasonal_patterns: [
      { season: 'Verão', months: ['12', '01', '02', '03'], performance_index: 95.6, vs_average: 2.3 },
      { season: 'Outono', months: ['03', '04', '05', '06'], performance_index: 88.9, vs_average: -4.1 },
      { season: 'Inverno', months: ['06', '07', '08', '09'], performance_index: 92.7, vs_average: -0.3 },
      { season: 'Primavera', months: ['09', '10', '11', '12'], performance_index: 97.2, vs_average: 4.2 }
    ]
  },
  seasonality_patterns: {
    by_month: [
      { month: 1, month_name: 'Janeiro', average_sales: 2847230, seasonal_index: 1.12 },
      { month: 2, month_name: 'Fevereiro', average_sales: 2456000, seasonal_index: 0.97 },
      { month: 3, month_name: 'Março', average_sales: 2678000, seasonal_index: 1.05 },
      { month: 12, month_name: 'Dezembro', average_sales: 3200000, seasonal_index: 1.26 }
    ],
    by_week: [],
    by_day_of_week: [
      { day_of_week: 1, day_name: 'Segunda', average_sales: 85000, peak_hours: [14, 15, 16] },
      { day_of_week: 2, day_name: 'Terça', average_sales: 92000, peak_hours: [14, 15, 16] },
      { day_of_week: 6, day_name: 'Sábado', average_sales: 125000, peak_hours: [10, 11, 14, 15, 16] }
    ],
    holiday_impact: [
      { holiday_name: 'Natal', date: '2023-12-25', impact_percentage: 45.2, sales_lift: 1200000 },
      { holiday_name: 'Dia das Mães', date: '2024-05-12', impact_percentage: 38.7, sales_lift: 950000 }
    ]
  },
  year_over_year: {
    revenue_growth: [
      { date: '2024-01', value: 15.2, period_type: 'monthly' },
      { date: '2024-02', value: 18.6, period_type: 'monthly' },
      { date: '2024-03', value: 12.9, period_type: 'monthly' }
    ],
    margin_evolution: [
      { date: '2024-01', value: 2.3, period_type: 'monthly' },
      { date: '2024-02', value: 1.8, period_type: 'monthly' },
      { date: '2024-03', value: 3.1, period_type: 'monthly' }
    ],
    category_performance: [
      { category: 'Calçados Femininos', current_period: 1245600, previous_period: 1105000, growth_percentage: 12.7 },
      { category: 'Bolsas', current_period: 876400, previous_period: 712000, growth_percentage: 23.1 }
    ]
  }
};

// Componente para gráfico simples de linha
function SimpleLineChart({ 
  data, 
  title, 
  color = '#3B82F6',
  height = 120 
}: { 
  data: TimeSeriesData[], 
  title: string, 
  color?: string,
  height?: number 
}) {
  if (!data.length) return null;
  
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue;
  
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h4 className="font-medium text-gray-900">{title}</h4>
        <div className="flex items-center gap-1 text-sm text-green-600">
          <TrendingUp className="h-4 w-4" />
          <span>+12.5%</span>
        </div>
      </div>
      
      <div className="relative" style={{ height: `${height}px` }}>
        <svg width="100%" height="100%" className="overflow-visible">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
            <line
              key={index}
              x1="0"
              y1={height * ratio}
              x2="100%"
              y2={height * ratio}
              stroke="#f3f4f6"
              strokeWidth="1"
            />
          ))}
          
          {/* Data line */}
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={data.map((point, index) => {
              const x = (index / (data.length - 1)) * 100;
              const y = range > 0 ? (1 - (point.value - minValue) / range) * height : height / 2;
              return `${x}%,${y}`;
            }).join(' ')}
          />
          
          {/* Data points */}
          {data.map((point, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = range > 0 ? (1 - (point.value - minValue) / range) * height : height / 2;
            return (
              <circle
                key={index}
                cx={`${x}%`}
                cy={y}
                r="4"
                fill={color}
                stroke="white"
                strokeWidth="2"
                className="hover:r-6 transition-all duration-200"
              />
            );
          })}
        </svg>
        
        {/* Values at bottom */}
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          {data.map((point, index) => (
            <span key={index}>
              {point.period_type === 'daily' ? 
                new Date(point.date).getDate() :
                point.date.split('-').pop()
              }
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// Componente para padrões sazonais
function SeasonalPatterns({ data }: { data: any }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {data.seasonal_patterns.map((season: any) => (
        <Card key={season.season} className="text-center">
          <CardContent className="p-4">
            <div className="text-sm font-medium text-gray-600 mb-1">
              {season.season}
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {season.performance_index.toFixed(1)}%
            </div>
            <div className={`text-xs flex items-center justify-center gap-1 ${
              season.vs_average > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {season.vs_average > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingUp className="h-3 w-3 rotate-180" />}
              {season.vs_average > 0 ? '+' : ''}{season.vs_average.toFixed(1)}% vs média
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function TemporalAnalysis({ 
  data = mockTemporalData, 
  onPeriodClick,
  isLoading = false 
}: TemporalAnalysisProps) {
  const [activeTab, setActiveTab] = useState('trends');
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-20 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5 text-blue-600" />
              Análise Temporal
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Tendências, sazonalidade e evolução ao longo do tempo
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Período Personalizado
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="trends" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Tendências
            </TabsTrigger>
            <TabsTrigger value="seasonal" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Sazonal
            </TabsTrigger>
            <TabsTrigger value="patterns" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Padrões
            </TabsTrigger>
            <TabsTrigger value="comparison" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Comparação
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="space-y-6">
            {/* Gráficos de Tendência Principal */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <SimpleLineChart
                    data={data.sales_over_time.daily}
                    title="Vendas Diárias"
                    color="#3B82F6"
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <SimpleLineChart
                    data={data.margin_evolution.by_period}
                    title="Evolução da Margem"
                    color="#10B981"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Métricas de Tendência */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4 text-center">
                  <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-sm text-gray-600">Tendência Diária</div>
                  <div className="text-xl font-bold text-gray-900">+2.3%</div>
                  <div className="text-xs text-blue-600">Crescimento consistente</div>
                </CardContent>
              </Card>
              
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-sm text-gray-600">Margem Trend</div>
                  <div className="text-xl font-bold text-gray-900">+1.2%</div>
                  <div className="text-xs text-green-600">Melhorando</div>
                </CardContent>
              </Card>
              
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-4 text-center">
                  <Zap className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-sm text-gray-600">Velocidade</div>
                  <div className="text-xl font-bold text-gray-900">12.5x</div>
                  <div className="text-xs text-purple-600">Aceleração</div>
                </CardContent>
              </Card>
              
              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="p-4 text-center">
                  <Target className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <div className="text-sm text-gray-600">Projeção</div>
                  <div className="text-xl font-bold text-gray-900">R$ 3.2M</div>
                  <div className="text-xs text-orange-600">Meta mensal</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="seasonal" className="space-y-6">
            <SeasonalPatterns data={data.margin_evolution} />
            
            {/* Gráfico Sazonal Detalhado */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance Sazonal Histórica</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4" />
                    <p className="text-lg font-medium">Gráfico Sazonal Avançado</p>
                    <p className="text-sm">Visualização detalhada por estação - Em desenvolvimento</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="patterns" className="space-y-6">
            {/* Padrões por Dia da Semana */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Padrões por Dia da Semana</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, index) => (
                    <div key={day} className="text-center p-3 rounded-lg bg-gray-50">
                      <div className="text-xs text-gray-600 mb-1">{day}</div>
                      <div className="text-sm font-medium">
                        {index === 0 ? '76k' : 
                         index === 5 ? '125k' : 
                         index === 6 ? '118k' : '92k'}
                      </div>
                      <div 
                        className="h-2 bg-blue-200 rounded-full mt-1"
                        style={{ 
                          backgroundColor: index === 5 || index === 6 ? '#3B82F6' : '#93C5FD'
                        }}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Impacto de Feriados */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Impacto de Feriados e Datas Especiais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.seasonality_patterns.holiday_impact.map((holiday) => (
                    <div key={holiday.holiday_name} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{holiday.holiday_name}</div>
                        <div className="text-sm text-gray-600">{holiday.date}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          +{holiday.impact_percentage.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600">
                          R$ {(holiday.sales_lift / 1000).toFixed(0)}k boost
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comparison" className="space-y-6">
            {/* Comparação Ano a Ano */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Crescimento Ano a Ano</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-6 bg-green-50 rounded-lg border-green-200 border">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      +{data.sales_over_time.yearly_comparison[0]?.growth_percentage.toFixed(1)}%
                    </div>
                    <div className="text-gray-600">Crescimento médio YoY</div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.year_over_year.category_performance.map((category) => (
                      <div key={category.category} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{category.category}</span>
                          <Badge variant={category.growth_percentage > 0 ? 'default' : 'secondary'}>
                            {category.growth_percentage > 0 ? '+' : ''}{category.growth_percentage.toFixed(1)}%
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          R$ {(category.current_period / 1000).toFixed(0)}k → vs R$ {(category.previous_period / 1000).toFixed(0)}k
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}