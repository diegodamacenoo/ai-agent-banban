# Guia de Server Actions

Este documento detalha os padrões e as melhores práticas para a criação e organização das Server Actions na aplicação. Server Actions são a principal interface para interações seguras e eficientes com o servidor.

---

## Padrões de Server Actions

### Organização de Arquivos

1.  **Estrutura por Domínio**:
    * Organize as Server Actions por **domínio de negócio**, não por operação técnica. Isso facilita a localização e a compreensão da funcionalidade.
    * **Exemplos**: `/actions/auth/`, `/actions/profiles/`, `/actions/user-management/`.

2.  **Nomenclatura de Arquivos**:
    * Utilize nomes que representem os **subdomínios ou recursos** para arquivos que contêm funções relacionadas.
    * **Exemplos**: `password.ts` (para ações relacionadas à senha), `user-profile.ts` (para ações de perfil do usuário), `settings.ts` (para configurações gerais).

3.  **Consolidação de Funções**:
    * Consolide operações CRUD (Create, Read, Update, Delete) relacionadas ao mesmo recurso em um **único arquivo**.
    * Mantenha separadas apenas funções com lógica muito complexa ou que não se encaixam naturalmente em um grupo existente.
    * **Evite duplicação** de funcionalidades em múltiplos arquivos, buscando sempre a reusabilidade.

### Formato de Resposta

Mantenha um padrão consistente para o retorno das Server Actions para facilitar o tratamento no lado do cliente.

1.  **Padrão Consistente**:
    * Para **operações de mutação** (criar, atualizar, deletar):
        ```typescript
        { success: boolean, error?: string, data?: T }
        ```
    * Para **operações de consulta** (get, list):
        ```typescript
        { data?: T, error?: string }
        ```

2.  **Tratamento de Erros**:
    * Sempre use blocos `try/catch` para capturar exceções que possam ocorrer durante a execução da Server Action.
    * Formate os erros de forma consistente, retornando uma mensagem amigável no campo `error`.
    * Inclua um **log detalhado** do erro real usando `console.error()` para depuração, mas **NÃO exponha detalhes técnicos** da falha nas mensagens de erro retornadas ao usuário (ex: stack traces, mensagens internas do banco de dados).

3.  **Revalidação**:
    * Após qualquer operação de mutação bem-sucedida, chame `revalidatePath()` para garantir que os Server Components que dependem dos dados alterados sejam atualizados na próxima renderização.
    * **Especifique a rota correta a ser revalidada**.
    * **Exemplos**:
        * Para alterações no perfil do usuário: revalidar rotas como `/settings` e `/dashboard`.
        * Para alterações organizacionais: revalidar rotas específicas ao contexto organizacional (ex: `/settings/organization`).
        * Para alterações de usuários/permissões: revalidar `/settings/users`.

---

### Documentação e Tipagem

A documentação e a tipagem são cruciais para a manutenibilidade e a colaboração.

1.  **JSDoc**:
    * **Documente cada Server Action** com JSDoc, descrevendo claramente:
        * A finalidade da função.
        * Os parâmetros (`@param`) com suas descrições e tipos.
        * O valor de retorno (`@returns`) e sua estrutura.
    * Isso fornece autocompletar e informações contextuais em IDEs.

2.  **Tipagem TypeScript**:
    * Defina **tipos explícitos** para parâmetros e retornos de todas as Server Actions.
    * Use `z.infer<typeof schema>` para derivar tipos diretamente dos schemas [Zod](https://zod.dev/) utilizados para validação, garantindo consistência entre validação e tipagem.
    * Defina tipos TypeScript claros e reutilizáveis em `src/types/` para entidades globais, ou dentro de diretórios de features (`<feature>/types/`) para tipos específicos da feature.


