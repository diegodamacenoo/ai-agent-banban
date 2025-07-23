/**
 * PermissionManagerContent - Versão sem Card wrapper
 * Apenas o conteúdo do gerenciador de permissões
 */

'use client';

import React, { useState } from 'react';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { 
  Shield, 
  Users, 
  UserCheck, 
  Key,
  Activity,
  Search,
  Filter,
  Lock,
  Unlock,
  Crown,
  User,
  Edit,
  Trash2
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import {
  Tabs,
  TabsContent,
} from '@/shared/ui/tabs';

export function PermissionManagerContent() {
  const [activeTab, setActiveTab] = useState('permissions');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('all');
  
  // Mock data
  const permissions = [
    {
      id: '1',
      permission_key: 'modules.create',
      permission_name: 'Criar Módulos',
      module_slug: 'system',
      category: 'write',
      is_sensitive: true,
      description: 'Permite criar novos módulos base no sistema'
    },
    {
      id: '2',
      permission_key: 'modules.delete',
      permission_name: 'Deletar Módulos',
      module_slug: 'system',
      category: 'admin',
      is_sensitive: true,
      description: 'Permite deletar módulos permanentemente'
    }
  ];

  const stats = {
    permissions: 45,
    roles: 8,
    activeUsers: 124,
    todayActions: 89
  };

  const getCategoryBadge = (category: string) => {
    const variants = {
      read: 'light_success',
      write: 'light_warning',
      admin: 'light_destructive',
      special: 'light_purple'
    } as const;
    
    const labels = {
      read: 'Leitura',
      write: 'Escrita',
      admin: 'Admin',
      special: 'Especial'
    } as const;
    
    return (
      <Badge variant={variants[category as keyof typeof variants] || 'outline'}>
        {labels[category as keyof typeof labels] || category}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-background border rounded-lg p-4">
          <div className="flex items-center">
            <Key className="h-4 w-4 text-muted-foreground" />
            <div className="ml-2">
              <p className="text-sm font-medium leading-none">Permissões</p>
              <p className="text-2xl font-bold">{stats.permissions}</p>
            </div>
          </div>
        </div>
        <div className="bg-background border rounded-lg p-4">
          <div className="flex items-center">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div className="ml-2">
              <p className="text-sm font-medium leading-none">Papéis</p>
              <p className="text-2xl font-bold">{stats.roles}</p>
            </div>
          </div>
        </div>
        <div className="bg-background border rounded-lg p-4">
          <div className="flex items-center">
            <UserCheck className="h-4 w-4 text-muted-foreground" />
            <div className="ml-2">
              <p className="text-sm font-medium leading-none">Usuários Ativos</p>
              <p className="text-2xl font-bold">{stats.activeUsers}</p>
            </div>
          </div>
        </div>
        <div className="bg-background border rounded-lg p-4">
          <div className="flex items-center">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <div className="ml-2">
              <p className="text-sm font-medium leading-none">Ações Hoje</p>
              <p className="text-2xl font-bold">{stats.todayActions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs principais */}
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="w-full"
        items={[
          { id: 'permissions', label: 'Permissões' },
          { id: 'roles', label: 'Papéis' },
          { id: 'users', label: 'Usuários' },
          { id: 'audit', label: 'Auditoria' }
        ]}
      />

      {/* Conteúdo das tabs */}
      <div className="mt-6">
        {/* Tab: Permissões */}
        <TabsContent value="permissions" activeValue={activeTab} className="space-y-4">
          {/* Filtros */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar permissões..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <Select value={selectedModule} onValueChange={setSelectedModule}>
              <SelectTrigger className="w-48" icon={Filter}>
                <SelectValue placeholder="Módulo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os módulos</SelectItem>
                <SelectItem value="system">Sistema</SelectItem>
                <SelectItem value="alerts">Alertas</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabela de permissões */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Permissão</TableHead>
                <TableHead>Módulo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Sensível</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissions.map((permission) => (
                <TableRow key={permission.id}>
                  <TableCell>
                    <div className="font-medium">{permission.permission_name}</div>
                    <div className="text-sm text-muted-foreground font-mono">
                      {permission.permission_key}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{permission.module_slug}</Badge>
                  </TableCell>
                  <TableCell>{getCategoryBadge(permission.category)}</TableCell>
                  <TableCell>
                    {permission.is_sensitive ? (
                      <Badge variant="light_destructive" className="flex items-center gap-1 w-fit">
                        <Lock className="w-3 h-3" />
                        Sim
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                        <Unlock className="w-3 h-3" />
                        Não
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="text-sm">{permission.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm">
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        {/* Outras tabs seguem o mesmo padrão... */}
        <TabsContent value="roles" activeValue={activeTab}>
          <div className="text-center py-8 text-muted-foreground">
            Gerenciamento de papéis em desenvolvimento...
          </div>
        </TabsContent>

        <TabsContent value="users" activeValue={activeTab}>
          <div className="text-center py-8 text-muted-foreground">
            Permissões de usuários em desenvolvimento...
          </div>
        </TabsContent>

        <TabsContent value="audit" activeValue={activeTab}>
          <div className="text-center py-8 text-muted-foreground">
            Log de auditoria em desenvolvimento...
          </div>
        </TabsContent>
      </div>
    </div>
  );
}