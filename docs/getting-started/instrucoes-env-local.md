# Instruções para Criar .env.local

## Passo 1: Criar o arquivo
Crie um arquivo chamado `.env.local` na raiz do projeto (mesmo nível do package.json)

## Passo 2: Adicionar o conteúdo
```bash
# URL do site para desenvolvimento
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Configurações do Supabase (substitua pelas suas chaves)
NEXT_PUBLIC_SUPABASE_URL=https://bopytcghbmuywfltmwhk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

## Passo 3: Reiniciar o servidor
```bash
npm run dev
```

## Resultado
O redirect agora funcionará corretamente em desenvolvimento!

## Para Produção
Quando fazer deploy, configure as variáveis de ambiente no seu servidor com:
- NEXT_PUBLIC_SITE_URL=https://seu-dominio-producao.com
- E atualize o Dashboard do Supabase com as URLs de produção 