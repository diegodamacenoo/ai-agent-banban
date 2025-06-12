'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, TrendingUp, Target, Lightbulb, ArrowRight, Clock, Package, Phone, CheckCircle2, Bot, User, MessageCircle, Send, Star, Calendar } from 'lucide-react';

export default function DashboardComparisonPage() {
  const [selectedQuestion, setSelectedQuestion] = useState<string>('');

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">🎯 Comparação de Abordagens para Dashboard IA</h1>
        <p className="text-lg text-muted-foreground">
          Visualize diferentes estratégias para apresentar insights e orientar tomada de decisão
        </p>
      </div>

      <Tabs defaultValue="insights" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="insights">🧠 IA Card Insights</TabsTrigger>
          <TabsTrigger value="alerts">🚨 Alertas Inteligentes</TabsTrigger>
          <TabsTrigger value="storytelling">🎪 Storytelling</TabsTrigger>
          <TabsTrigger value="conversational">🎮 Conversacional</TabsTrigger>
        </TabsList>

        {/* Abordagem 1: IA Card Insights */}
        <TabsContent value="insights" className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold">🧠 Abordagem: IA Card Insights</h2>
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
          </div>

          {/* Summary da Abordagem 1 */}
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
        </TabsContent>

        {/* Abordagem 2: Alertas Inteligentes */}
        <TabsContent value="alerts" className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold">🚨 Abordagem: Dashboard de Alertas Inteligentes</h2>
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

          {/* Alerta Crítico */}
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

          {/* Summary da Abordagem 2 */}
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
        </TabsContent>

        {/* Abordagem 3: Storytelling */}
        <TabsContent value="storytelling" className="space-y-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold">🎪 Abordagem: Storytelling de Dados</h2>
            <p className="text-muted-foreground">Narrativa fluida que conta a história dos seus dados</p>
          </div>

          {/* Story Header */}
          <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
            <CardContent className="p-8">
              <div className="text-center">
                <h3 className="text-3xl font-bold mb-4">📖 Sua História Hoje</h3>
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

          {/* Summary da Abordagem 3 */}
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
        </TabsContent>

        {/* Abordagem 4: Conversacional */}
        <TabsContent value="conversational" className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold">🎮 Abordagem: Dashboard Conversacional</h2>
            <p className="text-muted-foreground">Interface tipo chat para interação natural com a IA</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chat Principal */}
            <div className="lg:col-span-2">
              <Card className="h-[500px] flex flex-col">
                <CardHeader className="border-b">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Bot className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">🤖 Assistente de Negócios IA</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        <span className="w-2 h-2 bg-green-500 rounded-full inline-block mr-2"></span>
                        Online • Analisando dados em tempo real
                      </p>
                    </div>
                  </div>
                </CardHeader>

                {/* Área de Chat */}
                <CardContent className="flex-1 p-4 space-y-4 overflow-y-auto">
                  {/* Mensagem da IA */}
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="max-w-[75%]">
                      <div className="bg-white border rounded-lg p-3">
                        <div className="text-sm">Olá! Sou sua assistente de negócios com IA. Como posso ajudar você hoje?</div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">14:30</div>
                    </div>
                  </div>

                  {/* Mensagem do Usuário */}
                  <div className="flex gap-3 justify-end">
                    <div className="max-w-[75%]">
                      <div className="bg-blue-600 text-white rounded-lg p-3 ml-auto">
                        <div className="text-sm">Como está meu negócio hoje?</div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 text-right">14:31</div>
                    </div>
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                  </div>

                  {/* Resposta da IA */}
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="max-w-[75%]">
                      <div className="bg-white border rounded-lg p-3">
                        <div className="whitespace-pre-line text-sm">{`Hoje temos um cenário misto:

**📉 Desafios:**
• Vendas 15% abaixo da meta (R$ 125k vs R$ 147k esperado)
• Tênis Running Elite com estoque crítico (5 unidades)

**📈 Oportunidades:**
• Jeans Skinny Premium com demanda 23% acima do previsto
• Gamma Sports disponível para volumes maiores

**🎯 Prioridade #1:** Fazer pedido urgente de tênis - risco de ruptura em 2 dias!

Quer que eu detalhe algum ponto específico?`}</div>
                      </div>
                      
                      <div className="mt-2 space-y-2">
                        <div className="text-xs px-2 py-1 rounded inline-block mr-2 bg-red-100 text-red-700">
                          ⚠️ Estoque crítico detectado
                        </div>
                        <div className="text-xs px-2 py-1 rounded inline-block mr-2 bg-green-100 text-green-700">
                          💡 Oportunidade de +R$ 8k
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 mt-1">14:31</div>
                    </div>
                  </div>
                </CardContent>

                {/* Input de Mensagem */}
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Digite sua pergunta..."
                      className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                      value={selectedQuestion}
                      onChange={(e) => setSelectedQuestion(e.target.value)}
                    />
                    <Button size="sm">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Perguntas Rápidas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Perguntas Rápidas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    "Como está meu negócio hoje?",
                    "O que devo priorizar agora?",
                    "Quais produtos estão vendendo mais?",
                    "Existe algum risco iminente?"
                  ].map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="w-full text-left justify-start text-xs"
                      onClick={() => setSelectedQuestion(question)}
                    >
                      {question}
                    </Button>
                  ))}
                </CardContent>
              </Card>

              {/* Status Rápido */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">📊 Status Atual</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Vendas</span>
                    <div className="text-right">
                      <div className="font-semibold">R$ 125k</div>
                      <div className="text-xs text-red-600">-15% ↓</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span>Alertas</span>
                    <Badge variant="destructive" className="text-xs">3 críticos</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Summary da Abordagem 4 */}
          <Card className="bg-slate-100">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-3">📋 Características desta Abordagem:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-green-700 mb-1">✅ Vantagens:</p>
                  <ul className="space-y-1 text-green-600">
                    <li>• Interação natural e intuitiva</li>
                    <li>• Respostas personalizadas para contexto</li>
                    <li>• Drill-down guiado pela IA</li>
                    <li>• Familiar para usuários de chat/WhatsApp</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-orange-700 mb-1">⚠️ Considerações:</p>
                  <ul className="space-y-1 text-orange-600">
                    <li>• Requer LLM avançado e confiável</li>
                    <li>• Pode ser lento para overview geral</li>
                    <li>• Necessita treinamento específico</li>
                    <li>• Potenciais respostas inconsistentes</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Conclusão */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
        <CardContent className="p-8">
          <h3 className="text-xl font-bold mb-4 text-center">🎯 Qual Abordagem Escolher?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <p className="font-medium text-blue-900 mb-3">🤔 Considere o seu contexto:</p>
              <ul className="space-y-2 text-blue-800">
                <li>• <strong>Usuários técnicos</strong> → IA Card Insights</li>
                <li>• <strong>Foco em ação rápida</strong> → Alertas Inteligentes</li>
                <li>• <strong>Apresentações/relatórios</strong> → Storytelling</li>
                <li>• <strong>Exploração de dados</strong> → Conversacional</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-blue-900 mb-3">💡 Implementação sugerida:</p>
              <ul className="space-y-2 text-blue-800">
                <li>• Comece com <strong>IA Card Insights</strong> (menor risco)</li>
                <li>• Adicione <strong>Alertas</strong> para situações críticas</li>
                <li>• Teste <strong>Conversacional</strong> com usuários-chave</li>
                <li>• <strong>Storytelling</strong> para relatórios executivos</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 