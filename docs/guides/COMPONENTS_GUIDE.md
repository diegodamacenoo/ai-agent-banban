# Guia de Componentes

Este documento descreve as diretrizes para a organização e o desenvolvimento de componentes de interface de usuário (UI) na aplicação, visando reusabilidade, manutenibilidade e clareza.

---

## Componentes

A organização dos componentes segue uma abordagem que prioriza a reusabilidade e a coesão da funcionalidade.

1.  **Componentes Globais (`src/components/ui/` e `src/components/`):**
    * Este diretório é reservado para **componentes de UI genéricos e altamente reutilizáveis** que podem ser usados em qualquer parte da aplicação.
    * Isso inclui componentes baseados em bibliotecas de UI (como [Shadcn UI](https://ui.shadcn.com/)) como `Button`, `Input`, `Card`, `Dialog`, etc.
    * Também pode conter componentes "átomos" ou "moléculas" de design que são fundamentais para a identidade visual e funcional da aplicação (ex: `Spinner`, `Logo`, `AlertDialog`).
    * A ideia é que esses componentes não tenham lógica de negócio específica e sejam puramente de apresentação ou utilitários de UI.

2.  **Componentes por Feature (ex: `src/app/settings/components/` ou `src/features/feature-name/components/`):**
    * Mantenha componentes que são **específicos para uma funcionalidade (feature) ou rota** dentro do diretório da própria feature.
    * **Exemplo**: Componentes relacionados às configurações de usuário (formulários de perfil, tabelas de permissões) devem residir em `src/app/settings/components/` ou `src/features/user-management/components/`.
    * Essa abordagem melhora a coesão, facilitando a localização de código relacionado e a remoção de funcionalidades no futuro.
    * Para componentes complexos (ex: formulários extensos, dashboards com muitos widgets), divida-os em **subcomponentes menores e mais focados**. Por exemplo, um formulário grande pode ser dividido em seções como `form-sections/` (ex: `PersonalInfoSection.tsx`, `SecuritySettingsSection.tsx`) para melhorar a legibilidade e a manutenibilidade.
    * Considere criar subdiretórios dentro da pasta `components` de uma feature para organizar ainda mais (ex: `src/app/settings/components/user-profile/`, `src/app/settings/components/organization-settings/`).