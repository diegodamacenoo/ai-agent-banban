# Guia de Contribuição - Projeto Axon

## Introdução

Obrigado por considerar contribuir com o projeto Axon! Este documento fornece diretrizes e padrões para contribuições, garantindo consistência e qualidade no código.

## Como Contribuir

### Reportando Bugs e Sugerindo Melhorias

Utilize a seção de **Issues** do nosso repositório no GitHub para reportar bugs ou sugerir melhorias, seguindo os templates disponíveis.

### Pull Requests

1.  **Fork & Clone:** Faça um fork do repositório e clone-o para sua máquina local.

2.  **Crie uma Branch:** Use um nome descritivo para sua branch, seguindo o padrão de commits.
    ```bash
    git checkout -b feat/nome-da-feature
    ```

3.  **Desenvolva:** Faça suas alterações seguindo os padrões de código.

4.  **Teste suas alterações:** Execute os testes e o linter para garantir a qualidade.
    ```bash
    pnpm run test
    pnpm run lint
    ```

5.  **Commit:** Utilize o padrão de [Conventional Commits](https://www.conventionalcommits.org/).
    ```bash
    git commit -m "feat: descrição da alteração"
    ```

6.  **Push & PR:** Envie suas alterações para o seu fork e abra um Pull Request para a branch `main` do repositório principal.

## Padrões de Código

### Geral

- Use TypeScript para todo código novo.
- Siga o estilo de código existente.
- Mantenha funções pequenas e focadas.
- Documente código complexo com comentários JSDoc.
- Escreva testes para novas funcionalidades.

### Commits

Seguimos o padrão Conventional Commits:

- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `docs:` - Alterações na documentação
- `style:` - Formatação de código (espaços, ponto e vírgula)
- `refactor:` - Refatoração de código que não altera a funcionalidade externa
- `test:` - Adição ou correção de testes
- `chore:` - Alterações em build, dependências, etc.

### Estrutura de Diretórios

Mantenha os arquivos organizados seguindo a estrutura principal do projeto:

```
src/
  ├── app/              # Rotas e páginas do Next.js
  ├── core/             # Lógica de negócio, serviços, módulos base
  ├── clients/          # Módulos e componentes específicos de cada cliente
  ├── shared/           # Componentes, hooks e tipos reutilizáveis
  └── features/         # Lógica de UI para features específicas

docs/                   # Documentação geral do projeto
scripts/                # Scripts de automação e manutenção
supabase/               # Configurações e migrations do Supabase
```

## Revisão de Código

1.  Todo código passa por um processo de revisão.
2.  É necessária no mínimo 1 aprovação para o merge.
3.  A pipeline de Integração Contínua (CI) deve passar com sucesso.
4.  A documentação relevante deve ser atualizada junto com o código.

## Segurança

- **Nunca** commite segredos ou chaves de API. Utilize o arquivo `.env.local` que é ignorado pelo Git.
- Siga as Políticas de Segurança em Nível de Linha (RLS) do Supabase.
- Reporte vulnerabilidades de forma privada para a equipe responsável.

## Dúvidas?

- Abra uma issue com a tag `question`.
- Contate a equipe de desenvolvimento.
- Consulte a documentação existente na pasta `docs/`.

## Agradecimentos

Agradecemos suas contribuições para tornar o Axon uma plataforma cada vez melhor! 