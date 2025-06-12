"use client"

import { Badge } from "@/components/ui/badge"
import { PriorityBadge } from "./priority-badge"
import { highlightKeywords } from "./text-highlighter"
import { Insight } from "@/types/insights"

interface InsightSummaryProps {
  insight: Insight
  category: string
}

export function InsightSummary({ insight, category }: InsightSummaryProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <PriorityBadge priority={insight.priority} />
        <Badge variant="outline" className="px-3 py-1.5 rounded-full">{category}</Badge>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {highlightKeywords(insight.description)}
      </p>
    </div>
  )
} 