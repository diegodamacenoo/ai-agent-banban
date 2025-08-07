# Context Documentation Index

## 🎯 Objetivo

Esta pasta contém documentação **super concisa** para maximizar o entendimento da IA sobre o sistema e reduzir uso de tokens. Cada documento é otimizado para fornecer contexto essencial sem verbosidade.

---

## 🚀 Guias por Cenário de Desenvolvimento

### **📦 Implementação de Módulos**
Sequência obrigatória de leitura:
1. `02-architecture/overview.md` - Entendimento da arquitetura geral
2. `02-architecture/client-modules-architecture.md` - Sistema modular detalhado
3. `04-development/module-development-guide.md` - Guia completo de criação
4. `04-development/templates/` - Templates e generators
5. `08-server-actions/patterns-guide.md` - Padrões para Server Actions
6. `06-database/schema-reference.md` - Schema e estruturas de dados
7. `07-types/typescript-reference.md` - Tipos TypeScript essenciais

### **🔧 Manutenção e Operações**
Sequência recomendada:
1. `05-operations/module-lifecycle-system.md` - Ciclo de vida dos módulos
2. `04-development/refactoring-patterns.md` - Padrões de refatoração comprovados
3. `12-troubleshooting/module-lifecycle-patterns.md` - Resolução de problemas
4. `12-logging-debug/conditional-debug-system.md` - Sistema de debug
5. `09-security/session-tracking-guide.md` - Monitoramento de sessões

### **🗄️ Trabalho com Banco de Dados**
Documentos essenciais:
1. `06-database/schema-reference.md` - Schema completo e RLS policies
2. `06-database/supabase-function-patterns.md` - Padrões de funções
3. `09-security/rls-security-guide.md` - Segurança e políticas RLS
4. `08-server-actions/cache-patterns.md` - Padrões de cache

### **🔐 Implementações de Segurança**
Leituras obrigatórias:
1. `09-security/rls-security-guide.md` - Políticas de segurança
2. `09-security/session-tracking-guide.md` - Sistema de tracking
3. `09-security/session-termination-system.md` - Encerramento de sessões via admin
4. `06-database/schema-reference.md` - Estruturas seguras
5. `08-server-actions/patterns-guide.md` - Validação em Server Actions

### **🧪 Desenvolvimento de Testes**
Documentos de referência:
1. `10-testing/testing-strategy.md` - Estratégias e padrões
2. `02-architecture/patterns-conventions.md` - Convenções para testes
3. `07-types/typescript-reference.md` - Tipos para testes

### **⚡ Backend e APIs**
Sequência para backend:
1. `11-backend/fastify-patterns.md` - Arquitetura do backend
2. `03-apis-integrations/apis-overview.md` - Visão geral das APIs
3. `03-apis-integrations/webhooks-guide.md` - Sistema de webhooks
4. `08-server-actions/patterns-guide.md` - Integração com frontend

### **🐛 Debug e Troubleshooting**
Sistema de debug avançado:
1. `12-logging-debug/conditional-debug-system.md` - Sistema controlável via UI
2. `12-troubleshooting/module-troubleshooting-essentials.md` - Problemas comuns
3. `01-getting-started/troubleshooting.md` - Problemas de setup

---

## 📁 Estrutura Completa

### **🚀 01-getting-started/**
- `quick-start.md` - Setup rápido do projeto
- `troubleshooting.md` - Problemas comuns e soluções

### **🏗️ 02-architecture/**
- `overview.md` - Visão geral da arquitetura modernizada
- `client-modules-architecture.md` - Sistema de módulos por cliente
- `patterns-conventions.md` - Padrões de código e convenções

### **🔌 03-apis-integrations/**
- `apis-overview.md` - Visão geral das APIs
- `webhooks-guide.md` - Sistema de webhooks

### **💻 04-development/**
- `module-development-guide.md` - Criação de módulos completo
- `system-configurations-guide.md` - Configurações de sistema
- `refactoring-patterns.md` - Padrões comprovados de refatoração
- `templates/` - Templates e generators
- `EXAMPLE_USAGE.md` - Exemplos práticos

### **⚙️ 05-operations/**
- `module-lifecycle-system.md` - Ciclo de vida dos módulos

### **🗄️ 06-database/**
- `schema-reference.md` - Schema completo e RLS policies
- `supabase-function-patterns.md` - Padrões de funções do banco

### **📝 07-types/**
- `typescript-reference.md` - Tipos principais consolidados

### **🔐 08-server-actions/**
- `patterns-guide.md` - Estrutura padrão de Server Actions
- `cache-patterns.md` - Padrões de cache e invalidação
- `module-management-patterns.md` - Gerenciamento de módulos

### **🛡️ 09-security/**
- `rls-security-guide.md` - Segurança e políticas RLS
- `session-tracking-guide.md` - Sistema de tracking de sessões automático
- `session-termination-system.md` - Sistema completo de encerramento de sessões via admin

### **🧪 10-testing/**
- `testing-strategy.md` - Estratégias de teste

### **⚡ 11-backend/**
- `fastify-patterns.md` - Arquitetura do backend Fastify

### **📊 12-logging-debug/**
- `conditional-debug-system.md` - Sistema de debug controlável via UI

### **🔍 12-troubleshooting/**
- `module-lifecycle-patterns.md` - Troubleshooting do ciclo de vida
- `module-troubleshooting-essentials.md` - Resolução de problemas essenciais

---

## 🎯 Fluxos de Trabalho Específicos

### **Para IA/Claude:**
1. **SEMPRE** consulte este index primeiro
2. **Identifique o cenário** de desenvolvimento
3. **Siga a sequência** de documentos recomendada
4. **Evite reinventar** padrões já documentados
5. **Atualize context/** quando criar novos padrões

### **Para Desenvolvedores:**
1. **Use os guias por cenário** acima
2. **Consulte templates/** para acelerar desenvolvimento
3. **Mantenha documentação atualizada**

---

## ⚡ Eficiência de Tokens

### **Antes (sem context/):**
- IA precisa ler múltiplos arquivos grandes
- ~5000-10000 tokens para entender padrões
- Risco de inconsistências

### **Agora (com context/):**
- Documentação concisa e focada por cenário
- ~1000-2000 tokens para contexto específico
- Padrões garantidos e consistentes

---

## 🔄 Manutenção da Documentação

### **Quando Atualizar:**
- Mudanças na arquitetura
- Novos padrões estabelecidos
- Alterações no schema do banco
- Novas convenções de segurança
- Criação de novos módulos ou funcionalidades

### **Checklist para Novos Documentos:**
- [ ] **Concisão:** Máximo 200 linhas
- [ ] **Foco:** Um tópico específico por documento
- [ ] **Exemplos:** Código prático, não teoria
- [ ] **Padrões:** Templates e anti-patterns
- [ ] **Atualização:** Data de última modificação
- [ ] **Integração:** Adicionado aos guias por cenário relevantes

### **Responsabilidades:**
- **IA/Claude:** Atualizar context/ quando criar novos padrões
- **Desenvolvedores:** Manter documentação sincronizada com mudanças