'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, TrendingDown, AlertTriangle, Star, Calendar, Target } from 'lucide-react';

export function StorytellingApproach() {
  return (
    <div className="p-6 space-y-8 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">🎪 Abordagem: Storytelling de Dados</h1>
        <p className="text-muted-foreground">Narrativa fluida que conta a história dos seus dados</p>
      </div>

      {/* Story Header */}
      <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <CardContent className="p-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">📖 Sua História Hoje</h2>
            <p className="text-xl opacity-90 mb-6">
              Uma análise inteligente do seu negócio em linguagem simples
            </p>
            <div className="flex items-center justify-center gap-4 text-sm opacity-80">
              <span>📅 Terça-feira, 10 de Dezembro</span>
              <span>•</span>
              <span>⏰ Última atualização: 14:30</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Capítulo 1: Situação Atual */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 font-bold">1</span>
            </div>
            <CardTitle className="text-xl">🎯 O Cenário de Hoje</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="prose max-w-none">
            <p className="text-lg leading-relaxed text-gray-700">
              Seu negócio está enfrentando um <strong className="text-red-600">momento desafiador</strong>. 
              As vendas de hoje estão <strong>15% abaixo da meta</strong>, totalizando R$ 125.000. 
              Isso não é apenas um número – representa uma oportunidade perdida de R$ 22.000.
            </p>
            
            <div className="bg-red-50 border-l-4 border-red-400 p-4 my-4">
              <p className="text-red-800 font-medium mb-2">🔍 O que está acontecendo?</p>
              <p className="text-red-700 text-sm">
                A análise da IA identificou que a queda se concentra principalmente nos produtos 
                <strong> categoria B</strong>. Enquanto isso, seus produtos categoria A mantêm 
                performance estável, indicando que o problema é específico, não geral.
              </p>
            </div>

            <p className="text-gray-700">
              Mas aqui está a boa notícia: seus produtos principais continuam performando bem. 
              Isso significa que a base do seu negócio está sólida, e você tem ferramentas 
              para reverter esta situação.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Capítulo 2: Oportunidades */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600 font-bold">2</span>
            </div>
            <CardTitle className="text-xl">⭐ As Oportunidades à Vista</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="prose max-w-none">
            <p className="text-lg leading-relaxed text-gray-700">
              Nem tudo são desafios. A IA detectou <strong className="text-green-600">oportunidades 
              valiosas</strong> que podem transformar este dia:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-800">Jeans Skinny Premium</span>
                </div>
                <p className="text-sm text-green-700 mb-2">
                  <strong>23% acima da demanda prevista!</strong> Este produto está em alta, 
                  mas com baixa exposição nas lojas principais.
                </p>
                <Badge className="bg-green-100 text-green-800 text-xs">
                  💰 Potencial: +R$ 8.000 esta semana
                </Badge>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-blue-800">Gamma Sports</span>
                </div>
                <p className="text-sm text-blue-700 mb-2">
                  Seu melhor fornecedor (97% score) está pronto para volumes maiores. 
                  Momento ideal para renegociar.
                </p>
                <Badge className="bg-blue-100 text-blue-800 text-xs">
                  💰 Economia: R$ 12.000/mês
                </Badge>
              </div>
            </div>

            <p className="text-gray-700">
              Essas oportunidades não são coincidência – elas surgem da análise inteligente 
              dos seus padrões de vendas e comportamento de fornecedores.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Capítulo 3: Riscos */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 font-bold">3</span>
            </div>
            <CardTitle className="text-xl">⚠️ O Que Requer Sua Atenção</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="prose max-w-none">
            <p className="text-lg leading-relaxed text-gray-700">
              Existe um <strong className="text-red-600">risco iminente</strong> que precisa 
              da sua ação imediata:
            </p>

            <div className="bg-red-100 border border-red-300 rounded-lg p-6 my-6">
              <div className="flex items-start gap-4">
                <AlertTriangle className="h-6 w-6 text-red-600 mt-1" />
                <div>
                  <h4 className="text-lg font-semibold text-red-900 mb-2">
                    🎯 Tênis Running Elite: Ruptura em 2 dias
                  </h4>
                  <p className="text-red-800 mb-4">
                    Restam apenas <strong>5 unidades</strong> do seu produto mais vendido. 
                    Com vendas médias de 3 unidades por dia, você ficará sem estoque na 
                    <strong> quinta-feira</strong>.
                  </p>
                  <div className="bg-white p-3 rounded border">
                    <p className="text-sm font-medium text-red-900 mb-1">🚨 Impacto se não agir:</p>
                    <p className="text-sm text-red-700">
                      • Perda de R$ 15.000 em vendas diretas<br/>
                      • Frustração de clientes fiéis<br/>
                      • Oportunidade para concorrentes
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-gray-700">
              A boa notícia? A IA já identificou a solução ideal: 
              <strong> Gamma Sports</strong> pode entregar em 8 dias com 98% de confiabilidade.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Capítulo 4: Plano de Ação */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold">4</span>
            </div>
            <CardTitle className="text-xl">🚀 Seu Plano de Ação</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="prose max-w-none">
            <p className="text-lg leading-relaxed text-gray-700">
              Com base na análise completa, aqui está seu <strong className="text-blue-600">
              roteiro para os próximos 7 dias</strong>:
            </p>

            <div className="space-y-4 my-6">
              {/* Ação 1 */}
              <div className="flex items-start gap-4 p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-red-900">🚨 URGENTE: Reposição Tênis</h4>
                    <Badge variant="destructive">Hoje</Badge>
                  </div>
                  <p className="text-sm text-red-700 mb-3">
                    Ligar para Gamma Sports e fazer pedido urgente de 50 unidades Tênis Running Elite
                  </p>
                  <Button size="sm" className="bg-red-600 hover:bg-red-700">
                    📞 Fazer Pedido Agora
                  </Button>
                </div>
              </div>

              {/* Ação 2 */}
              <div className="flex items-start gap-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-orange-900">📈 Maximizar Jeans Skinny</h4>
                    <Badge className="bg-orange-100 text-orange-800">Hoje</Badge>
                  </div>
                  <p className="text-sm text-orange-700 mb-3">
                    Aumentar displays em Loja Shopping Center e Loja Centro
                  </p>
                  <Button size="sm" variant="outline" className="border-orange-600 text-orange-700">
                    📱 Avisar Gerentes
                  </Button>
                </div>
              </div>

              {/* Ação 3 */}
              <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-blue-900">🤝 Renegociar com Gamma</h4>
                    <Badge className="bg-blue-100 text-blue-800">Esta semana</Badge>
                  </div>
                  <p className="text-sm text-blue-700 mb-3">
                    Agendar reunião para aumentar volume e conseguir melhores preços
                  </p>
                  <Button size="sm" variant="outline" className="border-blue-600 text-blue-700">
                    📅 Agendar Reunião
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border-l-4 border-green-400 p-4">
              <p className="text-green-800 font-medium mb-2">🎯 Resultado Esperado:</p>
              <p className="text-green-700 text-sm">
                Seguindo este plano, você pode recuperar as vendas perdidas e adicionar 
                <strong> R$ 35.000 em receita adicional</strong> nas próximas duas semanas.
              </p>
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
                <li>• Narrativa envolvente e humanizada</li>
                <li>• Contexto completo da situação</li>
                <li>• Fácil compreensão para não-técnicos</li>
                <li>• Conecta dados com impacto real</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-orange-700 mb-1">⚠️ Considerações:</p>
              <ul className="space-y-1 text-orange-600">
                <li>• Pode ser verbose para usuários avançados</li>
                <li>• Requer tempo para ler completamente</li>
                <li>• Menos adequado para check-ins rápidos</li>
                <li>• Necessita copywriting cuidadoso</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 