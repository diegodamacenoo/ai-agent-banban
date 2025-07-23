# Guia de Design System - Página de Gestão de Módulos

## 📋 Resumo Executivo

Este documento mapeia granularmente o design system executado nas páginas de gestão de módulos (tabs Módulo Base, Implementações e Atribuições) para orientar novas implementações e garantir consistência visual e funcional.

## 🎨 Arquitetura de Layout

### Layout Principal
**Localização**: `/workspace/src/app/(protected)/admin/modules/management/page.tsx`

```tsx
<Layout loading={combinedLoading}>
  <Layout.Header>
    <Layout.Breadcrumbs items={[...]} />
    <Layout.Actions>
      <Button variant="secondary" onClick={handleReload}>
        <RefreshCw className="mr-2 h-4 w-4" />
        Atualizar
      </Button>
    </Layout.Actions>
  </Layout.Header>

  <Layout.Body>        
    <Layout.Sidebar width="w-80">
      {sidebarContent}
    </Layout.Sidebar>

    <Layout.Content>
      <Tabs items={tabItems} value={activeTab} onValueChange={setActiveTab} />
      <TabsContent value="base-modules" activeValue={activeTab}>
        <Card size="sm" variant="ghost">
          {/* Conteúdo da tab */}
        </Card>
      </TabsContent>
    </Layout.Content>
  </Layout.Body>
</Layout>
```

**Características**:
- Layout dividido em Header, Sidebar (w-80) e Content
- Sidebar contém estatísticas e resumo
- Content principal usa sistema de tabs
- Header com breadcrumbs e ações

## 🗂️ Sistema de Tabs

### Componente Tabs
**Localização**: `/workspace/src/shared/ui/tabs.tsx`

```tsx
const tabItems = [
  { id: 'base-modules', label: 'Módulos Base', icon: <Database className="w-4 h-4" /> },
  { id: 'implementations', label: 'Implementações', icon: <Settings className="w-4 h-4" /> },
  { id: 'assignments', label: 'Atribuições', icon: <Users className="w-4 h-4" /> },
  { id: 'configurations', label: 'Configurações', icon: <Package className="w-4 h-4" /> },
];

<Tabs
  items={tabItems}
  value={activeTab}
  onValueChange={setActiveTab}
  variant="underline"
  className="w-full"
  defaultValue="base-modules"
/>
```

**Padrões de Design**:
- **Variant**: `underline` - tabs com underline animado
- **Ícones**: Lucide icons 4x4 px
- **Animação**: Motion com spring animation
- **Indicador**: Motion.div com transição suave

## 🎯 Tab 1: Módulos Base

### Estrutura de Card
```tsx
<Card size="sm" variant="ghost">
  <CardHeader>
    <div className="flex flex-row items-center justify-between">
      <div>
        <CardTitle>Módulos Base do Sistema</CardTitle>
        <CardDescription>
          Gerencie os módulos base que servem como fundação para implementações específicas.
        </CardDescription>
      </div>
      <CreateBaseModuleDialog trigger={<Button variant="secondary" leftIcon={<Plus />}>
        Novo Módulo Base
      </Button>} />
    </div>
  </CardHeader>
  <CardContent>
    <BaseModulesTable {...props} />
  </CardContent>
</Card>
```

### Tabela de Módulos Base
**Localização**: `/workspace/src/app/(protected)/admin/modules/components/shared/tables/BaseModulesTable.tsx`

#### Grid Layout
```tsx
<div className="md:grid md:grid-cols-[4fr_2fr_1fr_1.25fr_1.25fr_0.5fr] items-center px-4 py-3">
  {/* Módulo Base | Implementações | Atribuições | Saúde | Status | Ações */}
</div>
```

#### Filtros
```tsx
<div className="flex gap-2">
  <Input 
    placeholder="Buscar módulos..."
    leftIcon={<Search className="w-4 h-4" />}
    className="pl-10"
  />
  <Select>
    <SelectTrigger className="w-48">
      <SelectValue placeholder="Filtrar por categoria" />
    </SelectTrigger>
  </Select>
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="secondary">
        <Eye className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
  </DropdownMenu>
</div>
```

