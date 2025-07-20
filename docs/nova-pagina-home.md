# Nova Página Home - Insights Dashboard

## Visão Geral

Substituir o dashboard complexo atual por uma página home limpa e focada em insights em linguagem natural, proporcionando uma experiência mais intuitiva e direcionada para o usuário.

## Objetivos

- **Simplicidade**: Interface limpa e minimalista
- **Relevância**: Insights personalizados e acionáveis
- **Clareza**: Informações em linguagem natural e fácil compreensão
- **Ação**: Cada insight deve permitir ações diretas do usuário

## Estrutura da Página

### 1. Header de Boas-vindas

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│        Olá [Nome do Usuário],                                   │
│        aqui estão os principais insights de hoje                │
│                                                                 │
│                     [Data e Hora]                               │
└─────────────────────────────────────────────────────────────────┘
```

**Características:**

- Título grande e acolhedor
- Personalização com nome do usuário/empresa
- Data/hora para contextualizar os insights
- Design clean com bastante espaço em branco

### 2. Grid de Cards de Insights

```
┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│ [CRÍTICO]            │  │ [ATENÇÃO]            │  │ [OPORTUNIDADE]       │
│                      │  │                      │  │                      │
│ Você possui 3        │  │ Detectada            │  │ 5 produtos com       │
│ produtos da          │  │ inconsistência       │  │ alta demanda         │
│ categoria Calçados   │  │ de preços em 2       │  │ podem ter estoque    │
│ com estoque baixo    │  │ produtos entre       │  │ aumentado em 20%     │
│ em 3 lojas           │  │ lojas (15% dif.)     │  │ para maximizar       │
│                      │  │                      │  │ vendas               │
│  👁️  ⋯              │  │  👁️  ⋯              │  │  👁️  ⋯              │
└──────────────────────┘  └──────────────────────┘  └──────────────────────┘

┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│ [MODERADO]          │  │ [CONQUISTA]         │  │ [ATENÇÃO]           │
│                     │  │                     │  │                     │
│ 8 produtos com      │  │ Vendas cresceram    │  │ 2 fornecedores      │
│ menos de 5 unidades │  │ 12% em relação      │  │ atrasaram entregas  │
│ em 4 lojas          │  │ ao mês passado      │  │ por 3 dias          │
│                     │  │ na categoria        │  │ consecutivos        │
│                     │  │ Eletrônicos         │  │                     │
│  👁️  ⋯              │  │  👁️  ⋯              │  │  👁️  ⋯              │
└──────────────────────┘  └──────────────────────┘  └──────────────────────┘
```

## Tipos de Badges de Insights

### 1. CRÍTICO 🔴

- **Cor**: Vermelho/Red-500
- **Quando usar**: Problemas urgentes que requerem ação imediata
- **Exemplos**: Estoque zerado, produtos vencidos, problemas de sistema

### 2. ATENÇÃO 🟡

- **Cor**: Amarelo/Amber-500
- **Quando usar**: Situações que precisam de monitoramento ou ação em breve
- **Exemplos**: Estoque baixo, inconsistências de preço, atrasos de fornecedor

### 3. MODERADO 🔵

- **Cor**: Azul/Blue-500
- **Quando usar**: Informações importantes mas não urgentes
- **Exemplos**: Análises de tendência, relatórios de performance

### 4. OPORTUNIDADE 🟢

- **Cor**: Verde/Green-500
- **Quando usar**: Identificação de oportunidades de crescimento ou melhoria
- **Exemplos**: Produtos com alta demanda, promoções sugeridas

### 5. CONQUISTA 🎉

- **Cor**: Roxo/Purple-500
- **Quando usar**: Marcos alcançados, metas batidas, sucessos
- **Exemplos**: Crescimento de vendas, metas atingidas, melhorias implementadas

## Componentes dos Cards

### Estrutura do Card

```tsx
<Card>
  <CardHeader>
    <Badge variant={insightType}>{TIPO_INSIGHT}</Badge>
  </CardHeader>
  <CardContent>
    <p className="text-natural">{textoInsight}</p>
  </CardContent>
  <CardFooter>
    <Button variant="ghost" size="icon">
      <Eye /> {/* Ver detalhes */}
    </Button>
    <Button variant="ghost" size="icon">
      <MoreHorizontal /> {/* Menu ações */}
    </Button>
  </CardFooter>
