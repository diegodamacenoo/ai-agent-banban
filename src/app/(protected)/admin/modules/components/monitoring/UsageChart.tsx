'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { TrendingUp, BarChart3 } from 'lucide-react';
import type { UsageChartData } from '../../types/module-details';

interface UsageChartProps {
  data: UsageChartData[];
  moduleId: string;
  detailed?: boolean;
}

export default function UsageChart({ data, moduleId, detailed = false }: UsageChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Uso nos Últimos 7 Dias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Não há dados de uso disponíveis
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalRequests = data.reduce((sum, day) => sum + day.requests, 0);
  const avgResponseTime = data.reduce((sum, day) => sum + day.response_time, 0) / data.length;
  const maxRequests = Math.max(...data.map(d => d.requests));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart3 className="w-5 h-5 mr-2" />
          Uso nos Últimos 7 Dias
        </CardTitle>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Total Requests:</span>
            <div className="font-bold text-blue-600">{totalRequests.toLocaleString()}</div>
          </div>
          <div>
            <span className="text-gray-500">Tempo Médio:</span>
            <div className="font-bold text-green-600">{Math.round(avgResponseTime)}ms</div>
          </div>
          <div>
            <span className="text-gray-500">Pico:</span>
            <div className="font-bold text-purple-600">{maxRequests} req/dia</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {data.map((day) => {
            const requestsHeight = (day.requests / maxRequests) * 100;
            
            return (
              <div key={day.date} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {new Date(day.date).toLocaleDateString('pt-BR', { 
                      weekday: 'short', 
                      day: '2-digit', 
                      month: '2-digit' 
                    })}
                  </span>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>{day.requests} requests</span>
                    <span>{day.response_time}ms</span>
                    <span>{day.unique_users} usuários</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-400 w-16">Requests</span>
                  <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${requestsHeight}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}