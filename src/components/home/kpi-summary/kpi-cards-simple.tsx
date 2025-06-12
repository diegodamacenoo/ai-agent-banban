"use client"

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, DollarSign, Package, Target, Zap } from "lucide-react"

interface Metrics {
  sales: number
  margin: number
  cover_days: number
  sell_through: number
}

interface KPICardsSimpleProps {
  metrics: Metrics
}

export function KPICardsSimple({ metrics }: KPICardsSimpleProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Total de Vendas */}
      <Card className="relative overflow-hidden border-l-4 border-l-green-500">
        <CardHeader className="pb-2">
          <CardDescription className="text-xs text-muted-foreground">Vendas</CardDescription>
          <CardTitle className="text-xl font-bold">
            {metrics.sales > 1000 ? `R$ ${(metrics.sales / 1000).toFixed(0)}k` : `R$ ${metrics.sales.toFixed(2)}`}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="text-xs px-1 py-0">
              <TrendingUp className="size-3 mr-1" />
              +18%
            </Badge>
          </div>
        </CardHeader>
        <div className="absolute top-2 right-2">
          <DollarSign className="size-4 text-green-500" />
        </div>
      </Card>

      {/* Margem */}
      <Card className="relative overflow-hidden border-l-4 border-l-blue-500">
        <CardHeader className="pb-2">
          <CardDescription className="text-xs text-muted-foreground">Margem</CardDescription>
          <CardTitle className="text-xl font-bold">
            {metrics.margin.toFixed(1)}%
          </CardTitle>
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="text-xs px-1 py-0">
              <TrendingUp className="size-3 mr-1" />
              +2.3%
            </Badge>
          </div>
        </CardHeader>
        <div className="absolute top-2 right-2">
          <Target className="size-4 text-blue-500" />
        </div>
      </Card>

      {/* Dias de Cobertura */}
      <Card className="relative overflow-hidden border-l-4 border-l-orange-500">
        <CardHeader className="pb-2">
          <CardDescription className="text-xs text-muted-foreground">Cobertura</CardDescription>
          <CardTitle className="text-xl font-bold">
            {metrics.cover_days.toFixed(0)} dias
          </CardTitle>
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="text-xs px-1 py-0">
              <TrendingDown className="size-3 mr-1" />
              -3 dias
            </Badge>
          </div>
        </CardHeader>
        <div className="absolute top-2 right-2">
          <Package className="size-4 text-orange-500" />
        </div>
      </Card>

      {/* Sell-through */}
      <Card className="relative overflow-hidden border-l-4 border-l-purple-500">
        <CardHeader className="pb-2">
          <CardDescription className="text-xs text-muted-foreground">Sell-through</CardDescription>
          <CardTitle className="text-xl font-bold">
            {metrics.sell_through.toFixed(1)}%
          </CardTitle>
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="text-xs px-1 py-0">
              <TrendingUp className="size-3 mr-1" />
              +5.2%
            </Badge>
          </div>
        </CardHeader>
        <div className="absolute top-2 right-2">
          <Zap className="size-4 text-purple-500" />
        </div>
      </Card>
    </div>
  )
} 