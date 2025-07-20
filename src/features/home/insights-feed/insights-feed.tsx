'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { InsightType, type Insight } from './insights-processor';
import { AlertTriangle, TrendingUp, Package, Truck, BarChart2 } from 'lucide-react';

interface InsightsFeedProps {
  insights: Insight[];
}

const InsightIcon = ({ type }: { type: InsightType }) => {
  switch (type) {
    case InsightType.SALES_TREND:
      return <TrendingUp className="h-4 w-4" />;
    case InsightType.STOCK_ALERT:
      return <Package className="h-4 w-4" />;
    case InsightType.SUPPLIER_PERFORMANCE:
      return <Truck className="h-4 w-4" />;
    case InsightType.ABC_ANALYSIS:
      return <BarChart2 className="h-4 w-4" />;
    case InsightType.FORECAST_ALERT:
      return <AlertTriangle className="h-4 w-4" />;
    default:
      return null;
  }
};

const SeverityBadge = ({ severity }: { severity: Insight['severity'] }) => {
  const variants = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800'
  };

  return (
    <Badge variant="outline" className={variants[severity]}>
      {severity === 'low' ? 'Baixa' : severity === 'medium' ? 'Média' : 'Alta'}
    </Badge>
  );
};

export function InsightsFeed({ insights }: InsightsFeedProps) {
  const [filteredInsights, setFilteredInsights] = useState<Insight[]>(insights);
  const [activeFilter, setActiveFilter] = useState<InsightType | 'all'>('all');

  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredInsights(insights);
    } else {
      setFilteredInsights(insights.filter(insight => insight.type === activeFilter));
    }
  }, [activeFilter, insights]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Insights</CardTitle>
        <CardDescription>
          Análises e recomendações baseadas nos dados do seu negócio
        </CardDescription>
        <div className="flex gap-2 overflow-x-auto py-2">
          <Button
            variant={activeFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('all')}
          >
            Todos
          </Button>
          {Object.values(InsightType).map(type => (
            <Button
              key={type}
              variant={activeFilter === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter(type)}
              className="flex items-center gap-2"
            >
              <InsightIcon type={type} />
              {type === InsightType.SALES_TREND ? 'Vendas' :
               type === InsightType.STOCK_ALERT ? 'Estoque' :
               type === InsightType.SUPPLIER_PERFORMANCE ? 'Fornecedores' :
               type === InsightType.ABC_ANALYSIS ? 'Análise ABC' :
               'Previsões'}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {filteredInsights.map((insight, index) => (
              <Card key={index} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <InsightIcon type={insight.type} />
                      <CardTitle className="text-sm font-medium">
                        {insight.title}
                      </CardTitle>
                    </div>
                    <SeverityBadge severity={insight.severity} />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {insight.description}
                  </p>
                  {insight.actionable && insight.action_url && insight.action_label && (
                    <div className="mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => window.location.href = insight.action_url!}
                      >
                        {insight.action_label}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
} 