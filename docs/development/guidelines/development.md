# Guia de Desenvolvimento da Plataforma Axon

Este guia estabelece o fluxo de trabalho, os padrões de código e as melhores práticas para o desenvolvimento na plataforma Axon. Seguir estas diretrizes é crucial para manter a qualidade, consistência e manutenibilidade do projeto.

## 1. Fluxo de Trabalho (Git Flow)

Utilizamos um fluxo de trabalho baseado no Git Flow. As branches principais são:

- **`main`**: Reflete o código em produção. Apenas merges de `develop` são permitidos.
- **`develop`**: Branch de integração para as features. É a base para os Pull Requests.

### Processo de Desenvolvimento:

1.  **Crie uma Feature Branch:** Sempre comece uma nova tarefa a partir da branch `develop`. Use um nome de branch descritivo.
    ```bash
    # Ex: feature/nome-da-feature, fix/bug-a-ser-corrigido, chore/refatoracao
    git checkout develop
    git pull
    git checkout -b feature/login-multi-tenant
    ```

2.  **Desenvolva e Faça Commits:** Faça commits pequenos e atômicos. Escreva mensagens de commit claras e concisas, seguindo o padrão [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).
    ```bash
    # Ex: feat: adicionar login com OAuth para clientes
    # Ex: fix: corrigir validação de e-mail no formulário de registro
    # Ex: docs: atualizar guia de setup do ambiente
    git commit -m "feat: adicionar autenticação com Google"
    ```

3.  **Abra um Pull Request (PR):** Quando a feature estiver completa, envie sua branch para o repositório remoto e abra um Pull Request contra a branch `develop`.
    - Preencha o template do PR com uma descrição clara das alterações.
    - Vincule o PR a quaisquer issues relevantes.
    - Solicite a revisão de pelo menos um outro membro da equipe.

4.  **Code Review:**
    - O revisor deve verificar se o código segue os padrões, se está bem documentado e se os testes foram implementados.
    - O autor do PR é responsável por aplicar as alterações solicitadas.

5.  **Merge:** Após a aprovação, o PR é "squashed and merged" na branch `develop`. Isso mantém o histórico da `develop` limpo e linear.

## 2. Padrões de Código

- **Linguagem:** Use **TypeScript** para todo o código novo. Evite o uso de `any` sempre que possível.
- **Formatação:** Usamos **ESLint** e **Prettier** para garantir um estilo de código consistente. Configure seu editor para formatar ao salvar.
- **Nomenclatura:**
  - **Componentes React:** `PascalCase` (ex: `UserProfileCard.tsx`).
  - **Funções e Variáveis:** `camelCase` (ex: `getUserProfile`).
  - **Tipos e Interfaces:** `PascalCase` (ex: `interface UserProfile`).
  - **Constantes:** `UPPER_SNAKE_CASE` (ex: `const API_TIMEOUT = 5000`).
- **Componentes React:**
  - Prefira componentes funcionais com Hooks.
  - Mantenha os componentes pequenos e focados em uma única responsabilidade (Single Responsibility Principle).
  - Separe a lógica de negócio (em services/hooks) da lógica de apresentação.
- **Módulos:**
  - Use o `index.ts` em cada diretório para exportar os artefatos públicos, criando uma "fachada" para o módulo.

## 3. Gerenciamento de Dependências

- Use `pnpm` para instalar e gerenciar as dependências.
- Antes de adicionar uma nova dependência, verifique se uma solução similar já não existe no projeto.
- Mantenha as dependências atualizadas para evitar vulnerabilidades de segurança.

## 4. Testes

- **Testes Unitários:** Para funções puras, hooks e serviços. Use Jest.
- **Testes de Componentes:** Para componentes React, validando a renderização e interação. Use React Testing Library.
- **Testes E2E (End-to-End):** Para fluxos críticos do usuário. Use Playwright ou Cypress.

Todo novo código (features, fixes) deve ser acompanhado de testes correspondentes. O objetivo é manter e aumentar a cobertura de testes do projeto. 