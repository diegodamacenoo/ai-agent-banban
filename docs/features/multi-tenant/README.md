# Arquitetura Multi-tenant da Axon

## 1. Modelo de Multi-tenancy

A plataforma Axon utiliza um **modelo de banco de dados compartilhado com schema compartilhado**. Nessa abordagem, todos os clientes (tenants) compartilham as mesmas tabelas no banco de dados, mas os dados de cada cliente são isolados uns dos outros através de uma coluna `tenant_id` presente em todas as tabelas relevantes.

**Vantagens:**
- **Menor Custo Operacional:** Gerenciar um único banco de dados é mais simples e barato.
- **Manutenção Simplificada:** Migrações de schema são aplicadas uma única vez para todos os clientes.
- **Fácil Onboarding:** Adicionar um novo cliente é tão simples quanto inserir um novo registro na tabela `tenants`.

**Desvantagens:**
- **Risco de Vazamento de Dados:** Exige uma implementação de segurança rigorosa para garantir que os dados não vazem entre os tenants. Este risco é mitigado pelo uso de Row-Level Security (RLS).
- **"Noisy Neighbor":** Um cliente com alto volume de uso pode impactar a performance de outros. Isso é mitigado com otimizações de banco de dados e a possibilidade de mover clientes maiores para instâncias dedicadas no futuro.

## 2. Isolamento de Dados com Row-Level Security (RLS)

O pilar da nossa estratégia de isolamento de dados é o **Row-Level Security (RLS)** do PostgreSQL, gerenciado através do Supabase.

### Como Funciona:
1.  **Identificação do Tenant:** Cada tabela que contém dados de clientes possui uma coluna `tenant_id`, que é uma chave estrangeira para a tabela `tenants`.
2.  **Contexto da Requisição:** Quando um usuário autenticado faz uma requisição, o Supabase Auth popula um "claim" no JWT chamado `tenant_id`.
3.  **Políticas de RLS:** Para cada tabela, definimos políticas de segurança que utilizam esse `tenant_id` do JWT para filtrar os dados.

**Exemplo de Política RLS:**

Esta política, aplicada à tabela `products`, garante que um usuário só possa ver ou modificar os produtos que pertencem ao seu `tenant_id`.

```sql
-- Habilita RLS na tabela 'products'
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Cria a política para operações de SELECT
CREATE POLICY "Allow select for user's own tenant"
ON public.products FOR SELECT
USING (auth.jwt()->>'tenant_id' = tenant_id::text);

-- Cria a política para operações de INSERT, UPDATE, DELETE
CREATE POLICY "Allow all operations for user's own tenant"
ON public.products FOR ALL
USING (auth.jwt()->>'tenant_id' = tenant_id::text)
WITH CHECK (auth.jwt()->>'tenant_id' = tenant_id::text);
```
**`USING`**: Esta cláusula se aplica a comandos que leem dados (`SELECT`, ou `UPDATE`/`DELETE` para encontrar as linhas). A linha só é visível se a condição for verdadeira.
**`WITH CHECK`**: Esta cláusula se aplica a comandos que escrevem dados (`INSERT`, `UPDATE`). A operação falhará se a nova linha (ou a linha atualizada) não satisfizer a condição.

## 3. Gestão de Configurações e Customizações

Enquanto o banco de dados é compartilhado, a lógica de aplicação e a interface do usuário são customizadas por cliente.

- **Frontend:** A variável de ambiente `NEXT_PUBLIC_CLIENT_TYPE` instrui a aplicação Next.js a carregar o diretório de cliente correspondente em `src/clients/[client-name]`.
- **Configuração:** Cada cliente possui um arquivo `config.ts` que define temas, features habilitadas, endpoints específicos, etc.
- **Backend:** A lógica de negócio no backend pode acessar a configuração do tenant para adaptar seu comportamento, embora a maior parte da lógica principal seja agnóstica ao cliente, confiando no RLS para o isolamento de dados.

Essa abordagem híbrida nos dá o melhor dos dois mundos: a eficiência de um banco de dados compartilhado e a flexibilidade de uma aplicação customizável por cliente. 