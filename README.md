# Axon - Plataforma Modular de IA

## Visão Geral

O Axon é uma plataforma de software como serviço (SaaS) multi-tenant, projetada para integrar agentes de IA a sistemas legados de forma modular e extensível. A arquitetura permite o carregamento dinâmico de módulos, oferecendo soluções personalizadas para diferentes clientes e verticais de negócio, como o cliente `banban`.

O projeto encontra-se em um estágio maduro de desenvolvimento, com uma base sólida, arquitetura multi-tenant funcional e múltiplos módulos complexos já implementados e refatorados.

## Principais Tecnologias

- **Framework:** Next.js
- **Linguagem:** TypeScript
- **Banco de Dados & Auth:** Supabase
- **Estilização:** Tailwind CSS & Radix UI
- **Gerenciador de Pacotes:** pnpm
- **Testes:** Jest & React Testing Library

## Arquitetura

A estrutura do projeto é desenhada para garantir uma clara separação de responsabilidades:

```
.
├── src/
│   ├── core/         # Lógica de negócio, serviços, handlers de API e módulos base
│   ├── clients/      # Módulos e componentes específicos de cada cliente (ex: banban)
│   ├── shared/       # Componentes, hooks e tipos compartilhados por toda a aplicação
│   └── app/          # Estrutura de rotas e páginas do Next.js
├── supabase/         # Migrations, functions e configuração do Supabase
└── docs/             # Documentação técnica e de negócio
```

Esta arquitetura permite que a lógica central do Axon seja mantida de forma agnóstica, enquanto as customizações e interfaces de cada cliente são desenvolvidas de forma isolada na pasta `clients`.

## Módulos Implementados

O sistema atualmente conta com um robusto sistema de descoberta de módulos, que identifica e gerencia os seguintes módulos principais:

- **Módulos Customizados (Banban):**
  - `insights`
  - `performance`
  - `inventory`
  - `alerts`
  - `data-processing`
- **Módulos Padrão:**
  - `analytics`
  - ... (e outros módulos base do sistema)

## Como Começar

### Pré-requisitos

- Node.js (versão recomendada: 20.x)
- pnpm (instalado globalmente)
- Acesso ao projeto Supabase

### Instalação

1.  Clone o repositório:
    ```bash
    git clone <URL_DO_REPOSITORIO>
    ```
2.  Navegue até a pasta do projeto e instale as dependências:
    ```bash
    cd axon
    pnpm install
    ```
3.  Configure suas variáveis de ambiente duplicando o arquivo `.env.example` para `.env.local` e preenchendo as chaves do Supabase e outras configurações necessárias.

### Scripts Principais

- **Desenvolvimento (genérico):**
  ```bash
  pnpm dev
  ```
- **Desenvolvimento (cliente específico):**
  ```bash
  # Exemplo para o cliente Banban
  pnpm dev:banban
  ```
- **Build para produção:**
  ```bash
  pnpm build
  ```
- **Executar testes:**
  ```bash
  pnpm test
  ```
- **Verificar regras de lint:**
  ```bash
  pnpm lint
  ```

## Contribuição

Para contribuir com o projeto, por favor, leia nosso [Guia de Contribuição](CONTRIBUTING.md).

## Licença

Este projeto é de propriedade privada e não possui uma licença de código aberto (UNLICENSED).
