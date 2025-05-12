# Como Contribuir (CONTRIBUTING.md)

Agradecemos seu interesse em contribuir com o projeto! Este guia fornece diretrizes para tornar o processo de contribuição claro e eficaz para todos.

## Código de Conduta

Esperamos que todos os contribuidores sigam o [Código de Conduta](LINK_PARA_CODIGO_DE_CONDUTA - se existir, senão remova ou adapte). Por favor, seja respeitoso e construtivo.

## Como Reportar Bugs

*   Verifique se o bug já não foi reportado na seção de [Issues](LINK_PARA_ISSUES).
*   Se não encontrar, crie uma nova issue descrevendo:
    *   Passos para reproduzir o bug.
    *   O que você esperava que acontecesse.
    *   O que realmente aconteceu (incluindo mensagens de erro, screenshots, se possível).
    *   Seu ambiente (Sistema Operacional, versão do Node.js, navegador, etc.).

## Sugerindo Melhorias

*   Abra uma nova [Issue](LINK_PARA_ISSUES) para discutir sua ideia.
*   Descreva claramente a melhoria proposta e por que ela seria útil.
*   Esteja aberto a discussões e feedback sobre a proposta.

## Processo de Desenvolvimento

1.  **Faça o Fork:** Crie um fork do repositório principal para sua conta no GitHub.
2.  **Clone seu Fork:** Clone o repositório do seu fork para sua máquina local.
    ```bash
    git clone git@github.com:SEU_USUARIO/NOME_DO_REPOSITORIO.git
    cd NOME_DO_REPOSITORIO
    ```
3.  **Crie uma Branch:** Crie uma branch descritiva para sua feature ou correção.
    ```bash
    git checkout -b feature/nome-da-feature # ou fix/descricao-do-bug
    ```
4.  **Desenvolva:** Faça as alterações necessárias no código.
    *   Siga os [Padrões de Código](#padrões-de-código) definidos.
    *   Adicione testes para suas alterações, se aplicável.
    *   Certifique-se de que todos os testes estão passando (`pnpm test`).
    *   Verifique se o código passa no linter (`pnpm lint`).
5.  **Commit:** Faça commits claros e concisos.
    ```bash
    git add .
    git commit -m "feat: Adiciona funcionalidade X" # Siga convenções de commit (ex: Conventional Commits)
    ```
6.  **Push:** Envie suas alterações para o seu fork.
    ```bash
    git push origin feature/nome-da-feature
    ```
7.  **Abra um Pull Request (PR):**
    *   Vá para o repositório original no GitHub.
    *   Clique em "New Pull Request".
    *   Escolha sua branch (`feature/nome-da-feature`) como "compare" e a branch principal do projeto (ex: `main` ou `develop`) como "base".
    *   Preencha o template do PR com uma descrição clara das suas alterações, referenciando a Issue relacionada (se houver).
    *   Aguarde a revisão do código.

## Padrões de Código

*   **Linguagem:** [TypeScript/JavaScript - Mencione a versão se relevante]
*   **Estilo de Código:** Usamos [ESLint](LINK_PARA_CONFIG_ESLINT - .eslintrc.json) e [Prettier](LINK_PARA_CONFIG_PRETTIER - se usado) para garantir a consistência. Rode `pnpm lint` e `pnpm format` antes de commitar.
*   **Convenção de Commits:** [Ex: Usamos Conventional Commits (https://www.conventionalcommits.org/)]
*   **Nomenclatura:** [Alguma convenção específica para variáveis, funções, componentes?]
*   **Testes:** [Onde adicionar testes? Qual a expectativa de cobertura?]

## Revisão de Código

*   Um ou mais mantenedores revisarão seu PR.
*   Esteja preparado para fazer alterações com base no feedback.
*   Assim que aprovado, seu PR será mergeado.

Obrigado por sua contribuição! 