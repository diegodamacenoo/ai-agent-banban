'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageCircle, Send, Bot, User, TrendingUp, Package, AlertTriangle, Lightbulb } from 'lucide-react';

export function ConversationalApproach() {
  const [selectedQuestion, setSelectedQuestion] = useState<string>('');

  const quickQuestions = [
    "Como está meu negócio hoje?",
    "O que devo priorizar agora?",
    "Quais produtos estão vendendo mais?",
    "Existe algum risco iminente?",
    "Como estão meus fornecedores?"
  ];

  const chatHistory = [
    {
      type: 'bot',
      message: 'Olá! Sou sua assistente de negócios com IA. Como posso ajudar você hoje?',
      time: '14:30'
    },
    {
      type: 'user',
      message: 'Como está meu negócio hoje?',
      time: '14:31'
    },
    {
      type: 'bot',
      message: 'Analisando seus dados... 📊',
      time: '14:31',
      isTyping: true
    },
    {
      type: 'bot',
      message: `Hoje temos um cenário misto:

**📉 Desafios:**
• Vendas 15% abaixo da meta (R$ 125k vs R$ 147k esperado)
• Tênis Running Elite com estoque crítico (5 unidades)

**📈 Oportunidades:**
• Jeans Skinny Premium com demanda 23% acima do previsto
• Gamma Sports disponível para volumes maiores

**🎯 Prioridade #1:** Fazer pedido urgente de tênis - risco de ruptura em 2 dias!

Quer que eu detalhe algum ponto específico?`,
      time: '14:31',
      insights: [
        { type: 'warning', text: 'Estoque crítico detectado' },
        { type: 'opportunity', text: 'Oportunidade de +R$ 8k' }
      ]
    },
    {
      type: 'user',
      message: 'O que devo fazer sobre o estoque do tênis?',
      time: '14:32'
    },
    {
      type: 'bot',
      message: `🎯 **Ação Recomendada para Tênis Running Elite:**

**Situação atual:**
• 5 unidades restantes
• Vendas médias: 3 unidades/dia
• Ruptura prevista: quinta-feira

**Melhor solução:**
• Fornecedor: **Gamma Sports** ⭐
• Lead time: 8 dias úteis
• Fill rate: 98% (excelente!)
• Quantidade sugerida: 50 unidades

**Próximos passos:**
1. Ligar agora: (11) 98765-4321
2. Referência do pedido: #TEN-001-BLK
3. Solicitar entrega expressa

💰 **Impacto se não agir:** Perda de R$ 15.000 em vendas

Quer que eu prepare o pedido ou tem alguma dúvida?`,
      time: '14:33',
      actions: [
        { text: '📞 Ligar para Gamma Sports', type: 'primary' },
        { text: '📋 Preparar pedido', type: 'secondary' },
        { text: '❓ Ver outros fornecedores', type: 'tertiary' }
      ]
    }
  ];

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">🎮 Abordagem: Dashboard Conversacional</h1>
        <p className="text-muted-foreground">Interface tipo chat para interação natural com a IA</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chat Principal */}
        <div className="lg:col-span-2">
          <Card className="h-[700px] flex flex-col">
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
            <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
              <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                {chatHistory.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.type === 'bot' && (
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-blue-600" />
                      </div>
                    )}
                    
                    <div className={`max-w-[75%] ${message.type === 'user' ? 'order-1' : ''}`}>
                      <div
                        className={`rounded-lg p-3 ${
                          message.type === 'user'
                            ? 'bg-blue-600 text-white ml-auto'
                            : 'bg-white border'
                        }`}
                      >
                        {message.isTyping ? (
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                            <span className="text-sm text-gray-600">IA está analisando...</span>
                          </div>
                        ) : (
                          <div className="whitespace-pre-line text-sm">{message.message}</div>
                        )}
                      </div>

                      {/* Insights da IA */}
                      {message.insights && (
                        <div className="mt-2 space-y-2">
                          {message.insights.map((insight, i) => (
                            <div
                              key={i}
                              className={`text-xs px-2 py-1 rounded inline-block mr-2 ${
                                insight.type === 'warning'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-green-100 text-green-700'
                              }`}
                            >
                              {insight.type === 'warning' ? '⚠️' : '💡'} {insight.text}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Botões de Ação */}
                      {message.actions && (
                        <div className="mt-3 space-y-2">
                          {message.actions.map((action, i) => (
                            <Button
                              key={i}
                              size="sm"
                              variant={action.type === 'primary' ? 'default' : 'outline'}
                              className="block w-full text-left justify-start"
                            >
                              {action.text}
                            </Button>
                          ))}
                        </div>
                      )}

                      <div className="text-xs text-gray-500 mt-1">
                        {message.time}
                      </div>
                    </div>

                    {message.type === 'user' && (
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Input de Mensagem */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Digite sua pergunta ou selecione uma sugestão..."
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                    value={selectedQuestion}
                    onChange={(e) => setSelectedQuestion(e.target.value)}
                  />
                  <Button size="sm">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar com Perguntas e Contexto */}
        <div className="space-y-6">
          
          {/* Perguntas Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Perguntas Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="w-full text-left justify-start text-sm"
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
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Vendas</span>
                <div className="text-right">
                  <div className="font-semibold">R$ 125k</div>
                  <div className="text-xs text-red-600">-15% ↓</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Alertas</span>
                <Badge variant="destructive">3 críticos</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Estoque</span>
                <div className="text-right">
                  <div className="font-semibold">32 dias</div>
                  <div className="text-xs text-orange-600">Atenção</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Fornecedores</span>
                <div className="text-right">
                  <div className="font-semibold">91%</div>
                  <div className="text-xs text-green-600">Boa performance</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Insights IA */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Insights da IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-red-50 p-3 rounded border-l-4 border-red-400">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="font-medium text-red-900 text-sm">Crítico</span>
                </div>
                <p className="text-xs text-red-700">
                  Tênis Running Elite: ruptura em 2 dias
                </p>
              </div>

              <div className="bg-green-50 p-3 rounded border-l-4 border-green-400">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-900 text-sm">Oportunidade</span>
                </div>
                <p className="text-xs text-green-700">
                  Jeans Skinny: +23% demanda, aumentar displays
                </p>
              </div>

              <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900 text-sm">Fornecedor</span>
                </div>
                <p className="text-xs text-blue-700">
                  Gamma Sports: ideal para renegociação
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Summary da Abordagem */}
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
    </div>
  );
} 