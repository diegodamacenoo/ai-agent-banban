export interface MockAIResponse {
  response: string;
  suggestedActions?: string[];
}

// Análise de palavras-chave para gerar respostas contextuais
export function generateMockAIResponse(question: string): MockAIResponse {
  const lowerQuestion = question.toLowerCase();
  
  // Respostas sobre KPIs e métricas
  if (lowerQuestion.includes('vendas') || lowerQuestion.includes('receita') || lowerQuestion.includes('faturamento')) {
    return {
      response: `📈 **Análise de Vendas**

Com base nos dados que você está visualizando, suas vendas apresentaram um crescimento de **12.5%** no último mês, totalizando **R$ 2.847.392**.

**Principais insights:**
• O crescimento está concentrado nos produtos categoria A (alto giro)
• Região Sudeste lidera com 45% das vendas
• Produtos eletrônicos tiveram performance 18% acima da média

**Recomendações:**
• Aumentar estoque dos produtos categoria A para aproveitar o momentum
• Expandir estratégias que funcionaram no Sudeste para outras regiões
• Investigar oportunidades nos produtos categoria C para melhorar margem`,
      suggestedActions: [
        "Ver detalhes por região",
        "Analisar produtos categoria A",
        "Gerar relatório de vendas"
      ]
    };
  }

  // Respostas sobre estoque e inventário
  if (lowerQuestion.includes('estoque') || lowerQuestion.includes('inventário') || lowerQuestion.includes('produto')) {
    return {
      response: `📦 **Status do Estoque**

Analisando seu inventário atual, identifiquei alguns pontos importantes:

**Situação Geral:**
• **487 produtos** em estoque ativo
• **23 produtos** em nível crítico (< 10 unidades)
• **Fill rate:** 94.2% (acima da meta de 90%)

**Alertas Importantes:**
🔴 **Produtos em ruptura:** 8 SKUs
🟡 **Baixo estoque:** 15 SKUs necessitam reposição urgente
🟢 **Overstock:** 12 produtos com giro lento

**Próximas ações sugeridas:**
• Solicitar reposição imediata dos produtos críticos
• Revisar política de compras para produtos com overstock`,
      suggestedActions: [
        "Ver produtos em ruptura",
        "Relatório de reposição",
        "Análise ABC completa"
      ]
    };
  }

  // Respostas sobre fornecedores
  if (lowerQuestion.includes('fornecedor') || lowerQuestion.includes('supplier') || lowerQuestion.includes('compras')) {
    return {
      response: `🤝 **Análise de Fornecedores**

Seu scorecard de fornecedores mostra uma performance geral sólida:

**Top Performers:**
• **Fornecedor A:** 98% pontualidade, qualidade 4.8/5
• **Fornecedor B:** 95% pontualidade, qualidade 4.6/5
• **Fornecedor C:** 92% pontualidade, qualidade 4.5/5

**Pontos de Atenção:**
⚠️ **Fornecedor D:** Atraso médio de 3.2 dias nas últimas entregas
⚠️ **Fornecedor E:** Taxa de devoluções subiu para 2.8%

**Recomendações:**
• Renegociar SLA com Fornecedor D
• Implementar plano de melhoria com Fornecedor E
• Considerar ampliar pedidos com top performers`,
      suggestedActions: [
        "Scorecard detalhado",
        "Plano de ação fornecedores",
        "Histórico de performance"
      ]
    };
  }

  // Respostas sobre alertas e problemas
  if (lowerQuestion.includes('alerta') || lowerQuestion.includes('problema') || lowerQuestion.includes('crítico')) {
    return {
      response: `🚨 **Central de Alertas**

Identifiquei **5 alertas ativos** que requerem sua atenção:

**Críticos (2):**
🔴 Sistema de pagamento com latência alta (>2s)
🔴 Estoque zerado em 3 produtos categoria A

**Importantes (2):**
🟡 Meta de vendas 8% abaixo do target mensal
🟡 2 fornecedores com atrasos recorrentes

**Informativos (1):**
🔵 Nova atualização disponível para o módulo fiscal

**Ações Recomendadas:**
1. **Urgente:** Verificar infraestrutura de pagamentos
2. **Hoje:** Solicitar reposição emergencial categoria A
3. **Esta semana:** Revisar estratégia comercial`,
      suggestedActions: [
        "Resolver alertas críticos",
        "Plano de contingência",
        "Configurar notificações"
      ]
    };
  }

  // Respostas sobre análise ABC
  if (lowerQuestion.includes('abc') || lowerQuestion.includes('curva') || lowerQuestion.includes('classificação')) {
    return {
      response: `📊 **Análise ABC dos Produtos**

Sua curva ABC está bem distribuída e saudável:

**Categoria A (20% dos produtos, 80% da receita):**
• 97 produtos gerando R$ 2.277.914
• Giro médio: 24x por ano
• Margem média: 32%

**Categoria B (30% dos produtos, 15% da receita):**
• 146 produtos gerando R$ 427.189
• Giro médio: 8x por ano  
• Margem média: 28%

**Categoria C (50% dos produtos, 5% da receita):**
• 244 produtos gerando R$ 142.289
• Giro médio: 2x por ano
• Margem média: 45%

**Insights Estratégicos:**
• Categoria A: Foco em disponibilidade e logística
• Categoria B: Oportunidade de crescimento de vendas
• Categoria C: Otimizar margem e reduzir estoque`,
      suggestedActions: [
        "Estratégia categoria A",
        "Plano categoria B",
        "Otimização categoria C"
      ]
    };
  }

  // Respostas sobre margem e rentabilidade
  if (lowerQuestion.includes('margem') || lowerQuestion.includes('rentabilidade') || lowerQuestion.includes('lucro')) {
    return {
      response: `💰 **Análise de Rentabilidade**

Sua margem está em uma trajetória positiva:

**Performance Atual:**
• **Margem bruta:** 34.2% (↑2.1% vs mês anterior)
• **Margem líquida:** 12.8% (↑0.8% vs mês anterior)
• **ROI:** 18.5% (acima da meta de 15%)

**Por Categoria:**
• **Eletrônicos:** 28% margem (alto volume)
• **Casa & Jardim:** 42% margem (baixo volume)
• **Moda:** 35% margem (volume médio)

**Oportunidades Identificadas:**
📈 Aumentar mix de produtos Casa & Jardim (+14% margem potencial)
📈 Renegociar custos em Eletrônicos (volume justifica)
📈 Otimizar preços dinâmicos em Moda

**Impacto Potencial:** +R$ 89.000/mês`,
      suggestedActions: [
        "Plano de otimização",
        "Análise de preços",
        "Renegociação fornecedores"
      ]
    };
  }

  // Respostas sobre previsões e forecast
  if (lowerQuestion.includes('previsão') || lowerQuestion.includes('forecast') || lowerQuestion.includes('tendência')) {
    return {
      response: `🔮 **Previsões e Tendências**

Com base no histórico e padrões sazonais:

**Próximos 30 dias:**
• **Vendas previstas:** R$ 3.1M (↑9% vs atual)
• **Demanda prevista:** 15.500 unidades
• **Produtos em alta:** Eletrônicos (+25%), Casa (+12%)

**Alertas Preditivos:**
⚠️ **Black Friday** em 45 dias - preparar estoque categoria A
⚠️ **Verão** se aproximando - aumentar produtos sazonais
⚠️ **Fim de ano** - planejar logística extra

**Recomendações Estratégicas:**
1. **Compras:** Antecipar pedidos em 20% para Black Friday
2. **Estoque:** Reduzir produtos inverno gradualmente
3. **Marketing:** Focar em categorias de alta previsão

**Confiabilidade:** 87% (baseado em 24 meses de dados)`,
      suggestedActions: [
        "Plano Black Friday",
        "Estratégia sazonal",
        "Ajustar compras"
      ]
    };
  }

  // Respostas sobre performance e KPIs
  if (lowerQuestion.includes('performance') || lowerQuestion.includes('kpi') || lowerQuestion.includes('meta')) {
    return {
      response: `📈 **Dashboard de Performance**

Seus KPIs principais estão majoritariamente positivos:

**Vendas & Comercial:**
✅ **Receita mensal:** 102% da meta (R$ 2.85M)
✅ **Tickets médios:** 108% da meta (R$ 184)
⚠️ **Conversão:** 92% da meta (8.2%)

**Operacional:**
✅ **Fill rate:** 104% da meta (94.2%)
✅ **Giro estoque:** 98% da meta (12.5x)
✅ **Lead time:** 95% da meta (5.2 dias)

**Financeiro:**
✅ **Margem bruta:** 113% da meta (34.2%)
⚠️ **Inadimplência:** 88% da meta (2.3%)

**Próximas ações:**
• Melhorar conversão com campanhas direcionadas
• Reduzir inadimplência com análise de crédito`,
      suggestedActions: [
        "Plano de conversão",
        "Gestão de crédito",
        "Relatório executivo"
      ]
    };
  }

  // Respostas genéricas sobre ajuda
  if (lowerQuestion.includes('ajuda') || lowerQuestion.includes('help') || lowerQuestion.includes('como')) {
    return {
      response: `🤖 **Como posso te ajudar?**

Sou seu assistente de inteligência empresarial! Posso ajudar você com:

**📊 Análises de Dados:**
• Interpretação de métricas e KPIs
• Análise de tendências e padrões
• Comparações temporais e benchmarks

**💡 Insights Estratégicos:**
• Oportunidades de melhoria
• Identificação de problemas
• Recomendações de ação

**🎯 Áreas de Especialidade:**
• Vendas e receita • Estoque e inventário
• Fornecedores • Margem e rentabilidade
• Análise ABC • Previsões e forecast
• Alertas e monitoramento

**Experimente perguntar:**
"Como estão minhas vendas?" ou "Quais alertas preciso resolver?"`,
      suggestedActions: [
        "Análise de vendas",
        "Status dos alertas",
        "Resumo executivo"
      ]
    };
  }

  // Resposta padrão para perguntas não reconhecidas
  return {
    response: `🤔 **Analisando sua pergunta...**

Identifiquei que você está perguntando sobre: "${question}"

Com base no que você está visualizando no sistema, posso fornecer insights sobre:

**📊 Dados Disponíveis:**
• Métricas de vendas: R$ 2.847.392 no último mês
• Status do estoque: 487 produtos ativos
• Performance de fornecedores: 95% pontualidade média
• Análise ABC: Distribuição saudável entre categorias

**💡 Para uma resposta mais específica, tente perguntar:**
• "Como estão minhas vendas este mês?"
• "Quais produtos estão em baixo estoque?"
• "Como está a performance dos fornecedores?"
• "Preciso me preocupar com algum alerta?"

Reformule sua pergunta para que eu possa te dar insights mais precisos!`,
    suggestedActions: [
      "Análise de vendas",
      "Status do estoque",
      "Performance fornecedores"
    ]
  };
}

// Simula streaming response para demonstração
export async function* simulateStreamingResponse(response: string): AsyncGenerator<string, void, unknown> {
  const words = response.split(' ');
  let currentText = '';
  
  for (let i = 0; i < words.length; i++) {
    currentText += (i === 0 ? '' : ' ') + words[i];
    
    // Simula velocidade de digitação natural
    const delay = Math.random() * 50 + 30; // 30-80ms entre palavras
    await new Promise(resolve => setTimeout(resolve, delay));
    
    yield currentText;
  }
} 