#### Sistema de Badges
```tsx
// Status Badge
<Badge variant={getStatusBadge(module).variant} icon={statusIcon}>
  {getStatusBadge(module).text}
</Badge>

// Health Badge  
<Badge variant={getHealthBadgeVariant(score)}>
  {getHealthBadgeText(score)} ({score}%)
</Badge>

// Category Badge
<Badge variant="outline" className="text-xs">
  {module.category}
</Badge>
```

**Variantes de Badge**:
- `default`: Status ativo
- `secondary`: Status arquivado  
- `destructive`: Status deletado
- `muted`: Status inativo
- `warning`: Saúde média (60-79%)
- `success`: Saúde boa (80%+)

## 🔧 Tab 2: Implementações

### Layout Dividido
**Localização**: `/workspace/src/app/(protected)/admin/modules/components/assignments/implementations-manager/index.tsx`

```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
  {/* Lista de Módulos e Implementações */}
  <div className="lg:col-span-2">
    <ModuleImplementationCard />
  </div>

  {/* Painel de Detalhes */}
  <div className="lg:col-span-1">
    <ImplementationDetailsPanel />
  </div>
</div>
```

#### Filtros Específicos
```tsx
<div className="flex gap-2">
  <Input 
    placeholder="Buscar módulos..."
    leftIcon={<Search className="w-4 h-4" />}
  />
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="secondary">
        <Eye className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuCheckboxItem checked={!includeArchivedModules}>
        Apenas Ativos
      </DropdownMenuCheckboxItem>
      <DropdownMenuCheckboxItem checked={includeArchivedModules}>
        Arquivados
      </DropdownMenuCheckboxItem>
    </DropdownMenuContent>
  </DropdownMenu>
  <Button variant="secondary" leftIcon={expandIcon}>
    {/* Toggle expand all */}
  </Button>
</div>
```

#### Estado Vazio
```tsx
<Card size="sm" variant="accent" className="p-6">
  <CardContent className="min-h-[100px] p-6 flex flex-col justify-center items-center text-center">
    <CircleDashed className="w-8 h-8 text-muted-foreground" />
    <p className="text-muted-foreground text-sm">
      {searchTerm ? 'Nenhum módulo encontrado com os filtros aplicados.' : 'Nenhuma implementação encontrada.'}
    </p>
  </CardContent>
</Card>
```

## 👥 Tab 3: Atribuições

### Estrutura Expandível
**Localização**: `/workspace/src/app/(protected)/admin/modules/components/assignments/TenantAssignmentsManager.tsx`

```tsx
<Card variant="highlight" className="p-1 bg-[hsl(var(--highlight))]">
  {/* Tenant Header */}
  <div className="flex flex-row gap-3 px-4 py-2 items-center justify-between">
    <div className="w-fit flex items-center gap-3">
      <Building2 strokeWidth={2.5} className="w-4 h-4 text-[hsl(var(--highlight-foreground))]" />
      <div className="text-left">
        <p className="font-medium text-sm">{tenant.organizationName}</p>
      </div>
    </div>
    <div className="w-fit flex items-center gap-2">
      <span className="text-xs">{tenant.assignments.length} atribuições</span>
      <Button variant="highlight" size="icon" leftIcon={<Plus />} />
      <Button variant="highlight" size="icon" leftIcon={expandIcon} />
    </div>
  </div>

  {/* Assignments List com animação */}
  <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
    isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
  }`}>
    <Card size="xs" className="space-y-2">
      {/* Lista de atribuições */}
    </Card>
  </div>
</Card>
```

#### Grid de Atribuições
```tsx
<div className="md:grid md:grid-cols-[3fr_3fr_2fr_1fr_0.5fr] gap-4 px-3 py-2 rounded-lg hover:bg-[hsl(var(--secondary))]">
  {/* Module Name | Implementation | Config | Status | Actions */}
