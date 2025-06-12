"use client"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Priority } from "@/types/insights";

const priorityConfig = {
  critical: { label: "Crítico", className: "bg-red-500 shadow-none hover:bg-red-500" },
  attention: { label: "Atenção", className: "bg-yellow-200 text-yellow-800 shadow-none hover:bg-yellow-200" },
  warning: { label: "Moderado", className: "bg-orange-200 text-orange-800 shadow-none hover:bg-orange-200" },
  opportunity: { label: "Oportunidade", className: "bg-blue-200 text-blue-800 shadow-none hover:bg-blue-200" },
  info: { label: "Informativo", className: "bg-gray-200 text-gray-800 shadow-none hover:bg-gray-200" },
  success: { label: "Conquista", className: "bg-green-200 text-green-800 shadow-none hover:bg-green-200" }
};

interface PriorityBadgeProps {
  priority: Priority
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = priorityConfig[priority]

  if (!config) {
    return null
  }

  return (
    <Badge className={cn(
      "text-white text-xs font-medium px-3 py-1 rounded-full",
      config.className
    )}>
      {config.label}
    </Badge>
  )
}