</Card>
```

### Ações do Card

#### Botão Olho (👁️) - Ver Detalhes

Abre um **Drawer** lateral com:

- Detalhamento completo do insight
- Gráficos e dados complementares
- Histórico do problema/oportunidade
- Recomendações detalhadas

#### Botão Três Pontos (⋯) - Menu de Ações

Abre um **Dropdown Menu** com:

- "Marcar como visto"
- "Ignorar por 7 dias"
- "Criar tarefa"
- "Compartilhar insight"
- "Ver histórico"

## Mockup Textual da Interface

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                   AXON                                       ║
║                                                                               ║
║                        Olá Usuário Exemplo,                                     ║
║              aqui estão os principais insights desta manhã                   ║
║                                                                               ║
║        Segunda-feira, 30 de Junho • 9:15  •  6 de 14 insights               ║
║                                                                               ║
║  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐  ║
║  │ 🔴 CRÍTICO          │  │ 🟡 ATENÇÃO          │  │ 🟢 OPORTUNIDADE     │  ║
║  │                     │  │                     │  │    ↗️ CONECTADO       │  ║
║  │ 3 produtos da       │  │ Inconsistência de   │  │                     │  ║
║  │ categoria Calçados  │  │ preços detectada    │  │ Produto similar      │  ║
║  │ estão com estoque   │  │ em 2 produtos       │  │ "Tênis Nike Air"    │  ║
║  │ crítico em 3 lojas  │  │ (diferença de 15%)  │  │ está em alta.       │  ║
║  │                     │  │                     │  │ Que tal promover?   │  ║
║  │                     │  │                     │  │                     │  ║
║  │     👁️    ⋯    🔗    │  │     👁️    ⋯          │  │     👁️    ⋯          │  ║
║  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘  ║
║                                                                               ║
║  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐  ║
║  │ 🎉 CONQUISTA        │  │ 🔵 MODERADO         │  │ 🟡 ATENÇÃO          │  ║
║  │    ⭐ 95% úteis      │  │                     │  │                     │  ║
║  │                     │  │ 8 produtos com      │  │ Fornecedor XYZ      │  ║
║  │ Parabéns! Meta de   │  │ menos de 5 unidades │  │ atrasou entregas    │  ║
║  │ vendas batida 5     │  │ no estoque (normal  │  │ por 3 dias          │  ║
║  │ dias antes! Moda    │  │ para esta época)    │  │ consecutivos        │  ║
║  │ Feminina liderou.   │  │                     │  │                     │  ║
║  │                     │  │                     │  │                     │  ║
║  │     👁️    ⋯          │  │     👁️    ⋯          │  │     👁️    ⋯          │  ║
║  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘  ║
║                                                                               ║
║               [Ver mais insights (8)] • [💡 Como estou indo?]                ║
║                                                                               ║
║    💬 "Notei que você sempre age rápido em insights de estoque.              ║
║        Destacando esses para você primeiro!"                                 ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### Versão com Chat Flutuante Integrado

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                   AXON                                       ║
║                                                                               ║
║                        Olá Loja Exemplo,                                     ║
║              aqui estão os principais insights desta manhã                   ║
║                                                                               ║
║        Segunda-feira, 30 de Junho • 9:15  •  6 de 14 insights               ║
║                                                                               ║
║  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐  ║
║  │ 🔴 CRÍTICO          │  │ 🟡 ATENÇÃO          │  │ 🟢 OPORTUNIDADE     │  ║
║  │                     │  │                     │  │    ↗️ CONECTADO       │  ║
║  │ 3 produtos da       │  │ Inconsistência de   │  │                     │  ║
║  │ categoria Calçados  │  │ preços detectada    │  │ Produto similar      │  ║
║  │ estão com estoque   │  │ em 2 produtos       │  │ "Tênis Nike Air"    │  ║
║  │ crítico em 3 lojas  │  │ (diferença de 15%)  │  │ está em alta.       │  ║
║  │                     │  │                     │  │ Que tal promover?   │  ║
║  │                     │  │                     │  │                     │  ║
║  │     👁️    ⋯    🔗    │  │     👁️    ⋯          │  │     👁️    ⋯          │  ║
║  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘  ║
║                                                                               ║
║  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐  ║
║  │ 🎉 CONQUISTA        │  │ 🔵 MODERADO         │  │ 🟡 ATENÇÃO          │  ║
║  │    ⭐ 95% úteis      │  │                     │  │                     │  ║
║  │                     │  │ 8 produtos com      │  │ Fornecedor XYZ      │  ║
║  │ Parabéns! Meta de   │  │ menos de 5 unidades │  │ atrasou entregas    │  ║
║  │ vendas batida 5     │  │ no estoque (normal  │  │ por 3 dias          │  ║
║  │ dias antes! Moda    │  │ para esta época)    │  │ consecutivos        │  ║
║  │ Feminina liderou.   │  │                     │  │                     │  ║
║  │                     │  │                     │  │                     │  ║
║  │     👁️    ⋯          │  │     👁️    ⋯          │  │     👁️    ⋯          │  ║
║  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘  ║
║                                                                               ║
║               [Ver mais insights (8)] • [💡 Como estou indo?]                ║
║                                                                               ║
║    💬 "Notei que você sempre age rápido em insights de estoque.              ║
║        Destacando esses para você primeiro!"                                 ║
║                                                                               ║
║                                        ┌─ CHAT EXPANDIDO ─────────────────┐ ║
║                                        │ 🤖 Assistente IA                 │ ║
║                                        │                                   │ ║
║                                        │ 💭 Como posso te ajudar com os    │ ║
║                                        │    insights de hoje?              │ ║
║                                        │                                   │ ║
║                                        │ 💡 Sugestões:                     │ ║
║                                        │ • Por que calçados têm estoque    │ ║
║                                        │   baixo em várias lojas?          │ ║
║                                        │ • Como corrigir inconsistência    │ ║
║                                        │   de preços rapidamente?          │ ║
║                                        │ • Quais tênis promover enquanto   │ ║
║                                        │   calçados estão em falta?        │ ║
║                                        │                                   │ ║
║                                        │ ┌─────────────────────────────────┐ │ ║
║                                        │ │ Digite sua pergunta...          │ │ ║
║                                        │ └─────────────────────────────────┘ │ ║
║                                        └───────────────────────────────────┘ ║
║                                                                               ║
║           ┌────────────────────────────────────────────────────────────────┐ ║
║           │ 🤖💬 Converse comigo sobre seus insights...                 ⚡ │ ║
║           └────────────────────────────────────────────────────────────────┘ ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### Variação para Período da Tarde

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                   AXON                                       ║
║                                                                               ║
║                        Boa tarde, Loja Exemplo!                             ║
║                   Vamos ver como o dia está evoluindo                       ║
║                                                                               ║
║        Segunda-feira, 30 de Junho • 15:20  •  4 de 9 insights               ║
║                                                                               ║
║  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐  ║
║  │ 🔴 URGENTE AGORA    │  │ 🎉 CONQUISTA        │  │ 🟢 OPORTUNIDADE     │  ║
║  │    🔥 Novo hoje      │  │    📈 +40% hoje      │  │    ⏰ Até amanhã     │  ║
║  │                     │  │                     │  │                     │  ║
║  │ Loja Centro ficou   │  │ Tênis Nike bateram  │  │ Promoção de Bolsas  │  ║
║  │ sem estoque de      │  │ recorde de vendas   │  │ termina amanhã.     │  ║
║  │ Calçados Femininos  │  │ em um só dia!       │  │ Últimas 12 unidades │  ║
║  │ (produto em alta)   │  │ 47 pares vendidos   │  │ podem esgotar.      │  ║
║  │                     │  │                     │  │                     │  ║
║  │                     │  │                     │  │                     │  ║
║  │     👁️    ⋯          │  │     👁️    ⋯          │  │     👁️    ⋯          │  ║
║  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘  ║
║                                                                               ║
║  ┌─────────────────────┐                                                     ║
║  │ 🔵 PLANEJAMENTO     │              [Ver resumo do dia]                    ║
║  │    📅 Para amanhã    │                                                     ║
║  │                     │                                                     ║
║  │ 3 produtos precisam │                                                     ║
║  │ de reposição para   │                                                     ║
║  │ não faltar estoque  │                                                     ║
║  │ amanhã              │                                                     ║
║  │                     │                                                     ║
║  │     👁️    ⋯          │                                                     ║
║  └─────────────────────┘                                                     ║
║                                                                               ║
║    🎯 Streak de 7 dias resolvendo insights críticos rapidamente!             ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

## Melhorias Incorporadas no Mockup

### 🎯 **Limite Inteligente de Insights**

- **Mostra**: "6 de 14 insights" - indica quantos existem vs quantos estão sendo exibidos
- **Benefício**: Não sobrecarrega o usuário, mas mostra transparência sobre quantidade total
- **Interação**: Botão "Ver mais insights (8)" para acessar os restantes

### 🔗 **Insights Conectados**

- **Indicador**: Ícone "↗️ CONECTADO" e botão 🔗 em insights relacionados
- **Exemplo**: Estoque crítico + produto similar em alta = sugestão de promoção
- **Benefício**: Transforma problemas em oportunidades através de conexões inteligentes

### ⏰ **Personalização Temporal**

- **Manhã**: "insights desta manhã" + foco em planejamento do dia
- **Tarde**: "como o dia está evoluindo" + foco em urgências e próximos passos
- **Contexto**: Adapta prioridades baseado no horário do dia

### 📊 **Feedback Sutil e Aprendizado**

- **Indicadores**: "⭐ 95% úteis" nos cards de conquista
- **Mensagem**: "Notei que você sempre age rápido em insights de estoque"
- **Gamificação**: "🎯 Streak de 7 dias resolvendo insights críticos"

### 🏷️ **Contexto Inteligente**

- **Exemplo**: "8 produtos com menos de 5 unidades (normal para esta época)"
- **Benefício**: Evita alarmes falsos, contextualiza baseado em sazonalidade
- **Urgência**: "🔥 Novo hoje" para destacar situações que mudaram

### ⚡ **Indicadores de Tempo e Urgência**

- **Novos**: "🔥 Novo hoje" para insights que surgiram recentemente
- **Tendência**: "📈 +40% hoje" para mostrar evolução em tempo real
- **Prazo**: "⏰ Até amanhã" para indicar janela de ação

### 💡 **Autoavaliação do Sistema**

- **Botão**: "💡 Como estou indo?" para feedback do usuário
- **Benefício**: Permite ao sistema aprender e melhorar continuamente
- **Transparência**: Mostra que o sistema quer melhorar para o usuário

### 💬 **Campo de Chat Flutuante com IA**

- **Posição**: Centro inferior da tela, flutuante sobre o conteúdo
- **Funcionalidade**: Conversa contextual sobre insights exibidos
- **Sugestões**: "Por que tenho estoque baixo?" • "Como resolver preços inconsistentes?"
- **Proatividade**: IA oferece análises baseadas nos insights clicados pelo usuário

## Detalhamento Técnico

### Componentes Principais

1. **InsightsHomePage** - Componente principal da página
2. **WelcomeHeader** - Header com saudação personalizada
3. **InsightCard** - Card individual de insight
4. **InsightBadge** - Badge de tipo/prioridade
5. **InsightDrawer** - Drawer de detalhes
6. **InsightActionsMenu** - Menu de ações
7. **FloatingChat** - Campo de chat flutuante com IA
8. **ChatSuggestions** - Sistema de sugestões contextuais
9. **ChatInterface** - Interface expandida de conversa

### Estrutura de Dados

```typescript
interface Insight {
  id: string;
  type: "critical" | "attention" | "moderate" | "opportunity" | "achievement";
  title: string;
  description: string;
  naturalLanguageText: string;
  data: {
    products?: Product[];
    stores?: Store[];
    suppliers?: Supplier[];
    metrics?: Metric[];
  };
  actions: InsightAction[];
  createdAt: Date;
  seenAt?: Date;
  dismissedUntil?: Date;
}

