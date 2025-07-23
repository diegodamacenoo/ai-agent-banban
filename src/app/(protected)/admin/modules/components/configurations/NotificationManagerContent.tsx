/**
 * NotificationManagerContent - Versão sem Card wrapper
 * Apenas o conteúdo do gerenciador de notificações
 */

'use client';

import React, { useState } from 'react';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { 
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight
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

export function NotificationManagerContent() {
  const [activeTab, setActiveTab] = useState('rules');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  
  // Mock data
  const rules = [
    {
      id: '1',
      name: 'Módulo Criado',
      event: 'module.created',
      channel: 'email',
      recipients: 'Admins',
      is_active: true,
      last_triggered: '2024-01-12 14:30'
    },
    {
      id: '2',
      name: 'Erro Crítico',
      event: 'system.critical_error',
      channel: 'sms',
      recipients: 'DevOps',
      is_active: true,
      last_triggered: '2024-01-11 09:15'
    }
  ];

  const stats = {
    activeRules: 12,
    sentToday: 234,
    successRate: 98.5,
    avgDeliveryTime: '1.2s'
  };

  const getChannelIcon = (channel: string) => {
    const icons = {
      email: Mail,
      sms: Smartphone,
      slack: MessageSquare,
      webhook: Send
    };
    
    const Icon = icons[channel as keyof typeof icons] || Bell;
    return <Icon className="w-3 h-3" />;
  };

  const getChannelBadge = (channel: string) => {
    const variants = {
      email: 'outline',
      sms: 'light_warning',
      slack: 'light_purple',
      webhook: 'light_success'
    } as const;
    
    return (
      <Badge variant={variants[channel as keyof typeof variants] || 'outline'} className="flex items-center gap-1">
        {getChannelIcon(channel)}
        {channel.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-background border rounded-lg p-4">
          <div className="flex items-center">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <div className="ml-2">
              <p className="text-sm font-medium leading-none">Regras Ativas</p>
              <p className="text-2xl font-bold">{stats.activeRules}</p>
            </div>
          </div>
        </div>
        <div className="bg-background border rounded-lg p-4">
          <div className="flex items-center">
            <Send className="h-4 w-4 text-muted-foreground" />
            <div className="ml-2">
              <p className="text-sm font-medium leading-none">Enviadas Hoje</p>
              <p className="text-2xl font-bold">{stats.sentToday}</p>
            </div>
          </div>
        </div>
        <div className="bg-background border rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
            <div className="ml-2">
              <p className="text-sm font-medium leading-none">Taxa de Sucesso</p>
              <p className="text-2xl font-bold">{stats.successRate}%</p>
            </div>
          </div>
        </div>
        <div className="bg-background border rounded-lg p-4">
          <div className="flex items-center">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div className="ml-2">
              <p className="text-sm font-medium leading-none">Tempo Médio</p>
              <p className="text-2xl font-bold">{stats.avgDeliveryTime}</p>
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
          { id: 'rules', label: 'Regras' },
          { id: 'templates', label: 'Templates' },
          { id: 'history', label: 'Histórico' }
        ]}
      />

      {/* Conteúdo das tabs */}
      <div className="mt-6">
        {/* Tab: Regras */}
        <TabsContent value="rules" activeValue={activeTab} className="space-y-4">
          {/* Filtros */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar regras..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48" icon={Filter}>
                <SelectValue placeholder="Canal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os canais</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="slack">Slack</SelectItem>
                <SelectItem value="webhook">Webhook</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabela de regras */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome da Regra</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Destinatários</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Último Disparo</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">{rule.name}</TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-1 py-0.5 rounded">
                      {rule.event}
                    </code>
                  </TableCell>
                  <TableCell>{getChannelBadge(rule.channel)}</TableCell>
                  <TableCell>{rule.recipients}</TableCell>
                  <TableCell>
                    {rule.is_active ? (
                      <Badge variant="light_success" className="flex items-center gap-1 w-fit">
                        <ToggleRight className="w-3 h-3" />
                        Ativa
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                        <ToggleLeft className="w-3 h-3" />
                        Inativa
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {rule.last_triggered}
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

        {/* Outras tabs */}
        <TabsContent value="templates" activeValue={activeTab}>
          <div className="text-center py-8 text-muted-foreground">
            Templates de notificação em desenvolvimento...
          </div>
        </TabsContent>

        <TabsContent value="history" activeValue={activeTab}>
          <div className="text-center py-8 text-muted-foreground">
            Histórico de notificações em desenvolvimento...
          </div>
        </TabsContent>
      </div>
    </div>
  );
}