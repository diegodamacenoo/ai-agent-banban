# Plano de Migração - Sistema Debug Condicional

**Data de Criação:** 2025-01-21  
**Status:** Planejamento  
**Responsável:** Sistema de Configurações Automáticas  

## 🎯 Objetivo

Migração gradual dos logs `console.*` existentes para o sistema `conditionalDebugLog` baseado em prioridades e impacto, sem quebrar funcionalidades existentes.

## 📊 Estado Atual

- **1.142 ocorrências** de `console.*` em **151 arquivos**
- **747 console.error/warn** (maioria deve permanecer)  
- **395 console.log/debug/info** (~30-40% candidatos à migração)
- **Sistema condicional 100% funcional** com interface administrativa

## 🗂️ Estrutura do Plano

```
planning/logging-debug-migration/
├── README.md                    # Este arquivo
├── MIGRATION_PHASES.md          # Fases detalhadas de migração
├── PRIORITY_CLASSIFICATION.md   # Classificação por prioridade
├── TESTING_STRATEGY.md          # Estratégias de teste
└── PROGRESS_TRACKING.md         # Acompanhamento do progresso
```

## ⚡ Resumo Executivo

### **Filosofia da Migração**
- **Gradual e não-disruptiva** - sistema atual continua funcionando
- **Baseada em valor** - migrar apenas logs úteis para diagnóstico administrativo
- **Estratégica** - priorizar módulos críticos e de alto impacto

### **Critérios de Migração**
Migrar para `conditionalDebugLog` APENAS quando:
1. Log seria útil para **diagnóstico administrativo**
2. Informação sobre **comportamento interno** relevante
3. **Troubleshooting** que admins podem precisar ativar
4. **Fluxos de configuração** e automação

### **Manter console.* quando:**
1. **Erros críticos** sempre visíveis
2. **Logs temporários** de desenvolvimento
3. **Status de aplicação** essenciais
4. **Bibliotecas externas** não controláveis

## 🎯 Metas por Fase

### **Fase 1: Fundação** (1-2 semanas)
- Migrar módulos administrativos críticos
- Estabelecer padrões e exemplos
- **Meta:** 20-30 arquivos migrados

### **Fase 2: Expansão** (2-3 semanas)  
- Migrar serviços core e middleware
- Documentar lições aprendidas
- **Meta:** 50-70 arquivos migrados

### **Fase 3: Consolidação** (1-2 semanas)
- Finalizar módulos restantes
- Limpeza e otimização
- **Meta:** 80-100 arquivos migrados

## 📈 KPIs de Sucesso

- **Redução de ruído:** Menos logs irrelevantes em produção
- **Visibilidade administrativa:** Logs úteis controláveis via interface
- **Performance:** Não degradação de performance
- **Estabilidade:** Zero quebras funcionais durante migração

## 🔗 Recursos

- **Interface de Controle:** `/admin/modules/management` → "Sistema e Depuração"
- **Documentação:** `/context/12-logging-debug/conditional-debug-system.md`
- **Funções Core:** `system-config-utils.ts`

## 📝 Próximos Passos

1. **Ler MIGRATION_PHASES.md** para cronograma detalhado
2. **Consultar PRIORITY_CLASSIFICATION.md** para critérios específicos
3. **Implementar Fase 1** com módulos de alta prioridade
4. **Acompanhar progresso** via PROGRESS_TRACKING.md