interface InsightAction {
  id: string;
  label: string;
  type: "navigation" | "task" | "share" | "dismiss";
  payload: any;
}

interface ChatMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  relatedInsightId?: string;
  suggestions?: string[];
}

interface ChatState {
  isOpen: boolean;
  isExpanded: boolean;
  messages: ChatMessage[];
  currentContext?: Insight;
  suggestions: string[];
  isTyping: boolean;
}
```

## Sistema de Chat com IA

### Funcionalidades Core

#### **1. Contexto Inteligente**
- **Awareness de Insights**: Chat conhece todos os insights visíveis na tela
- **Referências Automáticas**: Pode referenciar dados específicos dos cards
- **Conexões**: Entende relações entre insights diferentes

#### **2. Sugestões Contextuais**
```typescript
const generateSuggestions = (insights: Insight[]) => {
  const suggestions = [];
  
  insights.forEach(insight => {
    switch(insight.type) {
      case 'critical':
        suggestions.push(`Como resolver urgentemente: ${insight.title}`);
        break;
      case 'opportunity': 
        suggestions.push(`Como aproveitar: ${insight.title}`);
        break;
      case 'achievement':
        suggestions.push(`Análise detalhada: ${insight.title}`);
        break;
    }
  });
  
  return suggestions;
};
```

#### **3. Tipos de Conversas Suportadas**

**Análise Exploratória**
- "Por que isso está acontecendo?"
- "Mostre-me dados históricos"
- "Compare com o mês passado"

**Ações Práticas**
- "O que devo fazer agora?"
- "Como resolver isso passo a passo?"
- "Quem precisa ser notificado?"

**Prevenção e Planejamento**
- "Como evitar no futuro?"
- "Quando devo verificar novamente?"
- "Que métricas monitorar?"

#### **4. Estados da Interface**

**Minimizado (Padrão)**
```
┌────────────────────────────────────────────────────────────────┐
│ 🤖💬 Converse comigo sobre seus insights...                 ⚡ │
└────────────────────────────────────────────────────────────────┘
```

**Focado (Com Sugestões)**
```
┌────────────────────────────────────────────────────────────────┐
│ 💡 Sugestões rápidas:                                          │
│ • Por que calçados têm estoque baixo?                         │
│ • Como corrigir preços inconsistentes?                        │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ Digite sua pergunta...                                   │   │
│ └──────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
```

**Expandido (Conversa Completa)**
```
┌─ ASSISTENTE IA ──────────────────────────────────────────────┐
│ 🤖 Entendi que você quer saber sobre o estoque baixo.       │
│                                                              │
│ 📊 Análise: Os 3 produtos de calçados estão com estoque     │
│ baixo porque tiveram 40% mais vendas que o normal nos       │
│ últimos 7 dias. Isso coincide com o início do inverno.      │
│                                                              │
│ 🎯 Recomendações:                                           │
│ 1. Reabastecer urgentemente - prazo: até amanhã            │
│ 2. Promover tênis similares enquanto isso                  │
│ 3. Ajustar previsão para próxima temporada                 │
│                                                              │
│ ❓ Quer que eu crie tarefas para isso?                     │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ Sim, criar tarefas  │  Ver histórico  │  Próxima ação │   │
│ └────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### Integração com Insights

