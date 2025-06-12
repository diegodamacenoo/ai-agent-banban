'use client';

import * as React from "react";
import { cn } from "@/lib/utils";
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

// Note: Using imported Skeleton component from @/components/ui/skeleton

// Skeleton para texto
export const SkeletonText = ({ 
  lines = 1, 
  className 
}: { 
  lines?: number; 
  className?: string; 
}) => (
  <div className={cn("space-y-2", className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        className={cn(
          "h-4",
          i === lines - 1 && lines > 1 ? "w-3/4" : "w-full"
        )}
      />
    ))}
  </div>
);

// Skeleton para avatar circular
export const SkeletonAvatar = ({ 
  size = "default",
  className 
}: { 
  size?: "sm" | "default" | "lg";
  className?: string;
}) => {
  const sizeClasses = {
    sm: "h-8 w-8",
    default: "h-10 w-10", 
    lg: "h-20 w-20"
  };

  return (
    <Skeleton 
      className={cn(
        "rounded-full",
        sizeClasses[size],
        className
      )} 
    />
  );
};

// Skeleton para botão
export const SkeletonButton = ({ 
  size = "default",
  className 
}: { 
  size?: "sm" | "default" | "lg";
  className?: string;
}) => {
  const sizeClasses = {
    sm: "h-8 w-16",
    default: "h-10 w-20",
    lg: "h-11 w-24"
  };

  return (
    <Skeleton 
      className={cn(
        "rounded-md",
        sizeClasses[size],
        className
      )} 
    />
  );
};

// Skeleton para card
export const SkeletonCard = ({ 
  className,
  children 
}: { 
  className?: string;
  children?: React.ReactNode;
}) => (
  <div className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)}>
    <div className="p-6 space-y-4">
      {children || (
        <>
          <div className="flex items-center space-x-4">
            <SkeletonAvatar />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <SkeletonText lines={3} />
          <div className="flex justify-end space-x-2">
            <SkeletonButton />
            <SkeletonButton />
          </div>
        </>
      )}
    </div>
  </div>
);

// Skeleton para form
export const SkeletonForm = ({ 
  fields = 4,
  className 
}: { 
  fields?: number;
  className?: string;
}) => (
  <div className={cn("space-y-6", className)}>
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-10 w-full" />
      </div>
    ))}
    <div className="flex justify-end space-x-2 pt-4">
      <SkeletonButton />
      <SkeletonButton />
    </div>
  </div>
);

// Skeleton para lista
export const SkeletonList = ({ 
  items = 5,
  className 
}: { 
  items?: number;
  className?: string;
}) => (
  <div className={cn("space-y-4", className)}>
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
        <SkeletonAvatar size="sm" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <SkeletonButton size="sm" />
      </div>
    ))}
  </div>
);

// Skeleton para tabela simples (renomeado para evitar conflito)
export const SkeletonSimpleTable = ({ 
  rows = 5,
  columns = 4,
  className 
}: { 
  rows?: number;
  columns?: number;
  className?: string;
}) => (
  <div className={cn("space-y-4", className)}>
    {/* Header */}
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-6 w-full" />
      ))}
    </div>
    
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div 
        key={rowIndex} 
        className="grid gap-4 border-b pb-2" 
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={colIndex} className="h-4 w-full" />
        ))}
      </div>
    ))}
  </div>
);

// Skeleton para dashboard/métricas
export const SkeletonMetrics = ({ 
  metrics = 4,
  className 
}: { 
  metrics?: number;
  className?: string;
}) => (
  <div className={cn("grid gap-4", className)} style={{ gridTemplateColumns: `repeat(${Math.min(metrics, 4)}, 1fr)` }}>
    {Array.from({ length: metrics }).map((_, i) => (
      <SkeletonCard key={i}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-6 w-12" />
          </div>
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </SkeletonCard>
    ))}
  </div>
);

// Skeleton para perfil específico
export const SkeletonProfile = ({ className }: { className?: string }) => (
  <SkeletonCard className={className}>
    <div className="flex flex-col md:flex-row gap-8 items-start">
      <SkeletonAvatar size="lg" />
      <div className="flex-1 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="flex justify-end">
          <SkeletonButton />
        </div>
      </div>
    </div>
  </SkeletonCard>
);

