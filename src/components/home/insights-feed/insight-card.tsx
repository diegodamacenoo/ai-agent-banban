"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PriorityBadge } from "./priority-badge"
import { InsightDrawer } from "./insight-drawer"
import { highlightKeywords } from "./text-highlighter"
import { Insight } from "@/types/insights"
import {
  Package,
  AlertTriangle,
  DollarSign,
  Shuffle,
  TrendingUp,
  Award,
  MoreVertical,
  EyeOff,
  Clock,
  Eye,
  Ellipsis,
  Undo2,
  TrendingDown,
  Tag,
} from 'lucide-react'

// Mapeamento de ícones no lado do cliente
const iconMap = {
  'package': Package,
  'alert-triangle': AlertTriangle,
  'dollar-sign': DollarSign,
  'shuffle': Shuffle,
  'trending-up': TrendingUp,
  'award': Award,
  'undo-2': Undo2,
  'trending-down': TrendingDown,
  'clock': Clock,
  'tag': Tag,
}

interface InsightCardProps {
  insight: Insight
  onIgnore?: (insightId: string) => void
  onPostpone?: (insightId: string) => void
  onRestore?: (insightId: string) => void
  showActions?: boolean
  showRestoreActions?: boolean
}

export function InsightCard({ 
  insight, 
  onIgnore, 
  onPostpone, 
  onRestore, 
  showActions = true,
  showRestoreActions = false 
}: InsightCardProps) {
  const { description, priority, icon: iconName, actions } = insight
  const Icon = iconMap[iconName]
  const [drawerOpen, setDrawerOpen] = useState(false)

  const handleOpenDrawer = () => {
    setDrawerOpen(true)
  }

  const handleIgnore = () => {
    onIgnore?.(insight.id)
  }

  const handlePostpone = () => {
    onPostpone?.(insight.id)
  }

  const handleRestore = () => {
    onRestore?.(insight.id)
  }

  return (
    <>
      <Card className="flex flex-col h-full shadow border-none">
        <CardHeader className="p-5">
          <CardTitle className="text-sm font-normal">
            {highlightKeywords(description)}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-grow">
          {/* O conteúdo principal já está na descrição, pode adicionar mais se necessário */}
        </CardContent>
        <CardFooter className="flex justify-between items-center mt-auto pt-4">
          <div className="flex items-center gap-3">
            <Icon className="size-5" />
            <PriorityBadge priority={priority} />
          </div>
          
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={handleOpenDrawer}>
              <Eye className="size-4" />
            </Button>
            
            {showRestoreActions && (
              <Button variant="ghost" size="sm" onClick={handleRestore}>
                <Undo2 className="size-4" />
              </Button>
            )}
            
            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                    <Ellipsis className="h-4 w-4" />
                    <span className="sr-only">Mais opções</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleIgnore} className="flex items-center gap-2">
                    <EyeOff className="h-4 w-4" />
                    Ignorar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handlePostpone} className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Postergar em 2 dias
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardFooter>
      </Card>

      <InsightDrawer 
        insight={insight}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </>
  )
} 