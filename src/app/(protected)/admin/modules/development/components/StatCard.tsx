'use client';

import { Card, CardContent } from '@/shared/ui/card';
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SparkLineChart } from './SparkLineChart';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    direction: 'up' | 'down';
  };
  chartData?: { value: number }[];
  chartColor?: string;
  status?: 'positive' | 'negative' | 'neutral' | 'warning';
  onClick?: () => void;
  className?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  chartData,
  chartColor,
  status = 'neutral',
  onClick,
  className
}: StatCardProps) {
  const getStatusStyles = (status: StatCardProps['status']) => {
    switch (status) {
      case 'positive': return { iconColor: 'text-green-600', iconBg: 'bg-green-100', trendColor: 'text-green-600', chart: '#16a34a' };
      case 'negative': return { iconColor: 'text-red-600', iconBg: 'bg-red-100', trendColor: 'text-red-600', chart: '#dc2626' };
      case 'warning': return { iconColor: 'text-yellow-600', iconBg: 'bg-yellow-100', trendColor: 'text-yellow-600', chart: '#f59e0b' };
      default: return { iconColor: 'text-blue-600', iconBg: 'bg-blue-100', trendColor: 'text-blue-600', chart: '#3b82f6' };
    }
  };

  const styles = getStatusStyles(status);
  const TrendIcon = trend?.direction === 'up' ? TrendingUp : TrendingDown;

  return (
    <Card 
      className={cn(
        'transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 flex-1 flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">
              {title}
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-3xl font-bold text-gray-800">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </p>
              {trend && (
                <div className={cn('flex items-center gap-0.5 text-sm font-semibold', styles.trendColor)}>
                  <TrendIcon className="h-4 w-4" />
                  <span>{trend.value}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', styles.iconBg)}>
            <Icon className={cn('h-5 w-5', styles.iconColor)} />
          </div>
        </div>

        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}

        {chartData && chartData.length > 0 && (
          <div className="mt-4">
            <SparkLineChart data={chartData} color={chartColor || styles.chart} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}