#### **Clique em Insight → Contexto Automático**
```typescript
const handleInsightClick = (insight: Insight) => {
  setChatContext(insight);
  
  const contextualSuggestions = [
    `Explique este insight: ${insight.naturalLanguageText}`,
    `Como resolver: ${insight.title}`,
    `Mostre dados relacionados`,
    `Criar plano de ação`
  ];
  
  setChatSuggestions(contextualSuggestions);
  
  if (!chatState.isOpen) {
    setChatState({ ...chatState, isOpen: true });
  }
};
```

#### **Proatividade da IA**
```typescript
const proactiveMessages = {
  multipleStockIssues: "Notei vários produtos com estoque baixo. Quer que eu analise o padrão?",
  priceInconsistency: "Encontrei inconsistências de preço. Posso ajudar a corrigi-las rapidamente?",
  opportunityDetected: "Identifiquei uma oportunidade de cross-sell. Interessado?",
  achievementReached: "Parabéns pela meta! Quer análise do que funcionou bem?"
};
```

### Integração com Sistema Existente

- **Módulos**: Integrar com módulos de estoque, vendas, fornecedores
- **Analytics**: Usar dados do sistema de analytics para gerar insights
- **Alertas**: Converter alertas existentes em insights em linguagem natural
- **Relatórios**: Extrair pontos-chave dos relatórios para insights

