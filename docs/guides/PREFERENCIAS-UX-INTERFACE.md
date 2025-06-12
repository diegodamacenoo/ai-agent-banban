# 🎨 Preferências de UX e Interface

## 📋 **Preferências Gerais**

Este documento registra as preferências estabelecidas para a interface e experiência do usuário no projeto.

---

## 🎯 **Layout e Estrutura**

### **Layout Preferido: Seções em Linha (Stacked)**
- ✅ **Preferir**: Seções verticais, uma abaixo da outra
- ❌ **Evitar**: Sistema de tabs/abas para navegação
- 📝 **Rationale**: Interface mais limpa, direta e sem complexidade de navegação

### **Exemplo Preferido:**
```
┌─ Título da Página ───────────────────┐
│                                      │
├─ 📋 Seção 1: Dados Principais ──────┤
│  └─ Conteúdo da seção               │
│                                      │
├─ 🗑️ Seção 2: Itens Excluídos ───────┤ (condicional)
│  └─ Conteúdo da seção               │
│                                      │
├─ ✉️ Seção 3: Configurações ──────────┤
│  └─ Conteúdo da seção               │
└──────────────────────────────────────┘
```

---

## ⚡ **Experiência de Usuário (UX)**

### **Updates Otimistas - Interface Fluida**
- ✅ **Implementar**: Atualizações imediatas na interface
- ❌ **Evitar**: Refreshes completos da página
- 🎯 **Objetivo**: Eliminar loadings desnecessários e fornecer feedback instantâneo

### **Fluxo Otimista Preferido:**
```
1. Usuário executa ação (ex: excluir item)
2. Interface atualiza IMEDIATAMENTE
3. Server action executa em background
4. Em caso de erro, reverte e mostra erro
```

### **Benefícios:**
- Interface responsiva e fluida
- Feedback imediato ao usuário
- Menor percepção de latência
- Experiência mais profissional

---

## 🔧 **Componentes e Interações**

### **Tooltips**
- ✅ **Preferir**: Solução shadcn/ui com estrutura adequada
- ❌ **Evitar**: Tooltips nativos HTML simples
- 📝 **Implementação**: `TooltipProvider` > `Tooltip` > `TooltipTrigger` + `TooltipContent`

### **Feedbacks Visuais**
- ✅ **Toast notifications** para ações executadas
- ✅ **Loading states** mínimos e apenas quando necessário
- ✅ **Estados visuais** diferenciados (ativo, inativo, excluído)

### **Ações Destrutivas**
- ✅ **Soft delete** como padrão (reversível)
- ✅ **Hard delete** apenas para exclusões permanentes
- ✅ **Diálogos de confirmação** claros e informativos
- ✅ **Avisos visuais** para ações irreversíveis

---

## 🎨 **Design System**

### **Cores e Estados**
- 🟢 **Verde**: Ações de restauração/confirmação
- 🔴 **Vermelho claro**: Soft delete (reversível)
- 🔴 **Vermelho escuro**: Hard delete (permanente)
- 🔵 **Azul**: Ações neutras/edição
- ⚪ **Cinza**: Estados inativos

### **Layout Responsivo**
- ✅ **Mobile-first** approach
- ✅ **Espaçamentos consistentes** (space-y-4, space-y-6, space-y-8)
- ✅ **Componentes modulares** e reutilizáveis

---

## 📊 **Dados e Estados**

### **Indicadores Visuais**
- ✅ **Badges com contadores** para quantidades
- ✅ **Estados visuais** diferenciados por cor/opacidade
- ✅ **Informações contextuais** (datas, status)

### **Gestão de Estados**
- ✅ **Estados condicionais** (mostrar seção apenas se houver dados)
- ✅ **Loading states** não intrusivos
- ✅ **Error handling** graceful com fallbacks

---

## 🔄 **Patterns de Implementação**

### **Server Actions**
- ✅ **Remover** `revalidatePath()` para evitar refreshes
- ✅ **Updates locais** otimistas no frontend
- ✅ **Sincronização** em background

### **Component Structure**
- ✅ **Componentização** em blocos coesos
- ✅ **Props opcionais** para callbacks otimistas
- ✅ **Separation of concerns** entre UI e lógica

### **Data Flow**
```
User Action → Optimistic Update → Server Action (bg) → Error Handling
```

---

## 📝 **Notas de Implementação**

### **Histórico de Decisões**
- **2024**: Migração de tabs para seções em linha
- **2024**: Implementação de updates otimistas para fluidez
- **2024**: Adoção de tooltips shadcn estruturados

### **Lições Aprendidas**
- Updates otimistas drasticamente melhoram a percepção de performance
- Seções em linha são mais intuitivas que tabs complexas
- Feedback visual imediato é fundamental para UX

---

## 🎯 **Próximas Implementações**

### **Sugestões para Futuras Features**
- Implementar same patterns em outras áreas
- Considerar animações sutis para transições
- Manter consistência de padrões em todo o sistema

---

**Última atualização**: Dezembro 2024  
**Responsável**: Sistema de gestão de usuários como referência 