# Plano de Migração - Fase 3 (Final)
> Migração das tabelas core_ restantes para o sistema genérico tenant_business_*

## 1. Visão Geral

### 1.1 Objetivo
Migrar as últimas tabelas específicas do Banban para o novo sistema genérico, completando a transição para uma arquitetura verdadeiramente multi-tenant.

### 1.2 Tabelas Pendentes
- `core_documents` (8 registros)
- `core_document_items` (2 registros)
- `core_orders` (10 registros)
- `core_movements` (1 registro)
- `core_events` (219 registros)
- `core_inventory_snapshots` (480 registros)
- `core_product_pricing` (120 registros)

## 2. Estratégia de Migração

### 2.1 Mapeamento para Tabelas Genéricas

#### tenant_business_entities
- **Pricing (120 registros)**
  - Origem: `core_product_pricing`
  - Tipo: `pricing`
  - Dados: preços, margens, configurações
  - Metadados: datas de cálculo, efetivação

- **Snapshots (480 registros)**
  - Origem: `core_inventory_snapshots`
  - Tipo: `inventory_snapshot`
  - Dados: quantidades, locais, produtos
  - Metadados: datas, tipos de snapshot

#### tenant_business_transactions
- **Documentos (8 registros + 2 itens)**
  - Origem: `core_documents` + `core_document_items`
  - Tipo: `document`
  - Dados: números, fornecedores, valores
  - Itens: produtos, quantidades, preços

- **Ordens (10 registros)**
  - Origem: `core_orders`
  - Tipo: `order`
  - Dados: tipos, datas, status
  - Itens: produtos, quantidades

- **Movimentações (1 registro)**
  - Origem: `core_movements`
  - Tipo: `movement`
  - Dados: origem, destino, motivo
  - Itens: produtos, quantidades

- **Eventos (219 registros)**
  - Origem: `core_events`
  - Tipo: `event`
  - Dados: tipo, entidade, severidade
  - Metadados: fonte, dados específicos

## 3. Plano de Execução

### 3.1 Pré-Migração
1. Criar backups de todas as tabelas
2. Validar estrutura das tabelas genéricas
3. Verificar integridade dos dados existentes
4. Confirmar ID da organização Banban

### 3.2 Execução
1. Executar script `phase3-migrate-remaining-core.sql`
   - Migração em transação única
   - Validações em cada etapa
   - Logs detalhados

2. Ordem de migração:
   - Primeiro: entidades (pricing, snapshots)
   - Segundo: transações (documentos, ordens, movimentos, eventos)

### 3.3 Pós-Migração
1. Validar contagens de registros
2. Verificar integridade dos dados
3. Testar queries de acesso
4. Manter backups por 30 dias

## 4. Estimativas

- **Tempo de Execução**: ~30 minutos
- **Janela de Manutenção**: 2 horas (incluindo backups e validações)
- **Rollback**: ~15 minutos (se necessário)

## 5. Riscos e Mitigações

### 5.1 Riscos Identificados
1. **Perda de Dados**
   - Mitigação: Backups completos antes da migração
   - Rollback: Script de restauração automática

2. **Inconsistência de Dados**
   - Mitigação: Validações em cada etapa
   - Verificação: Queries de contagem e integridade

3. **Impacto em Produção**
   - Mitigação: Execução em horário de baixo uso
   - Monitoramento: Logs e métricas durante migração

### 5.2 Plano de Contingência
1. Em caso de falha:
   - Interromper migração
   - Restaurar backup automaticamente
   - Analisar logs de erro
   - Corrigir e reagendar

2. Em caso de inconsistência:
   - Validar dados específicos
   - Corrigir pontualmente
   - Documentar correções

## 6. Próximos Passos

### 6.1 Pós-Migração
1. Remover tabelas core_ antigas
2. Atualizar documentação
3. Ajustar queries existentes
4. Validar performance

### 6.2 Limpeza
1. Manter backups por 30 dias
2. Arquivar scripts de migração
3. Atualizar documentação técnica

## 7. Aprovações Necessárias

- [ ] Aprovação técnica
- [ ] Janela de manutenção aprovada
- [ ] Plano de rollback validado
- [ ] Equipe de suporte notificada 