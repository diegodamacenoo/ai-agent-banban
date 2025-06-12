"use client"

import { Button } from "@/components/ui/button"
import { highlightKeywords } from "./text-highlighter"
import { BarChart3, TrendingUp, Info } from "lucide-react"
import { Card } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { type ContextualFinancialMetrics, type ContextualMetadata } from "./contextual-data-mapper"

interface InsightMetaGridProps {
  metadata: ContextualMetadata;
  financials: ContextualFinancialMetrics;
  onShowAnalytics?: () => void
}

export function InsightMetaGrid({ metadata, financials, onShowAnalytics }: InsightMetaGridProps) {
  return (
    <Card className="space-y-4 p-4 shadow-none">
      <div className="flex items-center justify-between">
        <h3 className="font-medium flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Informações Gerais
        </h3>
        {onShowAnalytics && (
          <Button variant="outline" size="sm" onClick={onShowAnalytics}>
            <TrendingUp className="h-4 w-4 mr-1" />
            Ver Gráficos
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Impacto</span>
          <p className={`font-medium ${metadata.impactColor || ''}`}>
            {metadata.timelineIcon && (
              <span className="mr-1">{metadata.timelineIcon}</span>
            )}
            {highlightKeywords(metadata.impact)}
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">Prazo</span>
          <p className="font-medium">{highlightKeywords(metadata.timeline)}</p>
        </div>
      </div>

      {/* KPIs Financeiros Contextualizados */}
      <div className="mt-4 p-3 border bg-zinc-50 dark:bg-gray-800/50 rounded-lg">
        <h4 className="text-sm font-medium mb-3">Métricas Financeiras</h4>
        <TooltipProvider>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {/* Métrica 1 */}
            <div>
              <span className="text-muted-foreground flex items-center gap-1">
                {financials.label1}
                {financials.description1 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">{financials.description1}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </span>
              <p className={`font-medium ${financials.color1 || ''}`}>
                {financials.value1}
              </p>
            </div>
            {/* Métrica 2 */}
            <div>
              <span className="text-muted-foreground flex items-center gap-1">
                {financials.label2}
                {financials.description2 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">{financials.description2}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </span>
              <p className={`font-medium ${financials.color2 || ''}`}>
                {financials.value2}
              </p>
            </div>
            {/* Métrica 3 */}
            <div>
              <span className="text-muted-foreground flex items-center gap-1">
                {financials.label3}
                {financials.description3 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">{financials.description3}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </span>
              <p className={`font-medium ${financials.color3 || ''}`}>
                {financials.value3}
              </p>
            </div>
            {/* Métrica 4 */}
            <div>
              <span className="text-muted-foreground flex items-center gap-1">
                {financials.label4}
                {financials.description4 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">{financials.description4}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </span>
              <p className={`font-medium ${financials.color4 || ''}`}>
                {financials.value4}
              </p>
            </div>
          </div>
        </TooltipProvider>
      </div>
    </Card>
  )
} 