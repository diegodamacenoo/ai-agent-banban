import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/shared/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel
} from '@/shared/ui/dropdown-menu';
import { ComponentSection } from '../DesignSystemSection';
import { 
  MoreHorizontal, 
  Settings, 
  LifeBuoy, 
  User,
  Package,
  Database,
  Search,
  Eye,
  Plus,
  Edit,
  Trash2,
  Archive,
  RotateCcw,
  CircleDashed,
  Building2,
  Code,
  Activity,
  ChevronsUpDown,
  ChevronsDownUp
} from 'lucide-react';

export function TablesSection() {
  // Estado para controlar expansão
  const [isExpanded, setIsExpanded] = useState(true);

  // Mock data seguindo padrões da gestão de módulos
  const mockModules = [
    {
      id: '1',
      name: 'Performance Analytics',
      slug: 'performance-analytics',
      description: 'Análise de performance em tempo real',
      category: 'Analytics',
      icon: 'Activity',
      implementationsCount: 3,
      activeImplementationsCount: 2,
      assignmentsCount: 5,
      organizationsCount: 3,
      healthScore: 85,
      status: 'active'
    },
    {
      id: '2', 
      name: 'Inventory Management',
      slug: 'inventory-management',
      description: 'Gestão de estoque e produtos',
      category: 'Inventory',
      icon: 'Package',
      implementationsCount: 2,
      activeImplementationsCount: 1,
      assignmentsCount: 2,
      organizationsCount: 2,
      healthScore: 60,
      status: 'active'
    },
    {
      id: '3',
      name: 'User Management', 
      slug: 'user-management',
      description: 'Controle de usuários e permissões',
      category: 'Security',
      icon: 'User',
      implementationsCount: 1,
      activeImplementationsCount: 0,
      assignmentsCount: 0,
      organizationsCount: 0,
      healthScore: 20,
      status: 'inactive'
    }
  ];

  const iconComponents = {
    Activity,
    Package, 
    User,
    Settings,
    Database,
    LifeBuoy
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return { variant: 'default' as const, text: 'Ativo' };
      case 'inactive':
        return { variant: 'muted' as const, text: 'Inativo' };
      case 'archived':
        return { variant: 'secondary' as const, text: 'Arquivado' };
      default:
        return { variant: 'muted' as const, text: 'Desconhecido' };
    }
  };

  const getHealthBadge = (score: number) => {
    if (score >= 80) return { variant: 'default' as const, text: 'Saudável' };
    if (score >= 60) return { variant: 'warning' as const, text: 'Atenção' };
    return { variant: 'destructive' as const, text: 'Crítico' };
  };

  return (
    <>
      {/* Tabela Tradicional */}
      <ComponentSection title="Tabela Tradicional">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Ana Silva</TableCell>
              <TableCell><Badge variant="default">Ativo</Badge></TableCell>
              <TableCell>Admin</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Bruno Costa</TableCell>
              <TableCell><Badge variant="secondary">Inativo</Badge></TableCell>
              <TableCell>Editor</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Carla Dias</TableCell>
              <TableCell><Badge variant="warning">Pendente</Badge></TableCell>
              <TableCell>Visualizador</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </ComponentSection>

      {/* Tabela Estilo Gestão de Módulos */}
      <ComponentSection 
        title="Tabela Estilo Gestão de Módulos" 
        description="Implementação completa seguindo os padrões da página de gestão de módulos"
      >
        <Card size="sm" variant="ghost">
          <CardHeader>
            <div className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Módulos Base do Sistema</CardTitle>
                <CardDescription>
                  Exemplo seguindo as diretrizes da gestão de módulos com filtros, badges e ações.
                </CardDescription>
              </div>
              <Button variant="secondary" className="flex items-center gap-2" leftIcon={<Plus className="w-4 h-4" />}>
                Novo Módulo Base
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Sistema de Filtros - Padrão Gestão Módulos */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Buscar módulos..."
                    className="pl-10"
                    leftIcon={<Search className="w-4 h-4" />}
                  />
                </div>

                <Select>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrar por categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    <SelectItem value="analytics">Analytics</SelectItem>
                    <SelectItem value="inventory">Inventory</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                  </SelectContent>
                </Select>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Opções de Visualização</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem checked={true}>
                      Em Operação
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={false}>
                      Arquivados
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={false}>
                      Deletados
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Tabela Grid - Exato como BaseModulesTable */}
              <div className="rounded-lg">
                {/* Cabeçalho */}
                <div className="md:grid md:grid-cols-[4fr_2fr_1fr_1.25fr_1.25fr_0.5fr] items-center px-4 py-3 text-sm text-muted-foreground">
                  <div>Módulo Base</div>
                  <div>Implementações</div>
                  <div>Atribuições</div>
                  <div>Saúde</div>
                  <div>Status</div>
                  <div></div>
                </div>

                {/* Corpo */}
                <div>
                  {mockModules.map((module) => {
                    const IconComponent = iconComponents[module.icon as keyof typeof iconComponents] || Package;
                    const statusBadge = getStatusBadge(module.status);
                    const healthBadge = getHealthBadge(module.healthScore);

                    return (
                      <div key={module.id} className="md:grid md:grid-cols-[4fr_2fr_1fr_1.25fr_1.25fr_0.5fr] items-center px-4 py-3 rounded-lg hover:bg-[hsl(var(--secondary))] transition-colors">
                        
                        {/* Coluna Módulo Base */}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <IconComponent strokeWidth={2.3} className="w-5 h-5 text-[hsl(var(--highlight-foreground))]" />
                            <span className="font-medium text-sm">{module.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {module.category}
                            </Badge>
                          </div>
                          <p className="text-xs tracking-wide text-muted-foreground">
                            {module.description}
                          </p>
                        </div>

                        {/* Coluna Implementações */}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
                              {module.implementationsCount} {module.implementationsCount === 1 ? 'implementação' : 'implementações'}
                            </span>
                            {module.activeImplementationsCount < module.implementationsCount && (
                              <Badge className="text-xs">
                                {module.activeImplementationsCount} ativas
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Standard, Banban, Enterprise
                          </div>
                        </div>

                        {/* Coluna Atribuições */}
                        <div>
                          <div className="flex items-center gap-2">
                            {module.assignmentsCount === 0 ? (
                              <span className="text-sm">Nenhuma</span>
                            ) : (
                              <span className="text-sm">{module.organizationsCount} orgs</span>
                            )}
                          </div>
                        </div>

                        {/* Coluna Saúde */}
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant={healthBadge.variant}>
                              {healthBadge.text} ({module.healthScore}%)
                            </Badge>
                          </div>
                        </div>

                        {/* Coluna Status */}
                        <div>
                          <Badge variant={statusBadge.variant}>
                            {statusBadge.text}
                          </Badge>
                        </div>

                        {/* Coluna Ações */}
                        <div className="flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                Ver Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                Editar Módulo
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                Gerenciar Implementações
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                Arquivar
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-500">
                                Excluir Módulo
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Resumo - Padrão Gestão Módulos */}
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>
                  Mostrando {mockModules.length} de {mockModules.length} módulos base
                </span>
                <span>
                  Total: {mockModules.reduce((acc, m) => acc + m.implementationsCount, 0)} implementações, {mockModules.reduce((acc, m) => acc + m.assignmentsCount, 0)} assignments ativos
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-sm text-muted-foreground">
          <strong>Diretrizes do Design System da Gestão de Módulos:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li><strong>Layout:</strong> Card ghost com CardHeader e CardContent</li>
            <li><strong>Filtros:</strong> Input com ícone à esquerda, Select de categoria, DropdownMenu com Eye icon</li>
            <li><strong>Grid:</strong> CSS Grid responsivo com colunas proporcionais [4fr_2fr_1fr_1.25fr_1.25fr_0.5fr]</li>
            <li><strong>Ícones:</strong> Lucide icons com strokeWidth 2.3 e cor highlight-foreground</li>
            <li><strong>Badges:</strong> Variantes semânticas (default, warning, destructive, outline)</li>
            <li><strong>Hover:</strong> bg-[hsl(var(--secondary))] com transition-colors</li>
            <li><strong>Ações:</strong> DropdownMenu com MoreHorizontal trigger em button ghost</li>
            <li><strong>Resumo:</strong> Estatísticas em text-muted-foreground na base</li>
          </ul>
        </div>
      </ComponentSection>

      {/* Estado Vazio - Padrão Gestão Módulos */}
      <ComponentSection 
        title="Estado Vazio" 
        description="Estado vazio seguindo padrões da gestão de módulos"
      >
        <Card size="sm" variant="accent" className="p-6">
          <CardContent className="min-h-[100px] p-6 flex flex-col justify-center items-center text-center text-[hsl(var(--muted-foreground))]">
            <CircleDashed className="w-8 h-8 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">
              Nenhum módulo encontrado com os filtros aplicados.
            </p>
          </CardContent>
        </Card>
      </ComponentSection>

      {/* Tabela Expandível - Padrão Atribuições */}
      <ComponentSection 
        title="Tabela Expandível - Estilo Atribuições" 
        description="Layout expandível usado na tab de atribuições"
      >
        <div className="space-y-1">
          <Card variant="highlight" className="p-1 bg-[hsl(var(--highlight))]">
            {/* Tenant Header */}
            <div className="flex flex-row gap-3 px-4 py-2 items-center justify-between">
              <div className="w-fit flex items-center gap-3">
                <Building2 strokeWidth={2.5} className="w-4 h-4 text-[hsl(var(--highlight-foreground))]" />
                <div className="text-left">
                  <p className="font-medium text-sm">Organização Exemplo</p>
                </div>
              </div>
              <div className="w-fit flex items-center gap-2">
                <span className="text-xs">3 atribuições</span>
                <Button variant="highlight" size="icon" leftIcon={<Plus className="w-4 h-4" />} />
                <Button
                  variant="highlight"
                  size="icon"
                  onClick={() => setIsExpanded(!isExpanded)}
                  leftIcon={isExpanded ? <ChevronsDownUp className="w-4 h-4" /> : <ChevronsUpDown className="w-4 h-4" />}
                />
              </div>
            </div>

            {/* Assignments List */}
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
              isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
            }`}>
              <Card size="xs" className="space-y-2">
                <div className="space-y-1">
                  <div className="md:grid md:grid-cols-[3fr_3fr_2fr_1fr_0.5fr] gap-4 px-3 py-2 rounded-lg transition-all hover:bg-[hsl(var(--secondary))]">
                    {/* Module Name */}
                    <div className="flex gap-3">
                      <div>
                        <div className="flex gap-2">
                          <span className="font-medium text-sm">Performance Analytics</span>
                        </div>
                        <p className="text-sm text-muted-foreground font-mono">Analytics</p>
                      </div>
                    </div>

                    {/* Implementation */}
                    <div className="flex items-center">
                      <div>
                        <span className="text-sm font-medium">Implementação Banban</span>
                        <p className="text-sm text-muted-foreground">banban-performance</p>
                      </div>
                    </div>

                    {/* Config */}
                    <div className="flex items-center">
                      <div className="flex items-center gap-2">
                        <Code className="w-4 h-4 text-[hsl(var(--color-green-300))]" />
                        <Badge variant="secondary">2 configs</Badge>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center">
                      <Badge variant="default">Ativo</Badge>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem icon={Edit}>
                            Editar Configuração
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-500 focus:text-red-500" icon={Trash2}>
                            Desatribuir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </Card>
        </div>

        <div className="mt-4 text-sm text-muted-foreground">
          <strong>Características da Tabela Expandível:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li><strong>Card Highlight:</strong> Usa variant="highlight" com bg-[hsl(var(--highlight))]</li>
            <li><strong>Header Expansível:</strong> Building2 icon com strokeWidth 2.5</li>
            <li><strong>Botão Expandir:</strong> ChevronsUpDown/ChevronsDownUp com variant="highlight"</li>
            <li><strong>Animação:</strong> transition-all duration-300 ease-in-out</li>
            <li><strong>Estados:</strong> max-h-[1000px] opacity-100 (expandido) / max-h-0 opacity-0 (colapsado)</li>
            <li><strong>Grid Interno:</strong> [3fr_3fr_2fr_1fr_0.5fr] para atribuições</li>
            <li><strong>Cards Aninhados:</strong> Card size="xs" dentro do principal</li>
          </ul>
        </div>
      </ComponentSection>
    </>
  );
}