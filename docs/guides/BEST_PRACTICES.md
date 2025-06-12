# Boas Práticas de Desenvolvimento

Este documento compila as boas práticas essenciais que devem ser seguidas durante o desenvolvimento do sistema. A adesão a estas práticas garante consistência, segurança, performance e manutenibilidade do código.

---

## Nomenclatura Consistente

Uma nomenclatura clara e consistente é crucial para a legibilidade e compreensão do código.

* **Verbos para Ações**: Utilize verbos como `get`, `create`, `update`, `delete`, `Workspace`, `send` para nomear funções que realizam operações CRUD (Create, Read, Update, Delete) ou outras ações.
* **Evitar Sufixos Desnecessários**: Evite sufixos como "Action" nos nomes das funções de Server Actions (ex: `updateUser` em vez de `updateUserAction`). O contexto do arquivo (`/actions/`) já indica que é uma Server Action.
* **Consistência Geral**: Mantenha a consistência em todo o codebase:
    * **PascalCase** para nomes de Componentes React, Types e Interfaces (ex: `UserProfileCard`, `UserData`, `IUserContext`).
    * **camelCase** para nomes de funções, variáveis e propriedades (ex: `WorkspaceUserData`, `userName`, `userProfile`).
    * **kebab-case** para nomes de arquivos e diretórios que não contêm componentes React (ex: `user-management.ts`, `data-helpers/`).

---

## Segurança

A segurança deve ser uma consideração primária em todas as etapas do desenvolvimento.

* **Validação de Inputs**: Sempre **valide todos os inputs** recebidos (especialmente em Server Actions e API Routes) com bibliotecas como [Zod](https://zod.dev/) antes de processar qualquer operação. Isso ajuda a prevenir ataques de injeção e garante a integridade dos dados.
* **Verificação de Permissões**: No início de todas as Server Actions e API Routes que manipulam dados sensíveis ou executam ações privilegiadas, **verifique rigorosamente as permissões** do usuário autenticado. Não confie apenas na segurança do lado do cliente. Se o usuário não tiver permissão, retorne um erro apropriado imediatamente.

---

## Performance

Otimizar a performance é fundamental para uma boa experiência do usuário.

* **Evitar Operações Desnecessárias ao Banco de Dados**: Busque apenas os dados que você realmente precisa. Evite consultas amplas (`SELECT *`) quando apenas algumas colunas são necessárias.
* **Consolidar Consultas**: Quando possível, consolide múltiplas consultas de banco de dados em uma única transação ou consulta mais complexa para reduzir o overhead de rede e a carga no banco de dados.
* **Otimizar Componentes**: Utilize `React.memo`, `useCallback` e `useMemo` em Client Components para evitar re-renderizações desnecessárias, especialmente para componentes complexos ou que recebem props que mudam com frequência.

---

## Manutenibilidade

Escrever código fácil de entender e modificar é crucial para a longevidade do projeto.

* **Funções Específicas e Focadas**: Cada função (especialmente Server Actions e utilitários) deve ter uma única responsabilidade clara e bem definida. Evite funções "faz-tudo".
* **Extrair Lógica Comum**: Se uma lógica complexa ou repetitiva aparece em várias partes do código, extraia-a para uma função utilitária separada e reutilizável.
* **Evitar Funções Muito Longas**: Mantenha as funções concisas. Uma boa regra geral é que uma função não deve exceder aproximadamente 100 linhas de código. Se for maior, provavelmente pode ser dividida em funções menores e mais focadas.

---

## Instanciação de Clientes de Serviços (ex: Supabase)

Siga a abordagem recomendada para instanciar clientes de serviços, especialmente em ambientes de servidor.

* **Para Server Actions**: Instancie clientes de serviços (como o Supabase Client) usando os helpers apropriados que garantem a correta injeção de contexto (ex: cookies para autenticação).
    * **Exemplo**: Use `createSupabaseClient(await cookies())` de `@/lib/supabase/server` para o cliente Supabase em Server Actions, garantindo que a sessão do usuário seja corretamente propagada.
* **Para Client Components**: Utilize os clientes Supabase configurados para o lado do cliente, normalmente instanciados uma vez e utilizados em toda a aplicação ou injetados via contexto.

---

## Documentação

A documentação é vital para a compreensão e colaboração no projeto.

* **API de Componentes Reutilizáveis**: Documente as `props` de componentes reutilizáveis, seu comportamento esperado e quaisquer limitações. Isso pode ser feito via JSDoc ou diretamente na definição da interface das props.
* **Comentar Lógica Complexa**: Adicione comentários claros e concisos para explicar lógicas complexas, algoritmos não óbvios ou decisões de design específicas em Server Actions e funções utilitárias. O código deve ser autoexplicativo na maioria das vezes, mas comentários são úteis para "porquês".