// Skeleton especializado para tabela de usuários
export const SkeletonUserTable = ({ 
  rows = 5,
  className 
}: { 
  rows?: number;
  className?: string;
}) => (
  <div className={cn("w-full", className)}>
    {/* Header da tabela */}
    <div className="flex items-center py-3 px-6 bg-muted/50 rounded-t-lg border-b">
      <Skeleton className="h-4 w-16 flex-1" />
      <Skeleton className="h-4 w-24 flex-1" />
      <Skeleton className="h-4 w-16 flex-1" />
      <Skeleton className="h-4 w-16 flex-1" />
      <Skeleton className="h-4 w-16 flex-1 text-right" />
    </div>
    
    {/* Rows da tabela */}
    <div className="border border-t-0 rounded-b-lg">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`user-row-${rowIndex}`} className="flex items-center py-4 px-6 border-b last:border-b-0">
          {/* Nome com avatar */}
          <div className="flex items-center gap-3 flex-1">
            <SkeletonAvatar size="sm" />
            <Skeleton className="h-4 w-24" />
          </div>
          
          {/* Email */}
          <div className="flex-1">
            <Skeleton className="h-4 w-32" />
          </div>
          
          {/* Perfil badge */}
          <div className="flex-1">
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          
          {/* Status badge */}
          <div className="flex-1">
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          
          {/* Ações */}
          <div className="flex justify-end space-x-2 flex-1">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Skeleton especializado para tabela de convites
export const SkeletonInviteTable = ({ 
  rows = 3,
  className 
}: { 
  rows?: number;
  className?: string;
}) => (
  <div className={cn("w-full", className)}>
    {/* Header da tabela */}
    <div className="flex items-center py-3 px-6 bg-muted/50 rounded-t-lg border-b">
      <Skeleton className="h-4 w-32 flex-1" />
      <Skeleton className="h-4 w-24 flex-1" />
      <Skeleton className="h-4 w-16 flex-1" />
      <Skeleton className="h-4 w-24 flex-1" />
      <Skeleton className="h-4 w-16 flex-1 text-right" />
    </div>
    
    {/* Rows da tabela */}
    <div className="border border-t-0 rounded-b-lg">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`invite-row-${rowIndex}`} className="flex items-center py-4 px-6 border-b last:border-b-0">
          <Skeleton className="h-4 w-40 flex-1" />
          <Skeleton className="h-4 w-24 flex-1" />
          <Skeleton className="h-6 w-20 rounded-full flex-1" />
          <Skeleton className="h-4 w-24 flex-1" />
          <div className="flex justify-end space-x-2 flex-1">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Skeleton especializado para tabela de sessões
export const SkeletonSessionTable = ({ 
  rows = 4,
  className 
}: { 
  rows?: number;
  className?: string;
}) => (
  <div className={cn("w-full", className)}>
    {/* Header da tabela */}
    <div className="flex items-center py-3 px-6 bg-muted/50 rounded-t-lg border-b">
      <Skeleton className="h-4 w-40 flex-1" />
      <Skeleton className="h-4 w-32 flex-1" />
      <Skeleton className="h-4 w-24 flex-1" />
      <Skeleton className="h-4 w-16 flex-1 text-right" />
    </div>
    
    {/* Rows da tabela */}
    <div className="border border-t-0 rounded-b-lg">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`session-row-${rowIndex}`} className="flex items-center py-4 px-6 border-b last:border-b-0">
          <div className="flex items-center gap-2 flex-1">
            <Skeleton className="h-4 w-32" />
            {rowIndex === 0 && <Skeleton className="h-4 w-20 rounded-full" />}
          </div>
          <Skeleton className="h-4 w-28 flex-1" />
          <Skeleton className="h-4 w-24 flex-1" />
          <div className="flex justify-end flex-1">
            {rowIndex !== 0 && <Skeleton className="h-7 w-20 rounded" />}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Skeleton especializado para logs de auditoria
