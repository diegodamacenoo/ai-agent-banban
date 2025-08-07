# Skeleton Loading Patterns

Este documento estabelece padrões para implementação de skeleton loading em componentes que fazem parte de sistemas de navegação por tabs.

## Problema

Por padrão, componentes mostram skeleton loading a cada renderização inicial, causando:
- Flicker visual desnecessário ao navegar entre tabs
- Experiência de usuário inconsistente
- Loading state excessivo em transições

## Solução: Skeleton Apenas no Primeiro Carregamento

### Implementação

```tsx
export default function ComponentWithTabs() {
  // Flag para controlar se deve mostrar skeleton apenas no primeiro carregamento
  const hasInitiallyLoaded = React.useRef(false);
  const hasLoadedData = React.useRef(false);
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async (forceRefresh = false) => {
    // Prevenir execução múltipla apenas no carregamento inicial
    if (hasLoadedData.current && !forceRefresh) {
      return;
    }

    if (!hasLoadedData.current) {
      hasLoadedData.current = true;
    }

    try {
      // Apenas mostrar loading/skeleton se nunca carregou antes
      if (!hasInitiallyLoaded.current) {
        setLoading(true);
      }

      const result = await fetchData();
      setData(result);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      // Marcar como carregado inicialmente e remover loading
      if (!hasInitiallyLoaded.current) {
        hasInitiallyLoaded.current = true;
        setLoading(false);
      }
    }
  }, []);

  // Show loading skeleton only on initial load
  if (loading && !hasInitiallyLoaded.current) {
    return <LoadingSkeleton />;
  }

  return <ComponentContent />;
}
```

### Componentes de Estado

**Skeleton Loading Component**
```tsx
function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between py-2">
        <div>
          <h3 className="text-lg font-medium">Título da Seção</h3>
          <p className="text-sm text-muted-foreground">
            Descrição da seção
          </p>
        </div>
      </div>
      {[...Array(2)].map((_, i) => (
        <Card size="sm" variant="rounded" key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(2)].map((_, j) => (
                <Skeleton key={j} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

## Estados de Loading

### 1. Initial Load (Skeleton)
- **Quando**: Primeiro acesso ao componente
- **Comportamento**: Mostra skeleton completo
- **Duração**: Até os dados serem carregados

### 2. Tab Navigation (Sem Skeleton)
- **Quando**: Mudança entre tabs
- **Comportamento**: Mantém UI, atualiza dados silenciosamente
- **Indicador**: Pode usar `isPending` para spinners pequenos

### 3. Manual Refresh (Sem Skeleton)
- **Quando**: Refresh manual pelo usuário
- **Comportamento**: Mantém UI, atualiza dados
- **Indicador**: Use `isPending` para botões de loading

## Flags de Controle

```tsx
// Flag para executar loadData apenas uma vez (controle de fetch)
const hasLoadedData = React.useRef(false);

// Flag para controlar skeleton apenas no primeiro carregamento (controle de UI)
const hasInitiallyLoaded = React.useRef(false);

// State para controlar skeleton rendering
const [loading, setLoading] = useState(true);

// Transition state para operações secundárias
const [isPending, startTransition] = useTransition();
```

## Benefícios

- ✅ **Primeira impressão**: Skeleton no primeiro acesso
- ✅ **Navegação fluida**: Sem skeleton ao trocar tabs
- ✅ **Refresh inteligente**: Dados atualizados sem flicker
- ✅ **Estado consistente**: Loading states apropriados para cada contexto

## Exemplo de Uso

Ver implementação completa em:
`src/app/(protected)/admin/audit/components/sessions-management-content.tsx`

## Convenções

1. **Sempre use `React.useRef`** para flags de controle de carregamento
2. **Separe concerns**: Uma flag para fetch, outra para UI
3. **Loading condicional**: `setLoading(true)` apenas se nunca carregou
4. **Render guard**: `if (loading && !hasInitiallyLoaded.current)`
5. **Marque como carregado**: Após primeiro fetch bem-sucedido