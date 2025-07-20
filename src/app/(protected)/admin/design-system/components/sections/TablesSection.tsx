import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/shared/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/shared/ui/dropdown-menu';
import { ComponentSection } from '../DesignSystemSection';
import { 
  MoreHorizontal, 
  Settings, 
  LifeBuoy, 
  User
} from 'lucide-react';

export function TablesSection() {
  return (
    <>
      {/* Tabela Tradicional */}
      <ComponentSection title="Tabela">
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
              <TableCell><Badge variant="success">Ativo</Badge></TableCell>
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

      {/* Tabela Grid */}
      <ComponentSection 
        title="Tabela Grid (CSS Grid)" 
        description="Implementação de tabela usando CSS Grid similar ao BaseModulesTable"
      >
        <div className="rounded-lg border">
          {/* Cabeçalho */}
          <div className="grid grid-cols-[3fr_2fr_1fr_1fr_0.5fr] items-center px-4 py-3 text-sm font-medium text-muted-foreground border-b">
            <div>Módulo</div>
            <div>Categoria</div>
            <div>Status</div>
            <div>Saúde</div>
            <div></div>
          </div>
          
          {/* Linhas */}
          <div className="divide-y">
            <div className="grid grid-cols-[3fr_2fr_1fr_1fr_0.5fr] items-center px-4 py-3 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium text-sm">Performance Analytics</div>
                  <div className="text-xs text-muted-foreground">Análise de performance em tempo real</div>
                </div>
              </div>
              <div>
                <Badge variant="outline" className="text-xs">Analytics</Badge>
              </div>
              <div>
                <Badge variant="success">Ativo</Badge>
              </div>
              <div>
                <Badge variant="default">Saudável (85%)</Badge>
              </div>
              <div className="flex justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Ver Detalhes</DropdownMenuItem>
                    <DropdownMenuItem>Editar</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive">Excluir</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="grid grid-cols-[3fr_2fr_1fr_1fr_0.5fr] items-center px-4 py-3 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2">
                <LifeBuoy className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium text-sm">Inventory Management</div>
                  <div className="text-xs text-muted-foreground">Gestão de estoque e produtos</div>
                </div>
              </div>
              <div>
                <Badge variant="outline" className="text-xs">Inventory</Badge>
              </div>
              <div>
                <Badge variant="warning">Atenção</Badge>
              </div>
              <div>
                <Badge variant="warning">Atenção (60%)</Badge>
              </div>
              <div className="flex justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Ver Detalhes</DropdownMenuItem>
                    <DropdownMenuItem>Editar</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive">Excluir</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="grid grid-cols-[3fr_2fr_1fr_1fr_0.5fr] items-center px-4 py-3 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="font-medium text-sm">User Management</div>
                  <div className="text-xs text-muted-foreground">Controle de usuários e permissões</div>
                </div>
              </div>
              <div>
                <Badge variant="outline" className="text-xs">Security</Badge>
              </div>
              <div>
                <Badge variant="destructive">Inativo</Badge>
              </div>
              <div>
                <Badge variant="destructive">Crítico (20%)</Badge>
              </div>
              <div className="flex justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Ver Detalhes</DropdownMenuItem>
                    <DropdownMenuItem>Editar</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive">Excluir</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 text-sm text-muted-foreground">
          <strong>Características da Tabela Grid:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Implementada com CSS Grid ao invés de elementos HTML de tabela</li>
            <li>Responsiva e flexível com colunas configuráveis</li>
            <li>Hover effects e transições suaves</li>
            <li>Ícones e badges integrados</li>
            <li>Menu de ações com dropdown</li>
            <li>Suporte a dados complexos com sub-informações</li>
          </ul>
        </div>
      </ComponentSection>
    </>
  );
}