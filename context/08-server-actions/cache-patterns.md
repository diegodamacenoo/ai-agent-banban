# Cache Patterns para Server Actions

## Global Component Cache Pattern

### Problema
Componentes React são desmontados/remontados causando requisições desnecessárias a server actions.

### Solução
Cache global persistente fora do componente React.

```typescript
// Cache global (fora do componente)
let globalDataCache: DataType | null = null;
let globalCacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Função para invalidar cache
export function invalidateDataCache() {
  globalDataCache = null;
  globalCacheTimestamp = 0;
}

export function MyComponent() {
  const [data, setData] = useState<DataType>(defaultData);
  
  useEffect(() => {
    // Verificar cache primeiro
    const now = Date.now();
    if (globalDataCache && (now - globalCacheTimestamp) < CACHE_DURATION) {
      setData(globalDataCache);
      return;
    }
    
    // Carregar do servidor apenas se necessário
    loadData();
  }, []);

  const loadData = async () => {
    const result = await getServerData();
    if (result.success) {
      setData(result.data);
      // Atualizar cache global
      globalDataCache = result.data;
      globalCacheTimestamp = Date.now();
    }
  };
}
```

### Quando Usar
- Dados que mudam raramente (configurações, settings)
- Componentes que são desmontados/remontados frequentemente
- Abas ou modais com dados custosos para carregar

### Benefícios
- Reduz 80-90% das requisições desnecessárias
- Melhora UX com carregamento instantâneo
- Mantém dados atualizados com TTL configurável

### Server Actions Tracking
Sempre adicione tracking para debugging:

```typescript
export async function getServerData(): Promise<ActionResult> {
  trackServerCall('📊 SERVER: getServerData');
  // ... implementação
}
```

### Consolidação de revalidatePath
Use helpers para evitar calls redundantes:

```typescript
function revalidateModulesPaths() {
  revalidatePath('/admin/modules', 'layout');
}

// Em vez de múltiplas chamadas
// revalidatePath('/admin/modules');
// revalidatePath('/admin/implementations');
```