export const SkeletonAuditTable = ({ 
  rows = 6,
  className 
}: { 
  rows?: number;
  className?: string;
}) => (
  <div className={cn("w-full border rounded-md overflow-hidden", className)}>
    {/* Header da tabela */}
    <div className="flex items-center py-3 px-6 bg-muted/50 border-b">
      <Skeleton className="h-4 w-24 flex-1" />
      <Skeleton className="h-4 w-16 flex-1" />
      <Skeleton className="h-4 w-32 flex-1" />
      <Skeleton className="h-4 w-24 flex-1" />
      <Skeleton className="h-4 w-28 flex-1" />
    </div>
    
    {/* Rows da tabela */}
    <div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`audit-row-${rowIndex}`} className="flex items-center py-4 px-6 border-b last:border-b-0">
          <Skeleton className="h-4 w-28 flex-1" />
          <Skeleton className="h-4 w-20 flex-1" />
          <Skeleton className="h-4 w-36 flex-1" />
          <Skeleton className="h-4 w-24 flex-1" />
          <Skeleton className="h-4 w-32 flex-1" />
        </div>
      ))}
    </div>
  </div>
);

// Skeleton para configurações de notificações/alertas
export const SkeletonNotificationSettings = ({ 
  items = 3,
  className 
}: { 
  items?: number;
  className?: string;
}) => (
  <div className={cn("space-y-6", className)}>
    {Array.from({ length: items }).map((_, index) => (
      <div key={`notification-${index}`} className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-6 w-11 rounded-full" />
        </div>
        {index < items - 1 && <Skeleton className="h-px w-full" />}
      </div>
    ))}
  </div>
);

// Skeleton para histórico de consentimentos
export const SkeletonConsentTable = ({ 
  rows = 4,
  className 
}: { 
  rows?: number;
  className?: string;
}) => (
  <div className={cn("w-full", className)}>
    {/* Header da tabela */}
    <div className="flex items-center py-3 px-6 bg-muted/50 rounded-t-lg border-b">
      <Skeleton className="h-4 w-40 flex-1" />
      <Skeleton className="h-4 w-16 flex-1" />
      <Skeleton className="h-4 w-32 flex-1" />
      <Skeleton className="h-4 w-20 flex-1" />
      <Skeleton className="h-4 w-28 flex-1" />
    </div>
    
    {/* Rows da tabela */}
    <div className="border border-t-0 rounded-b-lg">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`consent-row-${rowIndex}`} className="flex items-center py-4 px-6 border-b last:border-b-0">
          <Skeleton className="h-4 w-40 flex-1" />
          <Skeleton className="h-4 w-16 flex-1" />
          <Skeleton className="h-4 w-32 flex-1" />
          <Skeleton className="h-4 w-20 flex-1" />
          <Skeleton className="h-4 w-28 flex-1" />
        </div>
      ))}
    </div>
  </div>
);

// Skeleton para exportação de dados
export const SkeletonDataExport = ({ 
  className 
}: { 
  className?: string;
}) => (
  <div className={cn("space-y-6", className)}>
    {/* Info section */}
    <div className="flex items-start gap-3">
      <Skeleton className="h-5 w-5 rounded" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>
    </div>
    
    {/* Export options */}
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={`export-${index}`} className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-9 w-20" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Skeleton para preferências individuais
export const SkeletonPreferences = ({ 
  items = 4,
  className 
}: { 
  items?: number;
  className?: string;
}) => (
  <div className={cn("space-y-6", className)}>
    {Array.from({ length: items }).map((_, index) => (
      <div key={`preference-${index}`} className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-full" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, subIndex) => (
            <div key={`pref-item-${subIndex}`} className="flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-6 w-11 rounded-full" />
            </div>
          ))}
        </div>
        {index < items - 1 && <Skeleton className="h-px w-full" />}
      </div>
    ))}
  </div>
);

// Skeleton simples para loading estados gerais
export const SkeletonSimple = ({ 
  className,
  height = "h-32" 
}: { 
  className?: string;
  height?: string;
}) => (
  <div className={cn("flex items-center justify-center", height, className)}>
    <div className="space-y-3 text-center">
      <Skeleton className="h-8 w-8 rounded-full mx-auto" />
      <Skeleton className="h-3 w-24 mx-auto" />
    </div>
  </div>
);

