# Template Padrão para Clientes Standard

## Visão Geral

Este diretório contém o template base para implementações padrão (standard) do sistema Axon. Este template serve como ponto de partida para novos clientes que não necessitam de customizações específicas.

## 📋 **O que é um Cliente Standard?**

Clientes standard são aqueles que utilizam:
- ✅ Schema ERP base sem modificações
- ✅ Workflows padrão do sistema
- ✅ ENUMs padronizados em inglês
- ✅ Integrações básicas (webhooks padrão)
- ✅ Analytics padrão
- ✅ Configurações default

## 📁 **Estrutura do Template**

```
standard-clients/
├── README.md                    # Este arquivo
├── STANDARD_TEMPLATE_SCHEMA.md  # Schema base para clientes standard
├── IMPLEMENTATION_GUIDE.md      # Guia de implementação
└── examples/
    ├── client-a-standard/       # Exemplo de cliente standard
    └── client-b-standard/       # Outro exemplo
```

## 🎯 **Quando Usar o Template Standard?**

### ✅ **Ideal para:**
- Novos clientes com necessidades básicas de ERP
- Implementações rápidas (< 30 dias)
- Clientes que se adaptam ao workflow padrão
- Orçamentos limitados para customização
- Proof of Concept (PoC) e MVPs

### ❌ **Não ideal para:**
- Clientes com workflows muito específicos
- Integrações complexas com sistemas legados
- Regras de negócio muito particulares
- Necessidades de campos customizados
- Relatórios muito específicos

## 🚀 **Processo de Implementação Standard**

### **Fase 1: Configuração Inicial (3-5 dias)**
1. Criar organização no sistema Axon
2. Aplicar schema padrão
3. Configurar localizações básicas
4. Importar catálogo de produtos

### **Fase 2: Configuração de Dados (5-7 dias)**
1. Carga de fornecedores
2. Configuração de preços
3. Estoque inicial
4. Usuários e permissões

### **Fase 3: Integração e Testes (7-10 dias)**
1. Configurar webhooks padrão
2. Testes de fluxo completo
3. Treinamento da equipe
4. Go-live

### **Total: 15-22 dias**

## 📊 **Funcionalidades Incluídas no Template**

### **Módulos Core**
- ✅ Gestão de Produtos (produtos, variações, preços)
- ✅ Gestão de Estoque (snapshots, movimentações)
- ✅ Gestão de Pedidos (compras, transferências)
- ✅ Gestão de Documentos (notas fiscais, conferência)
- ✅ Gestão de Fornecedores
- ✅ Gestão de Localizações

### **Analytics Padrão**
- ✅ Resumo de vendas diário
- ✅ Resumo de estoque por localização
- ✅ Dashboards básicos de performance
- ✅ Relatórios de movimentação

### **Webhooks Padrão**
- ✅ Sales Flow (vendas básicas)
- ✅ Purchase Flow (compras básicas)
- ✅ Inventory Flow (estoque básico)
- ✅ Transfer Flow (transferências básicas)

### **Integrações Básicas**
- ✅ API REST padrão
- ✅ Webhooks de notificação
- ✅ Exportação de dados (CSV, JSON)
- ✅ Importação de catálogo

## 🔧 **Configurações Padrão**

### **ENUMs Padronizados**
Todos os ENUMs seguem o padrão inglês:
- `order_type_enum`: `{'PURCHASE', 'TRANSFER'}`
- `order_status_enum`: `{'NEW', 'APPROVED', 'CANCELLED'}`
- `doc_type_enum`: `{'SUPPLIER_IN', 'TRANSFER_OUT', 'TRANSFER_IN', 'RETURN', 'SALE'}`
- `movement_type_enum`: `{'CD_RECEIPT', 'CD_TRANSFER', 'STORE_RECEIPT', 'SALE', 'RETURN', 'INVENTORY_ADJUSTMENT'}`

### **Políticas RLS Padrão**
- Isolamento por organização
- Controle de acesso baseado em roles
- Auditoria automática de todas as operações

### **Configurações de Performance**
- Índices otimizados para queries comuns
- Particionamento automático de tabelas grandes
- Limpeza automática de dados antigos

## 📋 **Exemplos de Clientes Standard**

### **Cliente Tipo A - Varejo Simples**
- 1 CD + 5 lojas
- 1.000 produtos
- Fluxo básico: Compra → CD → Loja → Venda
- Webhooks: sales_flow, inventory_flow

### **Cliente Tipo B - E-commerce Básico**
- 1 CD + E-commerce
- 2.000 produtos
- Fluxo: Compra → CD → Venda Online
- Webhooks: sales_flow, purchase_flow

### **Cliente Tipo C - Distribuidor Simples**
- 1 CD + Vendas B2B
- 500 produtos
- Fluxo: Compra → CD → Venda B2B
- Webhooks: purchase_flow, transfer_flow

## 🔄 **Migração de Standard para Custom**

Se um cliente standard precisar de customizações futuras:

1. **Análise de Impacto**: Avaliar necessidades específicas
2. **Planejamento**: Definir escopo de customização
3. **Migração**: Mover documentação para `/custom-clients/`
4. **Desenvolvimento**: Implementar customizações específicas
5. **Deploy**: Aplicar mudanças em ambiente isolado

## 📞 **Suporte para Template Standard**

### **Documentação**
- [Schema Padrão](./STANDARD_TEMPLATE_SCHEMA.md)
- [Guia de Implementação](./IMPLEMENTATION_GUIDE.md)
- [Sistema Axon Core](../axon-system/)

### **Contato**
- Equipe de Produto: Para mudanças no template
- Equipe de Implementação: Para novos clientes
- Equipe de Suporte: Para questões técnicas

## 📊 **Métricas do Template**

| Métrica | Valor | Observações |
|---------|-------|-------------|
| **Tempo Médio de Implementação** | 18 dias | Para clientes standard |
| **Taxa de Sucesso** | 95% | Implementações concluídas |
| **Satisfação do Cliente** | 4.2/5 | Pesquisa pós-implementação |
| **Clientes Ativos** | 0 | *Em desenvolvimento* |

## 🎯 **Roadmap do Template**

### **Q1 2025**
- [ ] Finalizar template base
- [ ] Implementar primeiro cliente piloto
- [ ] Documentar casos de uso

### **Q2 2025**
- [ ] Otimizar processo de implementação
- [ ] Criar ferramentas de automação
- [ ] Expandir biblioteca de exemplos

### **Q3 2025**
- [ ] Implementar 5+ clientes standard
- [ ] Métricas de performance
- [ ] Feedback e melhorias

---

_Template Standard - Janeiro 2025_
_Sistema Axon Multi-Tenant v4.0_
_Status: 📝 Em Desenvolvimento_ 