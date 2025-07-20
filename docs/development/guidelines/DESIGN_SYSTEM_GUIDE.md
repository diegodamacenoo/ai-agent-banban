# Guia do Design System - Banban

## 1. Introdução

Este documento serve como a fonte oficial da verdade para o Design System do projeto Banban. O objetivo é criar uma linguagem visual coesa, consistente e eficiente, garantindo uma experiência de usuário unificada em toda a aplicação. Seguir estas diretrizes é fundamental para manter a qualidade e a integridade do design.

Para uma referência visual e interativa de todos os componentes, visite a página [Component Showcase](/admin/design-system).

---

## 2. Princípios Fundamentais

Nossos princípios de design orientam todas as nossas decisões:

-   **Clareza acima de tudo:** A interface deve ser intuitiva e fácil de entender. Evite ambiguidades.
-   **Consistência é chave:** Componentes e padrões devem se comportar da mesma forma em todo o sistema.
-   **Eficiência para o usuário:** O design deve otimizar os fluxos de trabalho e permitir que os usuários realizem tarefas com o mínimo de esforço.
-   **Acessibilidade por padrão:** Construímos para todos. Garanta que os designs sejam acessíveis, seguindo as diretrizes da WCAG.
-   **Modularidade e Reutilização:** Crie componentes que sejam reutilizáveis e possam ser combinados para construir interfaces complexas.

---

## 3. Tipografia

A hierarquia tipográfica clara é essencial para a legibilidade e a organização do conteúdo.

-   **Fonte Principal:** Inter
-   **H1 (Título de Página):** `text-4xl`, `font-bold`
-   **H2 (Título de Seção):** `text-3xl`, `font-semibold`
-   **H3 (Título de Card/Componente):** `text-2xl`, `font-semibold`
-   **Parágrafo (Corpo):** `text-base`
-   **Texto de Suporte/Muted:** `text-sm`, `text-muted-foreground`
-   **Links:** `text-primary`, `hover:underline`

---

## 4. Paleta de Cores

As cores definem a identidade visual e comunicam o estado da interface.

-   **Primary (`#ef4444`):** Usada para ações principais, botões de confirmação, links e elementos em foco.
-   **Secondary (`#6b7280`):** Usada para ações secundárias, botões de cancelamento e informações de suporte.
-   **Destructive (`#dc2626`):** Exclusivamente para ações perigosas e irreversíveis (ex: exclusão).
-   **Success (`#16a34a`):** Para feedback positivo, validações bem-sucedidas e status "Online".
-   **Warning (`#f59e0b`):** Para alertas, avisos que exigem atenção, mas não são erros.
-   **Background / Card (`#ffffff`):** Cor de fundo principal e de superfícies como cards.
-   **Foreground (`#020817`):** Cor principal para texto.
-   **Border (`#e5e7eb`):** Para bordas, divisores e separadores visuais.

---

## 5. Componentes

A biblioteca de componentes é a base da nossa interface. Utilize sempre os componentes existentes antes de criar novos.

### 5.1. `Button`

-   **Padrão:** Para a ação principal na tela (ex: "Salvar", "Enviar").
-   **Secondary:** Para ações secundárias (ex: "Cancelar", "Voltar").
-   **Destructive:** Para ações destrutivas (ex: "Excluir Organização").
-   **Outline:** Para ações terciárias que precisam de menos destaque.
-   **Ghost / Link:** Para ações que se parecem com texto, como "Ver detalhes".

### 5.2. `Card`

-   Use `Card` para agrupar informações relacionadas em uma única superfície.
-   Sempre inclua um `CardHeader` com um `CardTitle`.
-   Use `CardContent` para o conteúdo principal e `CardFooter` para ações ou resumos.

### 5.3. `Alert`

-   Use alertas para exibir mensagens importantes e contextuais.
-   **Variante Padrão (Success):** Para mensagens de sucesso.
-   **Variante Destructive:** Para exibir erros críticos.

### 5.4. Formulários (`Input`, `Label`, `Select`, etc.)

-   Todos os campos de entrada (`Input`, `Textarea`, `Select`) devem estar associados a uma `Label`.
-   As mensagens de erro devem ser claras, concisas e aparecer abaixo do campo correspondente.

---

## 6. Contribuição

Para adicionar ou modificar um componente no Design System:

1.  **Proponha a mudança:** Abra uma issue descrevendo o novo componente ou a alteração necessária.
2.  **Desenvolva o componente:** Crie o componente em seu próprio arquivo dentro de `src/components/ui/`.
3.  **Adicione à página Showcase:** Adicione o novo componente à página `/admin/design-system` para que possa ser visualizado.
4.  **Documente no Guia:** Atualize este arquivo (`DESIGN_SYSTEM_GUIDE.md`) com as diretrizes de uso do novo componente.
5.  **Abra um Pull Request:** Solicite a revisão do seu código. 