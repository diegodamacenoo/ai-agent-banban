# Índice da Documentação Axon

Este documento fornece uma visão geral completa e navegável de toda a documentação da plataforma Axon.

## Ⅰ. Primeiros Passos

- [Introdução](./README.md)
- [Setup do Ambiente](./getting-started/README.md)
- [Configuração](./getting-started/CONFIGURATION.md)

## Ⅱ. Arquitetura

- [Visão Geral](./architecture/overview.md)
- **Backend**
  - [Arquitetura (Fastify)](./architecture/backend/backend-architecture-fastify.md)
  - [Decisões de Framework](./architecture/backend/backend-framework-decision.md)
- **Banco de Dados**
  - [Alinhamento de Schema](./architecture/database/database-schema-alignment-report.md)

## Ⅲ. Features

- **Multi-tenant**
  - [Visão Geral](./features/multi-tenant/README.md)
  - [Migração e Validação](./features/multi-tenant/migration-plan-comparison.md)
- **Webhooks**
  - [Visão Geral](./features/webhooks/README.md)
  - [Guia de Integração](./features/webhooks/webhook-integration-guide.md)
- **Segurança**
  - [Análise de Segurança](./features/security/ADMIN_CLIENT_SECURITY_ANALYSIS.md)
  - [Melhorias de Segurança](./features/security/DATABASE_SECURITY_ENHANCEMENTS.md)

## Ⅳ. Desenvolvimento

- **Guidelines**
  - [Guia Geral de Desenvolvimento](./development/guidelines/development.md)
  - [Padrões de Código (Enums)](./development/guidelines/ENUM_STANDARDIZATION_GUIDE.md)
  - [Interações Cliente-Servidor](./development/guidelines/CLIENT_SERVER_INTERACTIONS.md)
- **Workflows**
  - [Auditoria](./development/workflows/audit-logging/README.md)
  - [Features Específicas](./development/workflows/features/README.md)
  - [Changelog](./development/workflows/CHANGELOG.md)
- **Best Practices**
  - [Referência de Debug](./development/best-practices/DEBUG.md)
  - [Estrutura de Diretórios](./development/best-practices/CORE_DIRECTORY_STRUCTURE.md)

## Ⅴ. API

- [Guia de Rotas da API](./api/endpoints/API_ROUTES_GUIDE.md)
- [Segurança da API](./api/authentication/API_SECURITY_IMPROVEMENTS.md)

## Ⅵ. Operações

- **Deploy**
  - [Configuração de Deploy](./operations/deployment/deployment-config.md)
- **Monitoramento**
  - [Métricas e Alertas](./operations/monitoring/metrics.md)
- **Manutenção**
  - [Guia de Troubleshooting](./operations/maintenance/TROUBLESHOOTING.md)
  - [Relatórios de Operação](./operations/maintenance/reports.md)

## Ⅶ. Testes

- [Estratégia de Testes](./testing/strategy.md)
- [Testes por Cliente](./testing/client-testing.md)
- [Resultados de Testes](./testing/results.md)

## Ⅷ. Clientes

- [Arquitetura de Clientes](./clients/architecture.md)
- [Guia de Implementação](./clients/implementation.md)
- [Guia de Migração](./clients/MIGRATION.md)
- **BanBan**
  - [Documentação](../src/clients/banban/docs/README.md)

## Ⅸ. Arquivo

- [Documentos Arquivados](./archive/README.md) 