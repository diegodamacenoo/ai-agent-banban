# Guia Rápido de Desenvolvimento

## Setup Inicial

### 1. Pré-requisitos
```bash
# Instalar dependências
pnpm install

# Configurar Supabase
supabase start
supabase db push
```

### 2. Variáveis de Ambiente
```env
# .env.local
NEXT_PUBLIC_CLIENT_TYPE=banban
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

### 3. Comandos de Desenvolvimento
```bash
# Frontend (porta 3000)
pnpm dev:banban

# Backend (porta 4000)
cd backend; pnpm dev

# Testes
pnpm test
pnpm test:watch
```

## Estrutura de Desenvolvimento

### 1. Criar Nova Feature
```bash
# 1. Criar estrutura
mkdir -p src/features/nova-feature
mkdir -p src/features/nova-feature/components
mkdir -p src/features/nova-feature/hooks
mkdir -p src/features/nova-feature/types

# 2. Criar arquivos base
touch src/features/nova-feature/index.ts
touch src/features/nova-feature/components/NovaFeatureForm.tsx
touch src/features/nova-feature/hooks/useNovaFeature.ts
touch src/features/nova-feature/types/index.ts
```

### 2. Criar Nova Página
```typescript
// src/app/(protected)/nova-pagina/page.tsx
import { getUser } from '@/core/auth/server'
import { redirect } from 'next/navigation'

export default async function NovaPaginaPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  return (
    <div>
      <h1>Nova Página</h1>
      {/* Conteúdo */}
    </div>
  )
}
```

### 3. Criar Server Action
```typescript
// src/app/actions/nova-action.ts
'use server'

import { getUser } from '@/core/auth/server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function novaAction(formData: FormData) {
  const user = await getUser()
  if (!user) throw new Error('Unauthorized')

  const supabase = createClient()
  
  // Lógica da action
  const result = await supabase
    .from('tabela')
    .insert({
      field: formData.get('field'),
      organization_id: user.organization_id
    })

  revalidatePath('/path')
  return result
}
```

### 4. Criar API Route
```typescript
// src/app/api/nova-rota/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/core/auth/server'

export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    // Lógica da API
    return NextResponse.json({ data: 'success' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
```

## Padrões de Código

### 1. Componente Base
```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'

interface ComponentProps {
  title: string
  onSubmit: (data: string) => void
}

export function MeuComponente({ title, onSubmit }: ComponentProps) {
  const [value, setValue] = useState('')

  const handleSubmit = () => {
    onSubmit(value)
    setValue('')
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Digite algo..."
        />
        <Button onClick={handleSubmit}>
          Enviar
        </Button>
      </div>
    </div>
  )
}
```

### 2. Hook Customizado
```typescript
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface UseDataOptions {
  organizationId: string
}

export function useData({ organizationId }: UseDataOptions) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('tabela')
          .select('*')
          .eq('organization_id', organizationId)

        if (error) throw error
        setData(data)
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [organizationId])

  return { data, loading, error }
}
```

### 3. Schema de Validação
```typescript
// src/lib/schemas/nova-schema.ts
import { z } from 'zod'

export const novaSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  age: z.number().min(18, 'Idade mínima é 18 anos')
})

export type NovaSchemaType = z.infer<typeof novaSchema>
```

## Comandos Úteis

### 1. Banco de Dados
```bash
# Resetar banco local
supabase db reset

# Aplicar migrações
supabase db push

# Gerar tipos TypeScript
supabase gen types typescript --local > src/types/supabase.ts

# Criar nova migração
supabase migration new nome_da_migracao
```

### 2. Desenvolvimento
```bash
# Limpar cache do Next.js
rm -rf .next

# Verificar tipos TypeScript
npx tsc --noEmit

# Executar linter
pnpm lint

# Executar testes específicos
pnpm test src/features/nova-feature
```

### 3. Deploy
```bash
# Build de produção
pnpm build

# Verificar build
pnpm start

# Deploy Supabase
supabase db push --linked
```

## Debugging

### 1. Logs do Supabase
```bash
# Ver logs em tempo real
supabase logs

# Logs de uma função específica
supabase functions logs webhook-sales-flow
```

### 2. Debug do Next.js
```typescript
// Adicionar logs de debug
console.log('Debug:', { user, data, error })

// Usar debugger
debugger

// Logs condicionais
if (process.env.NODE_ENV === 'development') {
  console.log('Development only log')
}
```

### 3. Verificar RLS
```sql
-- Testar políticas RLS
SELECT * FROM documents WHERE organization_id = 'test-org-id';

-- Verificar usuário atual
SELECT auth.uid(), auth.jwt();

-- Testar função personalizada
SELECT get_user_organization_id();
```

## Troubleshooting Comum

### 1. Erro de Autenticação
```bash
# Verificar se o usuário está logado
supabase auth status

# Limpar cache de auth
# Deletar cookies do navegador
```

### 2. Erro de RLS
```sql
-- Verificar se RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Verificar políticas
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

### 3. Erro de Migração
```bash
# Verificar status das migrações
supabase migration list

# Reverter migração
supabase db reset

# Aplicar migração específica
supabase migration up --target 20240101000000
```

## Recursos Úteis

### 1. Documentação
- [Next.js App Router](https://nextjs.org/docs/app)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Radix UI](https://www.radix-ui.com/docs)

### 2. Ferramentas
- **Supabase Studio**: http://127.0.0.1:54323
- **Next.js DevTools**: Extensão do navegador
- **React DevTools**: Extensão do navegador

### 3. Testes
```bash
# Testar webhook local
curl -X POST http://localhost:54321/functions/v1/webhook-sales-flow \
  -H "Content-Type: application/json" \
  -d '{"event_type": "sale_completed"}'

# Testar API
curl http://localhost:3000/api/health
``` 