# 🎨 Guia do PageLayout

O **PageLayout** é um componente flexível para criar layouts padronizados em páginas da aplicação, oferecendo estrutura consistente sem ser restritivo.

## 🎯 Objetivo

Fornecer um template de layout reutilizável que mantém consistência visual e funcional, mas permite total liberdade de customização do conteúdo.

## 🏗️ Características Principais

- ✅ **Flexível** - Você controla totalmente o conteúdo
- ✅ **Não engessado** - Sem títulos ou estruturas fixas obrigatórias
- ✅ **Múltiplos layouts** - Single, sidebar-left, sidebar-right
- ✅ **Estados automáticos** - Loading e error com fallbacks
- ✅ **Header opcional** - Com breadcrumbs e ações
- ✅ **Refresh integrado** - Sistema de atualização automático
- ✅ **Customização total** - Classes CSS personalizadas
- ✅ **Componentes auxiliares** - AnalyticsCard e AnalyticsGrid opcionais

## 🚀 Como Usar

### 1. Layout Simples (Single Column)

```tsx
import { PageLayout } from '@/shared/components/PageLayout';

export default function MinhaPageSimples() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const breadcrumbs = [
    { title: 'Minha Página', href: '/minha-pagina' }
  ];

  const headerActions = [
    {
      label: 'Criar Novo',
      onClick: () => console.log('Criar'),
      icon: <Plus className="h-4 w-4" />
    },
    {
      component: <MeuComponenteCustomizado />
    }
  ];

  return (
    <PageLayout
      breadcrumbs={breadcrumbs}
      headerActions={headerActions}
      layout="single"
      loading={loading}
      error={error}
      onRetry={() => recarregarDados()}
      showRefreshButton={true}
      onRefresh={handleRefresh}
      contentClassName="py-4 px-6"
    >
      {/* SEU CONTEÚDO AQUI - TOTAL LIBERDADE! */}
      <div className="flex flex-col gap-4">
        <h1>Meu Título Customizado</h1>
        
        <Card>
          <CardContent>
            <p>Qualquer conteúdo que você quiser...</p>
          </CardContent>
        </Card>
        
        {/* Seus componentes, tabelas, forms, etc. */}
      </div>
    </PageLayout>
  );
}
```

### 2. Layout com Sidebar Esquerda

```tsx
import { PageLayout, AnalyticsCard, AnalyticsGrid } from '@/shared/components/PageLayout';

export default function MinhaPageComSidebar() {
  const [stats, setStats] = useState({ total: 0, active: 0 });
  
  // Sidebar customizada - você controla o conteúdo
  const sidebarContent = (
    <div className="flex flex-col gap-4 py-4 px-6">
      <h3 className="font-medium">Meus Analytics</h3>
      
      {/* Use os componentes auxiliares se quiser */}
      <AnalyticsGrid>
        <AnalyticsCard
          title="Total"
          description="itens cadastrados"
          value={stats.total}
          icon={<Building2 className="h-4 w-4" />}
        />
        <AnalyticsCard
          title="Ativos"
          description="em funcionamento"
          value={stats.active}
          icon={<Check className="h-4 w-4" />}
          textColor="text-green-600"
        />
      </AnalyticsGrid>
      
      {/* Ou coloque qualquer outro conteúdo */}
      <div className="mt-4">
        <h4 className="font-medium mb-2">Filtros Rápidos</h4>
        <div className="space-y-2">
          <Button variant="ghost" size="sm" className="w-full justify-start">
            Todos os itens
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start">
            Apenas ativos
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <PageLayout
      breadcrumbs={[{ title: 'Dashboard' }]}
      layout="sidebar-left"
      sidebar={{
        content: sidebarContent,
        width: 'w-1/3' // Customize a largura
      }}
      contentClassName="py-4 px-6"
    >
      {/* CONTEÚDO PRINCIPAL - VOCÊ DECIDE TUDO */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Meu Dashboard</h1>
          <Button>Ação Principal</Button>
        </div>
        
        {/* Seus cards, tabelas, gráficos, etc. */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Meu Card 1</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Conteúdo personalizado...</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Meu Card 2</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                {/* Sua tabela customizada */}
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}
```

### 3. Layout com Sidebar Direita

```tsx
return (
  <PageLayout
    layout="sidebar-right"
    sidebar={{
      content: <MeuComponenteSidebar />,
      width: 'w-80' // Largura fixa
    }}
  >
    {/* Conteúdo principal à esquerda */}
  </PageLayout>
);
```

## 📋 Props Disponíveis

### PageLayoutProps

```tsx
interface PageLayoutProps {
  children: ReactNode;                    // SEU CONTEÚDO - obrigatório
  
  // Header (opcional)
  showHeader?: boolean;                   // default: true
  breadcrumbs?: BreadcrumbItem[];
  headerActions?: HeaderAction[];
  
  // Layout
  layout?: 'single' | 'sidebar-left' | 'sidebar-right';  // default: 'single'
  
  // Sidebar (apenas para layouts com sidebar)
  sidebar?: {
    content: ReactNode;                   // SEU conteúdo da sidebar
    width?: string;                       // ex: 'w-1/4', 'w-80', etc.
  };
  
  // Estados globais (opcional)
  loading?: boolean;                      // Mostra loading overlay
  error?: string | null;                  // Mostra tela de erro
  onRetry?: () => void;                   // Função de retry
  
  // Refresh (opcional)
  showRefreshButton?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  lastUpdated?: Date;
  
  // Classes customizadas
  className?: string;                     // Classe do container principal
  headerClassName?: string;               // Classe do header
  sidebarClassName?: string;              // Classe da sidebar
  contentClassName?: string;              // Classe da área de conteúdo
}
```

