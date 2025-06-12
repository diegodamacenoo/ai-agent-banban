"use client"

import { Card } from "@/components/ui/card"
import { highlightKeywords } from "./text-highlighter"
import { ContextualDataMapper } from "./contextual-data-mapper"
import { BarChart3, LineChart, TrendingUp, TrendingDown, Target } from "lucide-react"
import { 
  ResponsiveContainer, 
  LineChart as RechartsLineChart, 
  BarChart as RechartsBarChart,
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  Line, 
  Bar,
  CartesianGrid
} from 'recharts';

// Simplificando a interface para receber apenas um gráfico
interface PrimaryChart {
    id: string
    title: string
    type: 'line' | 'bar' | 'progress' | 'trend'
    description: string
    data: any
    insights: string[]
    color: string
}

interface InsightAnalyticsProps {
  insightId: string
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-background/80 border rounded-lg shadow-lg">
        <p className="label font-bold">{`${label}`}</p>
        {payload.map((pld: any, index: number) => (
          <p key={index} style={{ color: pld.color }}>{`${pld.name}: ${pld.value}`}</p>
        ))}
      </div>
    );
  }
  return null;
};

export function InsightAnalytics({ insightId }: InsightAnalyticsProps) {
  // Obter apenas o gráfico principal
  const contextualData = ContextualDataMapper.getContextualAnalyticsData(insightId)
  const primaryChart = contextualData.charts[0] as PrimaryChart

  if (!primaryChart) return null

  // Funções de renderização para tipos de gráficos não-recharts (progress, trend)
  const renderProgressChart = (chart: PrimaryChart) => {
    // Implementação original mantida como fallback
    return <div className="text-sm text-muted-foreground text-center p-4">Gráficos de Progresso em breve.</div>
  }

  const renderTrendChart = (chart: PrimaryChart) => {
    // Implementação original mantida como fallback
    return <div className="text-sm text-muted-foreground text-center p-4">Gráficos de Tendência em breve.</div>
  }

  const renderChart = (chart: PrimaryChart) => {
    // A verificação de segurança foi removida, pois a estrutura de dados foi corrigida na fonte.
    if (!chart.data || !Array.isArray(chart.data) || chart.data.length === 0) {
      return <div className="text-sm text-muted-foreground text-center p-4 h-[250px] flex items-center justify-center">Dados para o gráfico estão vazios ou em formato inválido.</div>
    }

    const firstDataItem = chart.data[0];
    if (typeof firstDataItem !== 'object' || firstDataItem === null) {
      return <div className="text-sm text-muted-foreground text-center p-4 h-[250px] flex items-center justify-center">O formato dos dados do gráfico é inválido.</div>
    }
    
    const dataKey = Object.keys(firstDataItem).find(k => k !== 'name' && k !== 'month' && k !== 'date' && k !== 'label' && k !== 'day' && k !== 'week') || 'value';
    const xAxisKey = Object.keys(firstDataItem).find(k => k === 'name' || k === 'month' || k === 'date' || k === 'label' || k === 'day' || k === 'week') || 'name';

    switch (chart.type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={250}>
            <RechartsLineChart data={chart.data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.5} />
              <XAxis dataKey={xAxisKey} fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line type="monotone" dataKey={dataKey} stroke={chart.color} strokeWidth={2} activeDot={{ r: 8 }} name={chart.title} />
            </RechartsLineChart>
          </ResponsiveContainer>
        )
      case 'bar':
         return (
          <ResponsiveContainer width="100%" height={250}>
            <RechartsBarChart data={chart.data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.5} />
              <XAxis dataKey={xAxisKey} fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey={dataKey} fill={chart.color} name={chart.title} />
            </RechartsBarChart>
          </ResponsiveContainer>
        )
      case 'progress':
        return renderProgressChart(chart)
      case 'trend':
        return renderTrendChart(chart)
      default:
        return <div className="text-sm text-muted-foreground text-center p-4">Tipo de gráfico '{chart.type}' ainda não é suportado.</div>
    }
  }

  return (
    <Card className="space-y-3 p-4 shadow-none">
      {/* Header do Gráfico */}
      <div className="space-y-1">
        <h3 className="font-medium flex items-center gap-2">
          {primaryChart.type === 'line' ? <LineChart className="h-4 w-4" /> : <BarChart3 className="h-4 w-4" />}
          {highlightKeywords(primaryChart.title)}
        </h3>
        <p className="text-sm text-muted-foreground">
          {primaryChart.description}
        </p>
      </div>

      {/* Renderiza o Gráfico Principal */}
      <div>
        {renderChart(primaryChart)}
      </div>
    </Card>
  )
} 