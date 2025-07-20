'use client';

import { useState } from 'react';
import { X, Package, Store, Calendar, AlertTriangle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerDescription,
  DrawerClose 
} from '@/shared/ui/drawer';
import { cn } from '@/shared/utils/utils';
import { Insight } from '../types';

interface InsightDrawerProps {
  insight: Insight | null;
  isOpen: boolean;
  onClose: () => void;
  onStartChat?: (insight: Insight) => void;
}

const getInsightColors = (type: string) => {
  switch (type) {
    case 'critical':
      return {
        badge: 'destructive',
        bg: 'bg-red-50',
        text: 'text-red-800',
        border: 'border-red-200',
        label: 'CRÍTICO'
      };
    case 'attention':
      return {
        badge: 'outline',
        bg: 'bg-amber-50',
        text: 'text-amber-800', 
        border: 'border-amber-200',
        label: 'ATENÇÃO'
      };
    case 'moderate':
      return {
        badge: 'secondary',
        bg: 'bg-blue-50',
        text: 'text-blue-800',
        border: 'border-blue-200',
        label: 'MODERADO'
      };
    case 'opportunity':
      return {
        badge: 'outline',
        bg: 'bg-green-50',
        text: 'text-green-800',
        border: 'border-green-200', 
        label: 'OPORTUNIDADE'
      };
    case 'achievement':
      return {
        badge: 'secondary',
        bg: 'bg-purple-50',
        text: 'text-purple-800',
        border: 'border-purple-200',
        label: 'CONQUISTA'
      };
    default:
      return {
        badge: 'outline',
        bg: 'bg-background',
        text: 'text-foreground',
        border: 'border-border',
        label: 'INFO'
      };
  }
};

const mockChartData = {
  stockLevels: [
    { date: '15/Jun', level: 45 },
    { date: '20/Jun', level: 38 },
    { date: '25/Jun', level: 28 },
    { date: '30/Jun', level: 12 },
    { date: 'Hoje', level: 2 }
  ],
  salesTrend: [
    { date: '26/Jun', sales: 2 },
    { date: '27/Jun', sales: 4 },
    { date: '28/Jun', sales: 6 },
    { date: '29/Jun', sales: 8 },
    { date: '30/Jun', sales: 3 }
  ]
};

