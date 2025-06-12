'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, TrendingUp, Package, Phone, ArrowRight, CheckCircle2 } from 'lucide-react';

export function AlertsApproach() {
  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">🚨 Abordagem: Dashboard de Alertas Inteligentes</h1>
        <p className="text-muted-foreground">Central de comando com alertas priorizados e ações diretas</p>
      </div>

      {/* Status Geral */}
      <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <div>
                <CardTitle className="text-lg">🚨 Status Operacional</CardTitle>
                <p className="text-sm text-muted-foreground">3 situações críticas requerem ação imediata</p>
              </div>
            </div>
            <Badge variant="destructive" className="text-lg px-4 py-2">
              AÇÃO NECESSÁRIA
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Alertas Prioritários */}
      <div className="space-y-4">
        {/* Alerta 1 - Crítico */}
        <Card className="border-l-4 border-red-500 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Package className="h-5 w-5 text-red-600" />
                  <Badge variant="destructive">CRÍTICO</Badge>
                  <span className="text-xs text-red-600 font-medium">⏰ Resolver em 2 horas</span>
                </div>
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  🎯 Ruptura de Estoque Iminente
                </h3>
                <p className="text-red-800 mb-3">
                  <strong>Tênis Running Elite:</strong> Apenas 5 unidades restantes. 
                  Vendas média: 3un/dia. Ruptura prevista para <strong>quinta-feira</strong>.
                </p>
                <div className="bg-white p-3 rounded border">
                  <p className="text-sm font-medium text-red-900 mb-2">🎯 Ação Recomendada pela IA:</p>
                  <p className="text-sm text-red-700 mb-3">
                    Fazer pedido urgente para <strong>Gamma Sports</strong> (lead time: 8 dias, fill rate: 98%)
                  </p>
                  <p className="text-xs text-red-600">
                    💰 Impacto se não agir: Perda potencial de R$ 15.000 em vendas
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 ml-4">
                <Button className="bg-red-600 hover:bg-red-700">
                  <Phone className="h-4 w-4 mr-2" />
                  Ligar para Fornecedor
                </Button>
                <Button variant="outline" size="sm">
                  <Package className="h-4 w-4 mr-2" />
                  Fazer Pedido Online
                </Button>
                <Button variant="ghost" size="sm" className="text-red-600">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Marcar como Resolvido
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerta 2 - Alto */}
        <Card className="border-l-4 border-orange-500 bg-orange-50">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                  <Badge className="bg-orange-100 text-orange-800">ALTA</Badge>
                  <span className="text-xs text-orange-600 font-medium">⏰ Resolver hoje</span>
                </div>
                <h3 className="text-lg font-semibold text-orange-900 mb-2">
                  📈 Oportunidade de Vendas Perdida
                </h3>
                <p className="text-orange-800 mb-3">
                  <strong>Jeans Skinny Premium:</strong> Demanda 23% acima do previsto, 
                  mas baixa exposição nas lojas principais.
                </p>
                <div className="bg-white p-3 rounded border">
                  <p className="text-sm font-medium text-orange-900 mb-2">💡 Sugestão da IA:</p>
                  <p className="text-sm text-orange-700 mb-3">
                    Aumentar displays em <strong>Loja Shopping Center</strong> e <strong>Loja Centro</strong>
                  </p>
                  <p className="text-xs text-orange-600">
                    🎯 Potencial de ganho: R$ 8.000 adicionais esta semana
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 ml-4">
                <Button className="bg-orange-600 hover:bg-orange-700">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Ajustar Displays
                </Button>
                <Button variant="outline" size="sm">
                  📱 Avisar Gerentes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerta 3 - Média */}
        <Card className="border-l-4 border-yellow-500 bg-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <Badge className="bg-yellow-100 text-yellow-800">MÉDIA</Badge>
                  <span className="text-xs text-yellow-600 font-medium">⏰ Resolver esta semana</span>
                </div>
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                  🤝 Renegociação de Contrato
                </h3>
                <p className="text-yellow-800 mb-3">
                  <strong>Gamma Sports:</strong> Performance excepcional (97% score). 
                  Oportunidade para volumes maiores com melhores preços.
                </p>
                <div className="bg-white p-3 rounded border">
                  <p className="text-sm font-medium text-yellow-900 mb-2">💰 Oportunidade da IA:</p>
                  <p className="text-sm text-yellow-700 mb-3">
                    Propor aumento de 40% no volume com 8% desconto
                  </p>
                  <p className="text-xs text-yellow-600">
                    📊 Economia potencial: R$ 12.000/mês
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 ml-4">
                <Button variant="outline" className="border-yellow-600 text-yellow-700">
                  📅 Agendar Reunião
                </Button>
                <Button variant="ghost" size="sm">
                  📋 Ver Histórico
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Resumidas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📊 Contexto Rápido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">R$ 125k</div>
              <div className="text-sm text-muted-foreground">Vendas (15% ↓)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">32d</div>
              <div className="text-sm text-muted-foreground">Cobertura</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">91%</div>
              <div className="text-sm text-muted-foreground">Score Fornec.</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">3</div>
              <div className="text-sm text-muted-foreground">Alertas Ativos</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary da Abordagem */}
      <Card className="bg-slate-100">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-3">📋 Características desta Abordagem:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-green-700 mb-1">✅ Vantagens:</p>
              <ul className="space-y-1 text-green-600">
                <li>• Foco em ações imediatas</li>
                <li>• Priorização clara e visual</li>
                <li>• Reduz sobrecarga cognitiva</li>
                <li>• Workflow orientado a tarefas</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-orange-700 mb-1">⚠️ Considerações:</p>
              <ul className="space-y-1 text-orange-600">
                <li>• Pode ocultar dados importantes</li>
                <li>• Dependente de algoritmos precisos</li>
                <li>• Menos flexibilidade exploratória</li>
                <li>• Requer integração com sistemas</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 