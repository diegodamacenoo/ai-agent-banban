# Context Documentation

## 🎯 Objetivo

Esta pasta contém documentação **super concisa** para maximizar o entendimento da IA sobre o sistema e reduzir uso de tokens. Cada documento é otimizado para fornecer contexto essencial sem verbosidade.

## 📁 Estrutura

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
- `module-development-guide.md` - Criação de módulos
- `templates/` - Templates e generators

### **⚙️ 05-operations/**
- `module-lifecycle-system.md` - Ciclo de vida dos módulos

### **🗄️ 06-database/** *(Novo)*
- `schema-reference.md` - Schema completo e RLS policies

### **📝 07-types/** *(Novo)*
- `typescript-reference.md` - Tipos principais consolidados

### **🔐 08-server-actions/** *(Novo)*
- `patterns-guide.md` - Padrões para Server Actions

### **🛡️ 09-security/** *(Novo)*
- `rls-security-guide.md` - Segurança e políticas RLS
- `session-tracking-guide.md` - Sistema de tracking de sessões automático

### **🧪 10-testing/** *(Novo)*
- `testing-strategy.md` - Estratégias de teste

### **⚡ 11-backend/** *(Novo)*
- `fastify-patterns.md` - Arquitetura do backend Fastify

### **📊 12-logging-debug/** *(Novo)*
- `conditional-debug-system.md` - Sistema de debug controlável via interface

## 🎯 Como Usar

### **Para IA/Claude:**
1. **Consulte primeiro** este contexto antes de analisar código
2. **Use como referência** para padrões e convenções
3. **Evite reinventar** padrões já documentados

### **Para Desenvolvedores:**
1. **Leia overview.md** para entender a arquitetura
2. **Consulte patterns-conventions.md** para padrões de código
3. **Use templates/** para criar novos módulos

## 🔑 Documentos Críticos

### **Para Entendimento Geral:**
- `02-architecture/overview.md` - Visão completa do sistema
- `02-architecture/client-modules-architecture.md` - Sistema modular

### **Para Desenvolvimento:**
- `02-architecture/patterns-conventions.md` - Padrões obrigatórios
- `08-server-actions/patterns-guide.md` - Server Actions
- `07-types/typescript-reference.md` - Tipos principais

### **Para Banco de Dados:**
- `06-database/schema-reference.md` - Schema e RLS completos

### **Para Segurança:**
- `09-security/rls-security-guide.md` - Políticas de segurança
- `09-security/session-tracking-guide.md` - Sistema de tracking de sessões

### **Para Logging:**
- `12-logging-debug/conditional-debug-system.md` - Sistema de debug controlável

## ⚡ Eficiência de Tokens

### **Antes (sem context/):**
- IA precisa ler múltiplos arquivos grandes
- ~5000-10000 tokens para entender padrões
- Risco de inconsistências

### **Agora (com context/):**
- Documentação concisa e focada
- ~1000-2000 tokens para contexto completo
- Padrões garantidos e consistentes

## 🔄 Atualizações

Mantenha esta documentação **sempre atualizada** quando:
- Mudanças na arquitetura
- Novos padrões estabelecidos  
- Alterações no schema do banco
- Novas convenções de segurança

## 📋 Checklist para Novos Documentos

Ao criar novos documentos de contexto:

- [ ] **Concisão:** Máximo 200 linhas
- [ ] **Foco:** Um tópico específico por documento
- [ ] **Exemplos:** Código prático, não teoria
- [ ] **Padrões:** Templates e anti-patterns
- [ ] **Atualização:** Data de última modificação