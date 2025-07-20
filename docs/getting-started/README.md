# Guia de Setup do Ambiente de Desenvolvimento

Este guia descreve os passos necessários para configurar e executar a plataforma Axon em um ambiente de desenvolvimento local.

## 1. Pré-requisitos

Antes de começar, certifique-se de que você tem as seguintes ferramentas instaladas e configuradas em seu sistema:

- **Node.js**: Versão `18.x` ou superior.
- **pnpm**: Gerenciador de pacotes. Se não tiver, instale com `npm install -g pnpm`.
- **Docker**: Necessário para executar o Supabase localmente.
- **Supabase CLI**: Instale com `npm install -g supabase`.

## 2. Instalação

### Passo 1: Clonar o Repositório

Clone o projeto para a sua máquina local:

```bash
git clone https://github.com/seu-usuario/axon.git
cd axon
```

### Passo 2: Instalar as Dependências

Use `pnpm` para instalar todas as dependências do frontend e do backend. O pnpm irá gerenciar os workspaces automaticamente.

```bash
pnpm install
```

### Passo 3: Configurar Variáveis de Ambiente

Copie o arquivo de exemplo `.env.example` para um novo arquivo `.env.local` na raiz do projeto. Este arquivo será usado para as configurações locais.

```bash
cp .env.example .env.local
```

Abra o `.env.local` e preencha as variáveis. Para o desenvolvimento local com Supabase, as URLs e chaves anônimas serão fornecidas pelo Supabase CLI no próximo passo.

## 3. Configuração do Banco de Dados Local (Supabase)

Usamos o Supabase para gerenciar nosso banco de dados PostgreSQL e serviços de autenticação.

### Passo 1: Iniciar o Supabase

Execute o seguinte comando na raiz do projeto para iniciar os contêineres Docker do Supabase:

```bash
supabase start
```

Após a inicialização, o CLI irá exibir as informações da sua instância local, incluindo:
- **API URL**
- **DB URL**
- **Studio URL**
- **JWT Secret**
- **anon key**
- **service_role key**

Copie a `API URL` e a `anon key` para as respectivas variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` no seu arquivo `.env.local`.

### Passo 2: Aplicar as Migrações

Com o Supabase em execução, aplique todas as migrações de banco de dados para criar as tabelas e políticas de segurança (RLS).

```bash
supabase db reset
```

Este comando irá apagar os dados existentes e recriar o schema a partir dos arquivos de migração em `supabase/migrations`.

## 4. Executando a Aplicação

A plataforma Axon é projetada para rodar um cliente por vez no ambiente de desenvolvimento.

### Passo 1: Escolher um Cliente

Escolha o cliente que você deseja executar. Temos scripts pré-configurados no `package.json` para facilitar.

- Para o cliente **BanBan**:
  ```bash
  pnpm dev:banban
  ```
- Para o cliente **Riachuelo** (exemplo):
  ```bash
  pnpm dev:riachuelo
  ```

O script `dev:[nome-do-cliente]` define a variável de ambiente `NEXT_PUBLIC_CLIENT_TYPE` e inicia o servidor de desenvolvimento do Next.js.

### Passo 2: Acessar a Aplicação

Após o servidor iniciar, acesse a aplicação no seu navegador. Você precisará ter configurado seu arquivo de `hosts` localmente.

- **Cliente BanBan:** [http://banban.axon.localhost:3000](http://banban.axon.localhost:3000)
- **Cliente Riachuelo:** [http://riachuelo.axon.localhost:3000](http://riachuelo.axon.localhost:3000)

## 5. Verificação

Para garantir que tudo está funcionando:
1.  Acesse a URL do cliente no navegador. A página inicial deve carregar sem erros.
2.  Tente se registrar ou fazer login. A autenticação deve funcionar.
3.  Navegue para o dashboard. Os componentes específicos do cliente devem ser renderizados.
4.  Acesse o **Supabase Studio URL** fornecido pelo CLI para visualizar o banco de dados e as tabelas. 