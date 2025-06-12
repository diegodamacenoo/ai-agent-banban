'use client';

import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Skeleton para cards de KPI
export function SkeletonKPICard() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Skeleton className="w-4 h-4 rounded-full" />
          <Skeleton className="w-24 h-4" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Skeleton className="w-16 h-8" />
      </CardContent>
    </Card>
  );
}

// Skeleton para tabelas de alertas
export function SkeletonAlertTable({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {Array.from({ length: cols }).map((_, index) => (
            <TableHead key={index}>
              <Skeleton className="w-20 h-4" />
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <TableRow key={rowIndex}>
            {Array.from({ length: cols }).map((_, colIndex) => (
              <TableCell key={colIndex}>
                {colIndex === 0 ? (
                  // Primeira coluna: produto
                  <div>
                    <Skeleton className="w-32 h-4 mb-1" />
                    <Skeleton className="w-24 h-3" />
                  </div>
                ) : colIndex === cols - 2 ? (
                  // Penúltima coluna: badge/status
                  <Skeleton className="w-16 h-6 rounded-full" />
                ) : (
                  // Outras colunas: texto simples
                  <Skeleton className="w-16 h-4" />
                )}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// Skeleton para seção de alertas
export function SkeletonAlertSection() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Skeleton className="w-5 h-5" />
              <Skeleton className="w-32 h-5" />
              <Badge variant="outline">
                <Skeleton className="w-4 h-4" />
              </Badge>
            </CardTitle>
            <CardDescription>
              <Skeleton className="w-48 h-4 mt-1" />
            </CardDescription>
          </div>
          <Skeleton className="w-20 h-8" />
        </div>
      </CardHeader>
      <CardContent>
        <SkeletonAlertTable rows={5} cols={6} />
      </CardContent>
    </Card>
  );
}

// Skeleton para filtros
export function SkeletonFilters() {
  return (
    <div className="flex gap-4 mb-6">
      <Skeleton className="w-48 h-10" /> {/* Search input */}
      <Skeleton className="w-32 h-10" /> {/* Filter dropdown */}
      <Skeleton className="w-28 h-10" /> {/* Sort dropdown */}
      <Skeleton className="w-24 h-10" /> {/* Export button */}
    </div>
  );
}

// Skeleton para página completa de alertas
export function SkeletonAlertasPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="w-48 h-8 mb-2" />
          <Skeleton className="w-64 h-4" />
        </div>
        <Skeleton className="w-32 h-4" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonKPICard key={index} />
        ))}
      </div>

      {/* Filtros */}
      <SkeletonFilters />

      {/* Alert Sections */}
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <SkeletonAlertSection key={index} />
        ))}
      </div>
    </div>
  );
}

// Hook para delayed loading (evitar flashes)
export function useDelayedLoading(loading: boolean, delay = 300) {
  const [showLoading, setShowLoading] = React.useState(false);

  React.useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (loading) {
      timeoutId = setTimeout(() => {
        setShowLoading(true);
      }, delay);
    } else {
      setShowLoading(false);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [loading, delay]);

  return showLoading;
} 