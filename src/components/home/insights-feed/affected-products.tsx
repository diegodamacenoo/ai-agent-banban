"use client"

import { DataTable } from "@/components/ui/data-table"
import { columns, type ProductData } from "./affected-products-columns"
import { Card } from "@/components/ui/card"
import { Package } from "lucide-react"

interface AffectedProductsProps {
  insightId: string;
  products: ProductData[]
}

export function AffectedProducts({ products, insightId }: AffectedProductsProps) {
  if (!products || products.length === 0) return null

  return (
    <Card className="p-4">
      <h3 className="flex items-center gap-2 font-medium mb-3">
        <Package className="h-4 w-4" />
        Produtos Afetados
      </h3>
      <DataTable
        columns={columns}
        data={products}
        filterColumn="name"
        filterPlaceholder="Filtrar por nome do produto..."
      />
    </Card>
  )
} 