</div>
```

## 🎨 Padrões de Design

### Cards
**Variantes Utilizadas**:
- `ghost`: Cards principais de tabs (transparente)
- `highlight`: Cards de organizações (com destaque)  
- `accent`: Estados vazios
- `default`: Cards de conteúdo padrão

**Tamanhos**:
- `xs`: Cards aninhados
- `sm`: Cards principais
- `default`: Cards de conteúdo

### Buttons
**Variantes Principais**:
- `secondary`: Ações primárias (Atualizar, filtros)
- `highlight`: Ações em cards highlight
- `ghost`: Ícones de ação
- `outline`: Ações secundárias

**Padrões de Ícones**:
- `leftIcon`: Ícone à esquerda do texto
- Tamanho padrão: `w-4 h-4`
- Stroke weight: `2.3` para destaque

### Sistema de Cores
**CSS Custom Properties**:
```css
--highlight: Cor de destaque para cards importantes
--highlight-foreground: Texto em cards highlight  
--highlight-overlay: Overlay para buttons highlight
--secondary: Cor secundária para backgrounds
--muted-foreground: Texto secundário
--border: Bordas padrão
```

### Animações
**Expansão de Cards**:
```css
transition-all duration-300 ease-in-out overflow-hidden
max-h-[1000px] opacity-100 /* Expandido */
max-h-0 opacity-0 /* Colapsado */
```

**Hover States**:
```css
hover:bg-[hsl(var(--secondary))] transition-colors
```

## 🔍 Sistema de Filtros

### Padrão Consistente
```tsx
<div className="flex gap-2">
  {/* Input de busca */}
  <div className="relative flex-1">
    <Input 
      placeholder="Buscar..."
      leftIcon={<Search className="w-4 h-4" />}
      className="pl-10"
    />
  </div>

  {/* Select de categoria/organização */}
  <Select>
    <SelectTrigger className="w-48">
      <SelectValue placeholder="Filtrar por..." />
    </SelectTrigger>
  </Select>

  {/* Dropdown de visualização */}
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="secondary">
        <Eye className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
  </DropdownMenu>

  {/* Botão de expandir (quando aplicável) */}
  <Button variant="secondary" leftIcon={expandIcon} />
</div>
```

## 📊 Sistema de Estados

### Loading States
```tsx
// Skeleton para tabelas
{[...Array(5)].map((_, i) => (
  <Skeleton key={i} className="h-16 w-full" />
))}

// Loading no header
<div className="h-6 bg-zinc-200 rounded animate-pulse w-48"></div>
```

### Empty States
```tsx
<Card size="sm" variant="accent" className="p-6">
  <CardContent className="min-h-[100px] flex flex-col justify-center items-center text-center">
    <CircleDashed className="w-8 h-8 text-muted-foreground" />
    <p className="text-muted-foreground text-sm">
      {searchTerm ? 'Nenhum resultado encontrado.' : 'Nenhum item encontrado.'}
    </p>
  </CardContent>
</Card>
```

### Error States
```tsx
<ErrorState error={error} onRetry={onRetry} />
```

## 🎯 Operações Otimísticas

### Indicador Visual
```tsx
{hasOptimisticOperations && (
  <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-md text-sm">
    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
    Atualizando...
  </div>
)}
```

## 📝 Resumos de Dados

### Padrão de Resumo
```tsx
<div className="flex justify-between items-center text-sm text-muted-foreground">
  <span>
    Mostrando {filtered.length} de {total.length} itens
  </span>
  <span>
    Total: {active.length} ativos
  </span>
</div>
```

## 🔧 Implementações Futuras

### Diretrizes para Novas Páginas

1. **Utilize o Layout padrão** com Header, Sidebar e Content
2. **Implemente sistema de tabs** quando necessário múltiplas visões
3. **Siga padrões de filtros** estabelecidos
4. **Use cards com variantes** apropriadas para contexto
5. **Implemente estados vazios** informativos
6. **Adicione operações otimísticas** para melhor UX
7. **Mantenha consistência** em badges e buttons
8. **Utilize animações** suaves para expansão/colapso

### Componentes Reutilizáveis

- `Layout` e subcomponentes
- `Tabs` e `TabsContent`
- `Card` com variantes
- `Button` com ícones
- `Badge` com sistema de cores
- `Input` com ícones
- `DropdownMenu` para ações

Este guia serve como referência para manter consistência visual e funcional em todas as implementações futuras do sistema de gestão de módulos.