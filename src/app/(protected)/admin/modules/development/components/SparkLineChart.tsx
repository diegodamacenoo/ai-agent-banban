'use client';

import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

interface SparkLineChartProps {
  data: { value: number }[];
  color?: string;
  className?: string;
}

export function SparkLineChart({ data, color = '#3b82f6', className }: SparkLineChartProps) {
  return (
    <div className={cn('w-full h-12', className)}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
        >
          <defs>
            <linearGradient id="sparkline-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.4}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke={color}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#sparkline-gradient)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
