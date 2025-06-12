"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"

// Definindo o tipo de dados para uma loja afetada
export type LocationData = {
  name: string;
  currentStock: number;
  suggestedTransfer: number;
}

export const columns: ColumnDef<LocationData>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Loja
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "currentStock",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Estoque Atual
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="text-center">{row.getValue("currentStock")}</div>,
  },
  {
    accessorKey: "suggestedTransfer",
    header: ({ column }) => {
      return (
        <div className="text-right">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Transferência Sugerida
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        </div>
      )
    },
    cell: ({ row }) => {
      const transfer = row.getValue("suggestedTransfer") as number
      const color = transfer > 0 ? "text-green-600" : "text-red-600";
      const sign = transfer > 0 ? "+" : "";

      return <div className={`text-right font-medium ${color}`}>{sign}{transfer}</div>
    },
  },
] 