export function InsightDrawer({ insight, isOpen, onClose, onStartChat }: InsightDrawerProps) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!insight) {
    return null;
  }

  const colors = getInsightColors(insight.type);

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()} direction="right">
      <DrawerContent className="w-full max-w-2xl">
        <DrawerHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={colors.badge as any} className={cn('text-xs font-semibold', colors.text)}>
                  {colors.label}
                </Badge>
                {insight.isNew && (
                  <span className="text-xs text-red-600 font-medium">🔥 Novo hoje</span>
                )}
                {insight.isConnected && (
                  <span className="text-xs text-blue-600 font-medium">↗️ CONECTADO</span>
                )}
              </div>
              <DrawerTitle className="text-xl font-semibold">
                {insight.title}
              </DrawerTitle>
              <DrawerDescription className="text-sm">
                {insight.naturalLanguageText}
              </DrawerDescription>
            </div>
            <DrawerClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="data">Dados</TabsTrigger>
              <TabsTrigger value="actions">Ações</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              {/* Resumo */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Análise Detalhada</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {insight.type === 'critical' && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="font-medium">Situação Crítica</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        O estoque destes produtos atingiu níveis críticos devido a um aumento inesperado nas vendas. 
                        Com base no padrão atual de vendas, você tem aproximadamente 16 horas antes do estoque zero.
                      </p>
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                          <div className="text-lg font-semibold text-red-600">16h</div>
                          <div className="text-xs text-red-600">até estoque zero</div>
                        </div>
                        <div className="text-center p-3 bg-amber-50 rounded-lg border border-amber-200">
                          <div className="text-lg font-semibold text-amber-600">40%</div>
                          <div className="text-xs text-amber-600">aumento nas vendas</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {insight.type === 'opportunity' && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-green-600">
                        <TrendingUp className="h-4 w-4" />
                        <span className="font-medium">Oportunidade Identificada</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Este produto similar está com 40% mais procura que o normal. É o momento ideal para 
                        promovê-lo enquanto os produtos relacionados estão em falta.
                      </p>
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="text-lg font-semibold text-green-600">R$ 15k</div>
                          <div className="text-xs text-green-600">receita potencial</div>
                        </div>
                        <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="text-lg font-semibold text-blue-600">7 dias</div>
                          <div className="text-xs text-blue-600">janela de oportunidade</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {insight.type === 'achievement' && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-purple-600">
                        <TrendingUp className="h-4 w-4" />
                        <span className="font-medium">Meta Superada!</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Parabéns! Você superou a meta mensal com 5 dias de antecedência. A categoria 
                        Moda Feminina foi a que mais contribuiu para este resultado.
                      </p>
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                          <div className="text-lg font-semibold text-purple-600">112%</div>
                          <div className="text-xs text-purple-600">da meta alcançada</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="text-lg font-semibold text-green-600">5 dias</div>
                          <div className="text-xs text-green-600">antes do prazo</div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Gráfico Simplificado */}
              {insight.type === 'critical' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Evolução do Estoque</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {mockChartData.stockLevels.map((item, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-12">{item.date}</span>
                          <div className="flex-1 bg-muted rounded-full h-2">
                            <div 
                              className={cn(
                                "h-2 rounded-full transition-all duration-300",
                                item.level < 10 ? "bg-red-500" : 
                                item.level < 30 ? "bg-amber-500" : "bg-green-500"
                              )}
                              style={{ width: `${Math.max(item.level, 5)}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium w-8">{item.level}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="data" className="space-y-6 mt-6">
              {/* Produtos Afetados */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Produtos Afetados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {insight.data.products?.map((product, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm font-medium">{product}</span>
                        <div className="flex items-center gap-2">
                          {insight.type === 'critical' && (
                            <Badge variant="destructive" className="text-xs">2 unidades</Badge>
                          )}
                          {insight.type === 'opportunity' && (
                            <Badge variant="outline" className="text-xs text-green-600">+40% demanda</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Lojas Afetadas */}
              {insight.data.stores && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Store className="h-4 w-4" />
                      Lojas Afetadas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {insight.data.stores.map((store, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <span className="text-sm font-medium">{store}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Status:</span>
                            {insight.type === 'critical' ? (
                              <Badge variant="destructive" className="text-xs">Crítico</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">Normal</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Métricas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Métricas Detalhadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(insight.data.metrics || {}).map(([key, value]) => (
                      <div key={key} className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-lg font-semibold">{value}</div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="actions" className="space-y-6 mt-6">
              {/* Ações Recomendadas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ações Recomendadas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {insight.type === 'critical' && (
                    <>
                      <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                        <div className="h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                        <div className="flex-1">
                          <div className="font-medium text-red-800">Reposição Urgente</div>
                          <div className="text-sm text-red-600">Criar pedido de reposição para entrega em até 24h</div>
                          <Button size="sm" className="mt-2" variant="destructive">
                            Criar Pedido
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="h-6 w-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                        <div className="flex-1">
                          <div className="font-medium text-amber-800">Transferência Entre Lojas</div>
                          <div className="text-sm text-amber-600">Verificar estoque em outras lojas para transferência</div>
                          <Button size="sm" className="mt-2" variant="outline">
                            Ver Disponibilidade
                          </Button>
                        </div>
                      </div>
                    </>
                  )}

                  {insight.type === 'opportunity' && (
                    <>
                      <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="h-6 w-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                        <div className="flex-1">
                          <div className="font-medium text-green-800">Criar Promoção</div>
                          <div className="text-sm text-green-600">Configurar promoção para capitalizar a alta demanda</div>
                          <Button size="sm" className="mt-2">
                            Criar Promoção
                          </Button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Histórico */}
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center gap-2 text-muted-foreground mb-3">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">Histórico de Ações</span>
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Insight detectado</span>
                        <span>Hoje, 09:15</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Última verificação</span>
                        <span>Hoje, 08:30</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ação anterior</span>
                        <span>Ontem, 16:45</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DrawerContent>
    </Drawer>
  );
}