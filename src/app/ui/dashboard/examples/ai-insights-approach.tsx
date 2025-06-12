'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TrendingUp, Target, Lightbulb, ArrowRight, Clock } from 'lucide-react';

export function AIInsightsApproach() {
  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">🧠 Abordagem: IA Card Insights</h1>
        <p className="text-muted-foreground">Widgets tradicionais + insights da IA integrados</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Vendas com IA Insight */}
        <Card className="relative">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Total de Vendas</CardTitle>
              <Badge variant="destructive" className="animate-pulse">
                Ação Necessária
              </Badge>
            </div>
            <div className="text-3xl font-bold">R$ 125k</div>
            <div className="text-sm text-muted-foreground">-15% vs meta mensal</div>
          </CardHeader>
          <CardContent>
            {/* IA Insight Section */}
            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
              <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 mb-1">💡 Insight da IA</h4>
                  <p className="text-sm text-blue-800 mb-3">
                    Queda concentrada em produtos categoria B. Produtos A mantêm performance.
                  </p>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-blue-900">🎯 Recomendação:</p>
                    <p className="text-xs text-blue-700">
                      Focar marketing em Jeans Skinny (+23% demanda) e acelerar promoções categoria B
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" className="text-xs">
                        <ArrowRight className="h-3 w-3 mr-1" />
                        Ver Análise Completa
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Estoque com IA Insight */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Situação de Estoque</CardTitle>
              <Badge className="bg-orange-100 text-orange-800">
                Atenção
              </Badge>
            </div>
            <div className="text-3xl font-bold">32 dias</div>
            <div className="text-sm text-muted-foreground">Cobertura média</div>
          </CardHeader>
          <CardContent>
            {/* IA Insight Section */}
            <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-orange-900 mb-1">⚠️ Alerta da IA</h4>
                  <p className="text-sm text-orange-800 mb-3">
                    Tênis Running Elite: apenas 5 unidades. Risco de ruptura em 3 dias.
                  </p>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-orange-900">🚀 Ação Imediata:</p>
                    <p className="text-xs text-orange-700">
                      Pedido urgente para Gamma Sports (lead time 8 dias, fill rate 98%)
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" className="text-xs bg-orange-600 hover:bg-orange-700">
                        <Clock className="h-3 w-3 mr-1" />
                        Fazer Pedido Urgente
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Fornecedores com IA Insight */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Performance Fornecedores</CardTitle>
              <Badge className="bg-green-100 text-green-800">
                Oportunidade
              </Badge>
            </div>
            <div className="text-3xl font-bold">91.2%</div>
            <div className="text-sm text-muted-foreground">Score médio</div>
          </CardHeader>
          <CardContent>
            {/* IA Insight Section */}
            <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-green-900 mb-1">📈 Oportunidade da IA</h4>
                  <p className="text-sm text-green-800 mb-3">
                    Gamma Sports: performance excepcional (97%). Potencial para mais pedidos.
                  </p>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-green-900">💰 Recomendação:</p>
                    <p className="text-xs text-green-700">
                      Renegociar contrato para volumes maiores. Economia estimada: R$ 12k/mês
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" className="text-xs border-green-600 text-green-700">
                        <Target className="h-3 w-3 mr-1" />
                        Agendar Reunião
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Previsão com IA Insight */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Forecast 7 Dias</CardTitle>
              <Badge className="bg-blue-100 text-blue-800">
                85% Accuracy
              </Badge>
            </div>
            <div className="text-3xl font-bold">342 un</div>
            <div className="text-sm text-muted-foreground">Vendas previstas</div>
          </CardHeader>
          <CardContent>
            {/* IA Insight Section */}
            <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
              <div className="flex items-start gap-3">
                <Target className="h-5 w-5 text-purple-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-purple-900 mb-1">🔮 Previsão da IA</h4>
                  <p className="text-sm text-purple-800 mb-3">
                    Pico de vendas esperado quinta-feira. Camisa Polo deve liderar.
                  </p>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-purple-900">📋 Preparação:</p>
                    <p className="text-xs text-purple-700">
                      Garantir 45 unidades Camisa Polo disponíveis até quarta-feira
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" className="text-xs border-purple-600 text-purple-700">
                        📊 Ver Detalhes do Forecast
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary da Abordagem */}
      <Card className="bg-slate-100">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-3">📋 Características desta Abordagem:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-green-700 mb-1">✅ Vantagens:</p>
              <ul className="space-y-1 text-green-600">
                <li>• Mantém dados quantitativos familiares</li>
                <li>• Adiciona insights acionáveis</li>
                <li>• Implementação gradual possível</li>
                <li>• Botões de ação direta</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-orange-700 mb-1">⚠️ Considerações:</p>
              <ul className="space-y-1 text-orange-600">
                <li>• Pode ficar visualmente carregado</li>
                <li>• Usuários podem ignorar insights</li>
                <li>• Requer engine de regras robusta</li>
                <li>• Manutenção de múltiplos widgets</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 