## Fluxo de Implementação

### Fase 1: Estrutura Base

- [ ] Criar componente InsightsHomePage
- [ ] Implementar WelcomeHeader
- [ ] Criar InsightCard base
- [ ] Configurar badges de tipo

### Fase 2: Funcionalidades Core

- [ ] Implementar InsightDrawer
- [ ] Criar sistema de ações
- [ ] Implementar FloatingChat básico
- [ ] Adicionar sistema de sugestões contextuais
- [ ] Integrar com dados mockados
- [ ] Adicionar animações e transições

### Fase 3: Integração Real

- [ ] Conectar com APIs de dados
- [ ] Implementar geração de insights
- [ ] Integrar IA conversacional (GPT/Claude)
- [ ] Criar sistema de contexto inteligente do chat
- [ ] Criar sistema de notificações
- [ ] Adicionar persistência de estado e conversas

### Fase 4: Refinamentos

- [ ] Otimizar performance
- [ ] Adicionar testes
- [ ] Melhorar acessibilidade
- [ ] Ajustes de UX baseados em feedback

## Considerações de Design

### Responsividade

- **Desktop**: Grid de 3 colunas
- **Tablet**: Grid de 2 colunas
- **Mobile**: Grid de 1 coluna

### Acessibilidade

- Contraste adequado em todos os badges
- Suporte a navegação por teclado
- Screen reader friendly
- Textos alternativos em ícones

### Performance

- Lazy loading de insights não visíveis
- Virtualização para muitos insights
- Otimização de re-renders
- Cache de dados processados

## Métricas de Sucesso

- **Engagement**: Tempo gasto na página home
- **Conversão**: Ações tomadas a partir dos insights
- **Satisfação**: Feedback dos usuários sobre utilidade
- **Eficiência**: Redução no tempo para identificar problemas

---

_Documento criado em: 30 de Junho de 2024_  
_Status: Planejamento_  
_Próximos passos: Aprovação e início da implementação_