### HeaderAction

```tsx
interface HeaderAction {
  label?: string;                         // Texto do botão
  onClick?: () => void;                   // Função de clique
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  icon?: ReactNode;                       // Ícone do botão
  disabled?: boolean;
  loading?: boolean;                      // Mostra spinner
  component?: ReactNode;                  // Componente customizado (drawers, etc)
}
```

## 🎨 Componentes Auxiliares (Opcionais)

### AnalyticsCard

```tsx
<AnalyticsCard
  title="Total de Itens"
  description="itens cadastrados"
  value={42}
  icon={<Building2 className="h-4 w-4" />}
  iconBgColor="bg-blue-50"
  textColor="text-blue-600"
  trend={{
    value: 12.5,
    isPositive: true,
    label: 'este mês'
  }}
/>
```

### AnalyticsGrid

```tsx
<AnalyticsGrid className="my-custom-class">
  <AnalyticsCard {...} />
  <AnalyticsCard {...} />
  <AnalyticsCard {...} />
</AnalyticsGrid>
```

## 🔧 Estados Automáticos

### Loading Global

```tsx
<PageLayout loading={true}>
  {/* Este conteúdo não será renderizado durante loading */}
</PageLayout>
```

### Error Global

```tsx
<PageLayout 
  error="Erro ao carregar dados" 
  onRetry={() => recarregarDados()}
>
  {/* Este conteúdo não será renderizado durante erro */}
</PageLayout>
```

### Refresh System

```tsx
<PageLayout
  showRefreshButton={true}
  onRefresh={handleRefresh}
  refreshing={refreshing}
  lastUpdated={lastUpdated}
>
  {/* Mostra botão de refresh e timestamp no header */}
</PageLayout>
```

## 🎯 Vantagens desta Abordagem

### ✅ **Flexibilidade Total**
- Você controla 100% do conteúdo
- Não há estruturas fixas obrigatórias
- Pode usar ou não os componentes auxiliares

### ✅ **Reutilização Inteligente**
- Header padronizado quando necessário
- Estados de loading/error automáticos
- Sistema de refresh integrado

### ✅ **Customização Avançada**
- Classes CSS personalizadas para cada área
- Larguras de sidebar configuráveis
- Layouts múltiplos (single, sidebar-left, sidebar-right)

### ✅ **Componentes Opcionais**
- AnalyticsCard e AnalyticsGrid são opcionais
- Use apenas se fizer sentido para sua página
- Fácil de ignorar e criar seus próprios componentes

## 🔄 Migração do AdminPageProvider

### Antes (Engessado)
```tsx
<TwoColumnAdminPage
  title="Título Fixo"
  breadcrumbs={breadcrumbs}
  leftColumn={{
    title: "Analytics Fixo",
    analytics: analyticsFixos
  }}
  mainContent={{
    title: "Conteúdo Fixo",
    children: meuConteudo
  }}
/>
```

### Depois (Flexível)
```tsx
<PageLayout
  breadcrumbs={breadcrumbs}
  layout="sidebar-left"
  sidebar={{
    content: (
      <div className="py-4 px-6">
        <h3>MEU título customizado</h3>
        {/* Qualquer coisa que eu quiser */}
      </div>
    )
  }}
>
  {/* MEU conteúdo com total liberdade */}
  <div className="py-4 px-6">
    <h1>MEU título principal</h1>
    {/* Qualquer estrutura que eu quiser */}
  </div>
</PageLayout>
```

## 📚 Exemplos Reais

Veja as implementações em:
- `src/app/(protected)/admin/organizations/page.tsx` - Layout com sidebar
- `src/app/(protected)/admin/users/page.tsx` - Layout simples

## 🎨 Personalização Avançada

### Classes CSS Customizadas

```tsx
<PageLayout
  className="bg-gray-50"                 // Container principal
  headerClassName="bg-white shadow-sm"   // Header
  sidebarClassName="bg-white"            // Sidebar
  contentClassName="bg-white rounded-lg" // Área de conteúdo
>
```

### Sidebar Customizada

```tsx
const minhaSidebar = (
  <div className="h-full flex flex-col">
    <div className="p-4 border-b">
      <h3>Meu Header</h3>
    </div>
    <div className="flex-1 p-4">
      {/* Conteúdo scrollável */}
    </div>
    <div className="p-4 border-t">
      <Button className="w-full">Ação da Sidebar</Button>
    </div>
  </div>
);

<PageLayout
  layout="sidebar-left"
  sidebar={{
    content: minhaSidebar,
    width: 'w-96'
  }}
>
```

---

**Resumo**: O PageLayout oferece estrutura quando você precisa, mas nunca limita sua criatividade. Use-o como template, não como prisão! 🚀 