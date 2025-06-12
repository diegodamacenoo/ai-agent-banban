# Documento Executivo – Projeto Agente de IA para BanBan  
**Versão:** 1.0  
**Data:** Junho/2025  
**Responsável Técnico:** Diego Henrique Pinheiro Damaceno  

---

## 1. Visão Geral

Este projeto consiste na criação de um agente de Inteligência Artificial voltado para **gestão de produtos e estoque** da BanBan Calçados. Desenvolvido no formato de Agência de IA, o objetivo central é transformar grandes volumes de dados operacionais em **insights acionáveis** que apoiem decisões estratégicas e operacionais nas áreas comercial, logística e de loja.

O projeto foi iniciado com um escopo MVP, visando entregar valor rapidamente e estabelecer uma base escalável para futuras evoluções.

---

## 2. Objetivos do Projeto

- Automatizar análises de estoque, vendas e movimentações.
- Detectar oportunidades de melhoria como lentidão de giro, rupturas ou devoluções excessivas.
- Centralizar a visualização de KPIs (margem, saldo, giro, sell-through).
- Reduzir perdas operacionais e facilitar a tomada de decisões com base em dados reais.
- Integrar-se de forma transparente ao ERP da BanBan, recebendo dados via webhook.

---

## 3. Funcionalidades do MVP

### 3.1. Cadastro Inteligente de Produto
- Validação automática de campos obrigatórios.
- Bloqueio de inconsistências no momento do registro.

### 3.2. Painel Analítico
- Visualização de KPIs por loja, SKU, período e categoria.
- Dashboard com drill-down por categoria.
- Exportação de relatórios em CSV/PDF.

### 3.3. Módulo de Alertas
- Produtos parados (sem venda por X dias).
- Reposição inteligente baseada em cobertura.
- Divergência entre ERP e estoque físico (ex: conferência).
- Otimização de margem (identificação de baixo markup).
- Ponto de reabastecimento automatizado.
- Promoções direcionadas a slow-movers.
- Redistribuição de estoque entre lojas.
- Detecção de picos de devolução.

---

## 4. Arquitetura Técnica

- **Frontend:** Next.js + ShadCN UI  
- **Backend:** APIs no-code via N8N  
- **Banco de Dados:** Supabase (PostgreSQL)  
- **Integração ERP:** Webhooks para eventos de pedidos, documentos, transferências e vendas  
- **Plataformas auxiliares:** OpenAI (análise de texto e IA preditiva, sob demanda)

---

## 5. Ciclo de Vida dos Dados

A plataforma é alimentada a partir de eventos do ERP, acionados por webhooks. Esses eventos disparam atualizações nas tabelas e estados das entidades, que são então processadas por regras de negócio e motores de alerta. Todo o histórico é preservado para auditoria e análise temporal.

---

## 6. Entidades Principais

As entidades do banco de dados foram modeladas para refletir fielmente o fluxo de compra, transferência, venda e devolução. As principais são:

| Entidade                | Descrição                                                                 |
|-------------------------|---------------------------------------------------------------------------|
| `core_orders`           | Cabeçalho de pedidos (compra ou transferência)                           |
| `core_documents`        | Notas fiscais e cupons (entrada, saída, venda, devolução)                |
| `core_document_items`   | Itens de cada documento                                                  |
| `core_product_variants` | Combinações SKU + cor + tamanho                                          |
| `core_inventory_snapshots` | Saldo atual de cada SKU por local                                   |
| `core_movements`        | Histórico de movimentações (entrada, saída, venda, devolução)            |
| `core_events`           | Linha do tempo de eventos por entidade                                   |

---

## 7. Modos de Execução da IA

A execução dos alertas e análises poderá ocorrer:

- **Em tempo real:** conforme chegada dos eventos via webhook (ideal para alertas críticos).
- **Periodicamente:** via jobs agendados no N8N (ex: rodar alertas noturnos).
- **Sob demanda:** por meio de interação do usuário com a interface (ex: análise manual de um SKU).

---

## 8. Escopo Futuro (fora do MVP)

Embora este documento cubra o escopo MVP, a arquitetura foi pensada para permitir:

- Expansão para análise preditiva de demanda.
- Conexão com múltiplos canais de venda (marketplaces).
- Inteligência de precificação dinâmica.
- Gestão de abastecimento multicanal.

---

## 9. Segurança e Conformidade

- Conformidade com LGPD, incluindo anonimização e consentimento.
- Criptografia em trânsito (TLS 1.2+) e em repouso (AES-256).
- Política de retenção de dados: até 90 dias após encerramento da fase de garantia.
- Acordo de confidencialidade estabelecido entre as partes.

---

## 10. Responsabilidades

### BanBan
- Disponibilizar dados e acesso ao ERP.
- Nomear ponto focal.
- Assumir custos de plataformas (API, hosting).

### Desenvolvedor
- Desenvolver e entregar MVP funcional.
- Oferecer suporte durante o período de garantia (30 dias).
- Fornecer documentação e treinamento.

---