// Skeleton para tabela de relatórios
export const SkeletonReportTable = ({ 
  rows = 5,
  className 
}: { 
  rows?: number;
  className?: string;
}) => (
  <div className={cn("space-y-6", className)}>
    {/* Estatísticas rápidas */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={`stat-${index}`} className="border rounded-lg p-4 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
    
    {/* Tabela */}
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center py-3 px-6 bg-muted/50 border-b">
        <Skeleton className="h-4 w-32 flex-1" />
        <Skeleton className="h-4 w-24 flex-1" />
        <Skeleton className="h-4 w-16 flex-1" />
        <Skeleton className="h-4 w-20 flex-1" />
      </div>
      
      {/* Rows */}
      <div>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`report-row-${rowIndex}`} className="flex items-center py-4 px-6 border-b last:border-b-0">
            <div className="flex items-center gap-2 flex-1">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-4 w-32 flex-1" />
            <Skeleton className="h-6 w-16 rounded-full flex-1" />
            <Skeleton className="h-8 w-20 flex-1" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Skeleton para grid de produtos do catálogo
export const SkeletonProductGrid = ({ 
  items = 6,
  className 
}: { 
  items?: number;
  className?: string;
}) => (
  <div className={cn("space-y-6", className)}>
    {/* Barra de pesquisa e filtros */}
    <div className="flex items-center gap-4">
      <Skeleton className="h-10 flex-1 max-w-md" />
      <Skeleton className="h-10 w-24" />
    </div>
    
    {/* Grid de produtos */}
    <div className="border rounded-lg overflow-hidden">
      {/* Header da tabela */}
      <div className="flex items-center py-3 px-6 bg-muted/50 border-b">
        <Skeleton className="h-4 w-32 flex-1" />
        <Skeleton className="h-4 w-20 flex-1" />
        <Skeleton className="h-4 w-16 flex-1" />
      </div>
      
      {/* Items */}
      <div>
        {Array.from({ length: items }).map((_, index) => (
          <div key={`product-${index}`} className="flex items-center py-4 px-6 border-b last:border-b-0">
            <div className="flex items-center gap-3 flex-1">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full flex-1" />
            <Skeleton className="h-8 w-16 flex-1" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Skeleton para lista de eventos
export const SkeletonEventList = ({ 
  items = 8,
  className 
}: { 
  items?: number;
  className?: string;
}) => (
  <div className={cn("space-y-4", className)}>
    {/* Header com contadores */}
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-10 w-24" />
    </div>
    
    {/* Lista de eventos */}
    <div className="border rounded-lg divide-y">
      {Array.from({ length: items }).map((_, index) => (
        <div key={`event-${index}`} className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              {/* Data e hora */}
              <div className="flex items-center gap-2 min-w-[140px]">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-20" />
              </div>
              
              {/* Tipo de evento */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
              
              {/* Entidade */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
            
            {/* Ação */}
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

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
        <SkeletonTable rows={5} cols={6} />
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

// Wrapper com Suspense para componentes
interface SuspenseWrapperProps {
  children: React.ReactNode;
  fallback: 'profile' | 'table' | 'alertas' | 'filters';
}

export function SuspenseWrapper({ children, fallback }: SuspenseWrapperProps) {
  const getFallback = () => {
    switch (fallback) {
      case 'profile':
        return <SkeletonKPICard />;
      case 'table':
        return <SkeletonTable />;
      case 'alertas':
        return <SkeletonAlertasPage />;
      case 'filters':
        return <SkeletonFilters />;
      default:
        return <SkeletonKPICard />;
    }
  };

  return (
    <React.Suspense fallback={getFallback()}>
      {children}
    </React.Suspense>
  );
}

export const SkeletonTable = ({ rows = 5, cols = 4, className }: { rows?: number; cols?: number; className?: string }) => (
  <div className={cn("space-y-2", className)}>
    {Array.from({ length: rows }).map((_, rowIdx) => (
      <div key={`row-${rowIdx}`} className="grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((__, colIdx) => (
          <Skeleton key={`cell-${rowIdx}-${colIdx}`} className="h-6 w-full" />
        ))}
      </div>
    ))}
  </div>
); 