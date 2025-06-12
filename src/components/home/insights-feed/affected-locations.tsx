"use client"

import { DataTable } from "@/components/ui/data-table"
import { columns, type LocationData } from "./affected-locations-columns"
import { Card } from "@/components/ui/card"
import { MapPin } from "lucide-react"

interface AffectedLocationsProps {
  insightId: string
  locations: LocationData[]
}

export function AffectedLocations({ locations, insightId }: AffectedLocationsProps) {
  if (!locations || locations.length === 0) return null

  // A prop insightId é mantida para uso futuro na contextualização da tabela
  return (
    <Card className="p-4">
      <h3 className="flex items-center gap-2 font-medium mb-3">
        <MapPin className="h-4 w-4" />
        Lojas Afetadas
      </h3>
      <DataTable
        columns={columns}
        data={locations}
        filterColumn="name"
        filterPlaceholder="Filtrar por nome da loja..."
      />
    </Card>
  )
} 