"use client"

import { Insight } from "@/types/insights"
import { InsightCard } from "./insight-card"

interface InsightsFeedProps {
  insights: Insight[]
  onIgnore?: (insightId: string) => void
  onPostpone?: (insightId: string) => void
  onRestore?: (insightId: string) => void
  showActions?: boolean
  showRestoreActions?: boolean
}

export function InsightsFeed({ 
  insights, 
  onIgnore, 
  onPostpone, 
  onRestore, 
  showActions = true,
  showRestoreActions = false 
}: InsightsFeedProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {insights.map((insight, index) => (
        <div
          key={insight.id}
          className="card-animate"
          style={{ 
            animationDelay: `${2500 + index * 100}ms`
          }}
        >
          <InsightCard 
            insight={insight}
            onIgnore={onIgnore}
            onPostpone={onPostpone}
            onRestore={onRestore}
            showActions={showActions}
            showRestoreActions={showRestoreActions}
          />
        </div>
      ))}
    </div>
  )
} 