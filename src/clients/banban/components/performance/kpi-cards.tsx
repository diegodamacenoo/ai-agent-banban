'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Percent,
  Package,
  Target,
  RotateCcw,
  AlertTriangle,
  Calendar,
  Crown
} from 'lucide-react';
import { PerformanceKPI } from '../mock-data';

interface KPICardsProps {
  kpis: PerformanceKPI[];
  className?: string;
}

const iconMap = {
  TrendingUp,
  Percent,
  Package,
  Target,
  RotateCcw,
  AlertTriangle,
  Calendar,
  Crown,
};

function formatValue(value: string, format: PerformanceKPI['format']) {
  switch (format) {
    case 'currency':
      return value;
    case 'percentage':
      return value;
    case 'days':
      return value;
    case 'number':
      return value;
    default:
      return value;
  }
}

function getStatusColor(status: PerformanceKPI['status']) {
  switch (status) {
    case 'success':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'warning':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'danger':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'info':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

function getTrendIcon(type: 'increase' | 'decrease' | 'neutral', value: number) {
  if (type === 'neutral' || value === 0) {
    return <Minus className="h-3 w-3" />;
  }
  
  return type === 'increase' ? (
    <TrendingUp className="h-3 w-3" />
  ) : (
    <TrendingDown className="h-3 w-3" />
  );
}

function getTrendColor(type: 'increase' | 'decrease' | 'neutral', status: PerformanceKPI['status']) {
  if (type === 'neutral') return 'text-gray-500';
  
  // Para alguns KPIs, diminuição é boa (ex: produtos em falta)
  if (status === 'danger' && type === 'decrease') return 'text-green-600';
  if (status === 'success' && type === 'decrease') return 'text-red-600';
  
  return type === 'increase' ? 'text-green-600' : 'text-red-600';
}

export function KPICards({ kpis, className = "" }: KPICardsProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {kpis.map((kpi) => {
        const IconComponent = iconMap[kpi.icon as keyof typeof iconMap] || TrendingUp;
        const statusColor = getStatusColor(kpi.status);
        const trendColor = getTrendColor(kpi.change.type, kpi.status);
        
        return (
          <Card key={kpi.id} className={`border-l-4 ${statusColor}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">
                {kpi.title}
              </CardTitle>
              <IconComponent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-gray-900">
                  {formatValue(kpi.value, kpi.format)}
                </div>
                
                <div className={`flex items-center gap-1 text-xs ${trendColor}`}>
                  {getTrendIcon(kpi.change.type, kpi.change.value)}
                  <span className="font-medium">
                    {Math.abs(kpi.change.value)}%
                  </span>
                  <span className="text-gray-500 ml-1">
                    {kpi.change.period}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export function KPISummary({ kpis }: { kpis: PerformanceKPI[] }) {
  const successCount = kpis.filter(kpi => kpi.status === 'success').length;
  const warningCount = kpis.filter(kpi => kpi.status === 'warning').length;
  const dangerCount = kpis.filter(kpi => kpi.status === 'danger').length;
  
  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="text-sm text-gray-600">
        Status dos KPIs:
      </div>
      <div className="flex items-center gap-2">
        {successCount > 0 && (
          <Badge variant="default" className="bg-green-100 text-green-700 border-green-200">
            {successCount} Positivos
          </Badge>
        )}
        {warningCount > 0 && (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-200">
            {warningCount} Atenção
          </Badge>
        )}
        {dangerCount > 0 && (
          <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200">
            {dangerCount} Críticos
          </Badge>
        )}
      </div>
    </div>
  );
}