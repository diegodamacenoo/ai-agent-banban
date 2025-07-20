/**
 * NotificationManager - Sistema de notificações de mudanças de status de módulos
 * Fase 5: Admin Interface Enhancement
 * 
 * Sistema completo para:
 * - Configurar notificações por tipo de evento
 * - Gerenciar canais de notificação (email, webhook, in-app)
 * - Definir regras e filtros personalizados
 * - Histórico e auditoria de notificações
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { Badge } from '@/shared/ui/badge';
import { 
  Bell,
  BellRing,
  Mail,
  MessageSquare,
  Webhook,
  Settings,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Save,
  Eye,
  EyeOff,
  Power,
  PowerOff,
  Check,
  X,
  AlertTriangle,
  Info,
  CheckCircle,
  Clock,
  Users,
  Target,
  Filter,
  Search,
  Calendar,
  Send,
  Archive,
  Star,
  StarOff,
  Volume2,
  VolumeX,
  Smartphone,
  Monitor,
  Globe,
  Zap,
  Copy
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';
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
  // TabsList, // TODO: Fix tabs implementation
  // TabsTrigger, // TODO: Fix tabs implementation
} from '@/shared/ui/tabs';
import { Label } from '@/shared/ui/label';
import { Switch } from '@/shared/ui/switch';
import { Checkbox } from '@/shared/ui/checkbox';
import { useToast } from '@/shared/ui/toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui/tooltip';

interface NotificationManagerProps {
  className?: string;
}

interface NotificationRule {
  id: string;
  name: string;
  description: string;
  event_type: 'module_status_change' | 'user_access_change' | 'system_alert' | 'performance_issue' | 'security_event';
  is_enabled: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  conditions: NotificationCondition[];
  channels: NotificationChannel[];
  recipients: NotificationRecipient[];
  rate_limit: {
    max_per_hour: number;
    max_per_day: number;
  };
  created_by: string;
  created_at: string;
  last_triggered?: string;
  trigger_count: number;
}

interface NotificationCondition {
  field: string;
  operator: 'equals' | 'contains' | 'not_equals' | 'greater_than' | 'less_than';
  value: string;
}

interface NotificationChannel {
  type: 'email' | 'webhook' | 'in_app' | 'sms' | 'slack';
  is_enabled: boolean;
  config: Record<string, any>;
  template?: string;
}

interface NotificationRecipient {
  type: 'user' | 'role' | 'organization' | 'custom';
  target_id: string;
  target_name: string;
  is_enabled: boolean;
}

interface NotificationTemplate {
  id: string;
  name: string;
  channel_type: 'email' | 'webhook' | 'in_app' | 'sms' | 'slack';
  subject_template: string;
  body_template: string;
  variables: string[];
  is_system: boolean;
  created_at: string;
}

interface NotificationHistory {
  id: string;
  rule_id: string;
  rule_name: string;
  event_type: string;
  event_data: Record<string, any>;
  channels_sent: string[];
  recipients_count: number;
  status: 'sent' | 'failed' | 'pending' | 'rate_limited';
  error_message?: string;
  sent_at: string;
  response_time_ms: number;
}

/**
 * Gerenciador de notificações de sistema
 */
export const NotificationManager: React.FC<NotificationManagerProps> = ({ className }) => {
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [history, setHistory] = useState<NotificationHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [createRuleDialogOpen, setCreateRuleDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<NotificationRule | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('rules');
  const { toast } = useToast();

  // Form state for new rule
  const [ruleForm, setRuleForm] = useState({
    name: '',
    description: '',
    event_type: 'module_status_change',
    priority: 'medium',
    is_enabled: true
  });

  // Carregar dados
  const loadData = async () => {
    setLoading(true);
    try {
      // Simulação de dados - em produção viria da API
      const mockRules: NotificationRule[] = [
        {
          id: '1',
          name: 'Módulo Inativo - Crítico',
          description: 'Notifica quando um módulo crítico fica inativo por mais de 5 minutos',
          event_type: 'module_status_change',
          is_enabled: true,
          priority: 'critical',
          conditions: [
            { field: 'module_status', operator: 'equals', value: 'inactive' },
            { field: 'module_category', operator: 'equals', value: 'critical' },
            { field: 'downtime_minutes', operator: 'greater_than', value: '5' }
          ],
          channels: [
            { type: 'email', is_enabled: true, config: { template_id: 'critical_alert' } },
            { type: 'webhook', is_enabled: true, config: { url: 'https://hooks.slack.com/...' } },
            { type: 'in_app', is_enabled: true, config: {} }
          ],
          recipients: [
            { type: 'role', target_id: 'admin', target_name: 'Administradores', is_enabled: true },
            { type: 'role', target_id: 'ops', target_name: 'Operações', is_enabled: true }
          ],
          rate_limit: { max_per_hour: 5, max_per_day: 20 },
          created_by: 'system@admin.com',
          created_at: '2024-01-15T10:00:00Z',
          last_triggered: '2024-07-02T14:30:00Z',
          trigger_count: 23
        },
        {
          id: '2',
          name: 'Novo Usuário - Bem-vindo',
          description: 'Envia boas-vindas quando um novo usuário é adicionado ao sistema',
          event_type: 'user_access_change',
          is_enabled: true,
          priority: 'low',
          conditions: [
            { field: 'action', operator: 'equals', value: 'user_created' },
            { field: 'user_status', operator: 'equals', value: 'active' }
          ],
          channels: [
            { type: 'email', is_enabled: true, config: { template_id: 'welcome_user' } },
            { type: 'in_app', is_enabled: true, config: {} }
          ],
          recipients: [
            { type: 'user', target_id: 'new_user', target_name: 'Novo Usuário', is_enabled: true },
            { type: 'role', target_id: 'manager', target_name: 'Gerentes', is_enabled: true }
          ],
          rate_limit: { max_per_hour: 50, max_per_day: 200 },
          created_by: 'hr@system.com',
          created_at: '2024-02-01T09:00:00Z',
          last_triggered: '2024-07-01T16:45:00Z',
          trigger_count: 156
        },
        {
          id: '3',
          name: 'Performance Degradada',
          description: 'Alerta quando a performance de um módulo degrada significativamente',
          event_type: 'performance_issue',
          is_enabled: true,
          priority: 'high',
          conditions: [
            { field: 'response_time_ms', operator: 'greater_than', value: '2000' },
            { field: 'error_rate_percent', operator: 'greater_than', value: '5' }
          ],
          channels: [
            { type: 'email', is_enabled: true, config: { template_id: 'performance_alert' } },
            { type: 'slack', is_enabled: true, config: { channel: '#alerts' } }
          ],
          recipients: [
            { type: 'role', target_id: 'dev', target_name: 'Desenvolvedores', is_enabled: true },
            { type: 'role', target_id: 'ops', target_name: 'Operações', is_enabled: true }
          ],
          rate_limit: { max_per_hour: 10, max_per_day: 50 },
          created_by: 'devops@system.com',
          created_at: '2024-03-15T11:30:00Z',
          last_triggered: '2024-06-30T08:20:00Z',
          trigger_count: 8
        },
        {
          id: '4',
          name: 'Tentativa de Acesso Negado',
          description: 'Notifica sobre tentativas de acesso não autorizadas',
          event_type: 'security_event',
          is_enabled: true,
          priority: 'high',
          conditions: [
            { field: 'event_type', operator: 'equals', value: 'access_denied' },
            { field: 'attempts_count', operator: 'greater_than', value: '3' }
          ],
          channels: [
            { type: 'email', is_enabled: true, config: { template_id: 'security_alert' } },
            { type: 'webhook', is_enabled: true, config: { url: 'https://security.webhook.url' } }
          ],
          recipients: [
            { type: 'role', target_id: 'security', target_name: 'Segurança', is_enabled: true },
            { type: 'role', target_id: 'admin', target_name: 'Administradores', is_enabled: true }
          ],
          rate_limit: { max_per_hour: 20, max_per_day: 100 },
          created_by: 'security@system.com',
          created_at: '2024-04-10T14:00:00Z',
          last_triggered: '2024-06-25T19:10:00Z',
          trigger_count: 45
        }
      ];

      const mockTemplates: NotificationTemplate[] = [
        {
          id: '1',
          name: 'Alerta Crítico',
          channel_type: 'email',
          subject_template: '[CRÍTICO] {{module_name}} - {{event_description}}',
          body_template: `
Olá {{recipient_name}},

Um evento crítico foi detectado no sistema:

Módulo: {{module_name}}
Status: {{module_status}}
Tempo de inatividade: {{downtime_minutes}} minutos
Detectado em: {{event_timestamp}}

Por favor, tome as medidas necessárias imediatamente.

---
Sistema de Monitoramento Automático
          `,
          variables: ['module_name', 'event_description', 'module_status', 'downtime_minutes', 'event_timestamp', 'recipient_name'],
          is_system: true,
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          name: 'Boas-vindas Usuário',
          channel_type: 'email',
          subject_template: 'Bem-vindo ao Sistema {{organization_name}}!',
          body_template: `
Olá {{user_name}},

Bem-vindo ao sistema da {{organization_name}}!

Seu acesso foi configurado com sucesso. Você pode acessar os seguintes módulos:
{{available_modules}}

Primeiros passos:
1. Faça login usando suas credenciais
2. Explore os módulos disponíveis
3. Configure suas preferências

Se precisar de ajuda, entre em contato com nossa equipe.

Atenciosamente,
Equipe {{organization_name}}
          `,
          variables: ['user_name', 'organization_name', 'available_modules'],
          is_system: true,
          created_at: '2024-01-01T00:00:00Z'
        }
      ];

      const mockHistory: NotificationHistory[] = [
        {
          id: '1',
          rule_id: '1',
          rule_name: 'Módulo Inativo - Crítico',
          event_type: 'module_status_change',
          event_data: {
            module_name: 'Sistema de Alertas',
            module_status: 'inactive',
            downtime_minutes: 8,
            affected_users: 45
          },
          channels_sent: ['email', 'webhook', 'in_app'],
          recipients_count: 12,
          status: 'sent',
          sent_at: '2024-07-02T14:30:00Z',
          response_time_ms: 245
        },
        {
          id: '2',
          rule_id: '2',
          rule_name: 'Novo Usuário - Bem-vindo',
          event_type: 'user_access_change',
          event_data: {
            user_name: 'Maria Silva',
            organization_name: 'Empresa ABC',
            user_email: 'maria@empresa.com'
          },
          channels_sent: ['email', 'in_app'],
          recipients_count: 3,
          status: 'sent',
          sent_at: '2024-07-01T16:45:00Z',
          response_time_ms: 189
        },
        {
          id: '3',
          rule_id: '4',
          rule_name: 'Tentativa de Acesso Negado',
          event_type: 'security_event',
          event_data: {
            ip_address: '192.168.1.100',
            attempts_count: 5,
            target_module: 'admin',
            user_agent: 'Chrome/91.0'
          },
          channels_sent: ['email'],
          recipients_count: 8,
          status: 'failed',
          error_message: 'SMTP server timeout',
          sent_at: '2024-06-30T22:15:00Z',
          response_time_ms: 5000
        }
      ];

      setRules(mockRules);
      setTemplates(mockTemplates);
      setHistory(mockHistory);

      console.debug(`✅ Dados de notificações carregados: ${mockRules.length} regras, ${mockHistory.length} histórico`);

    } catch (error) {
      console.error('❌ Erro ao carregar dados de notificações:', error);
      toast.error("Não foi possível carregar as configurações de notificação.", {
        title: "Erro ao carregar dados",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar dados
  const filteredRules = rules.filter(rule => {
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'enabled' && rule.is_enabled) ||
                         (statusFilter === 'disabled' && !rule.is_enabled);
    const matchesEventType = eventTypeFilter === 'all' || rule.event_type === eventTypeFilter;
    const matchesPriority = priorityFilter === 'all' || rule.priority === priorityFilter;
    return matchesStatus && matchesEventType && matchesPriority;
  });

  // Helper functions
  const getPriorityBadge = (priority: string) => {
    const variants = {
      low: 'secondary',
      medium: 'default',
      high: 'light_warning',
      critical: 'light_destructive'
    } as const;
    
    const labels = {
      low: 'Baixa',
      medium: 'Média',
      high: 'Alta',
      critical: 'Crítica'
    } as const;
    
    return (
      <Badge variant={variants[priority as keyof typeof variants] || 'outline'}>
        {labels[priority as keyof typeof labels] || priority}
      </Badge>
    );
  };

  const getEventTypeBadge = (eventType: string) => {
    const variants = {
      module_status_change: 'default',
      user_access_change: 'secondary',
      system_alert: 'light_warning',
      performance_issue: 'light_destructive',
      security_event: 'destructive'
    } as const;
    
    const labels = {
      module_status_change: 'Status Módulo',
      user_access_change: 'Acesso Usuário',
      system_alert: 'Alerta Sistema',
      performance_issue: 'Performance',
      security_event: 'Segurança'
    } as const;
    
    return (
      <Badge variant={variants[eventType as keyof typeof variants] || 'outline'}>
        {labels[eventType as keyof typeof labels] || eventType}
      </Badge>
    );
  };

  const getChannelIcon = (channelType: string) => {
    switch (channelType) {
      case 'email': return Mail;
      case 'webhook': return Webhook;
      case 'in_app': return Bell;
      case 'sms': return Smartphone;
      case 'slack': return MessageSquare;
      default: return Bell;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      sent: 'light_success',
      failed: 'light_destructive',
      pending: 'light_warning',
      rate_limited: 'outline'
    } as const;
    
    const labels = {
      sent: 'Enviado',
      failed: 'Falhou',
      pending: 'Pendente',
      rate_limited: 'Rate Limited'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  // Toggle rule status
  const toggleRuleStatus = async (ruleId: string) => {
    try {
      setRules(prev => prev.map(rule => 
        rule.id === ruleId 
          ? { ...rule, is_enabled: !rule.is_enabled }
          : rule
      ));

      toast.success("A regra de notificação foi atualizada.", {
        title: "Status atualizado",
      });

    } catch (error) {
      toast.error("Não foi possível alterar o status da regra.", {
        title: "Erro ao atualizar",
      });
    }
  };

  // Testar notificação
  const testNotification = async (ruleId: string) => {
    try {
      const rule = rules.find(r => r.id === ruleId);
      if (!rule) return;

      // Simular envio de teste
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success(`Notificação de teste para "${rule.name}" foi enviada.`, {
        title: "Teste enviado",
      });

    } catch (error) {
      toast.error("Não foi possível enviar a notificação de teste.", {
        title: "Erro no teste",
      });
    }
  };

  // Carregar dados na inicialização
  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <Card size="sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Sistema de Notificações
              </CardTitle>
              <CardDescription>
                Configure regras de notificação, gerencie canais e monitore o histórico de envios.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={loadData}
                disabled={loading}
                leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
              >
                Atualizar
              </Button>
              <Dialog open={createRuleDialogOpen} onOpenChange={setCreateRuleDialogOpen}>
                <DialogTrigger asChild>
                  <Button leftIcon={<Plus className="w-4 h-4" />}>
                    Nova Regra
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Criar Nova Regra de Notificação</DialogTitle>
                    <DialogDescription>
                      Configure uma nova regra para notificações automáticas.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Nome da Regra</Label>
                      <Input
                        value={ruleForm.name}
                        onChange={(e) => setRuleForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="ex: Alerta de Módulo Inativo"
                      />
                    </div>
                    <div>
                      <Label>Descrição</Label>
                      <Textarea
                        value={ruleForm.description}
                        onChange={(e) => setRuleForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Descreva quando esta notificação deve ser enviada..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Tipo de Evento</Label>
                        <Select
                          value={ruleForm.event_type}
                          onValueChange={(value) => setRuleForm(prev => ({ ...prev, event_type: value as any }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="module_status_change">Status Módulo</SelectItem>
                            <SelectItem value="user_access_change">Acesso Usuário</SelectItem>
                            <SelectItem value="system_alert">Alerta Sistema</SelectItem>
                            <SelectItem value="performance_issue">Performance</SelectItem>
                            <SelectItem value="security_event">Segurança</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Prioridade</Label>
                        <Select
                          value={ruleForm.priority}
                          onValueChange={(value) => setRuleForm(prev => ({ ...prev, priority: value as any }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Baixa</SelectItem>
                            <SelectItem value="medium">Média</SelectItem>
                            <SelectItem value="high">Alta</SelectItem>
                            <SelectItem value="critical">Crítica</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={ruleForm.is_enabled}
                        onCheckedChange={(checked) => setRuleForm(prev => ({ ...prev, is_enabled: checked }))}
                      />
                      <Label>Ativar regra imediatamente</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateRuleDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button leftIcon={<Save className="w-4 h-4" />}>
                      Criar Regra
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-4 gap-4">
        <Card size="sm">
          <CardContent>
            <div className="flex items-center">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Regras Ativas</p>
                <p className="text-2xl font-bold">
                  {rules.filter(r => r.is_enabled).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent>
            <div className="flex items-center">
              <Send className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Enviadas Hoje</p>
                <p className="text-2xl font-bold">
                  {history.filter(h => 
                    new Date(h.sent_at).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Taxa de Sucesso</p>
                <p className="text-2xl font-bold">
                  {Math.round((history.filter(h => h.status === 'sent').length / history.length) * 100)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent>
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Tempo Médio</p>
                <p className="text-2xl font-bold">
                  {Math.round(history.reduce((sum, h) => sum + h.response_time_ms, 0) / history.length)}ms
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rules">Regras</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        {/* Tab: Regras */}
        <TabsContent value="rules">
          <Card size="sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Regras de Notificação</CardTitle>
                  <CardDescription>
                    Configure quando e como as notificações devem ser enviadas.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32" icon={Filter}>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="enabled">Ativas</SelectItem>
                      <SelectItem value="disabled">Inativas</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                    <SelectTrigger className="w-40" icon={Filter}>
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="module_status_change">Status Módulo</SelectItem>
                      <SelectItem value="user_access_change">Acesso Usuário</SelectItem>
                      <SelectItem value="system_alert">Alerta Sistema</SelectItem>
                      <SelectItem value="performance_issue">Performance</SelectItem>
                      <SelectItem value="security_event">Segurança</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-32" icon={Filter}>
                      <SelectValue placeholder="Prioridade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="critical">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Regra</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Canais</TableHead>
                    <TableHead>Disparos</TableHead>
                    <TableHead>Última Execução</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{rule.name}</div>
                          <div className="text-sm text-muted-foreground max-w-xs">
                            {rule.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getEventTypeBadge(rule.event_type)}</TableCell>
                      <TableCell>{getPriorityBadge(rule.priority)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {rule.is_enabled ? (
                            <Badge variant="light_success" className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Ativa
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <X className="w-3 h-3" />
                              Inativa
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {rule.channels.filter(c => c.is_enabled).map((channel, idx) => {
                            const IconComponent = getChannelIcon(channel.type);
                            return (
                              <TooltipProvider key={idx}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="outline" className="p-1">
                                      <IconComponent className="w-3 h-3" />
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">{channel.type}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            );
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <div className="text-lg font-semibold">{rule.trigger_count}</div>
                          <div className="text-xs text-muted-foreground">total</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {rule.last_triggered ? 
                            new Date(rule.last_triggered).toLocaleString('pt-BR') :
                            'Nunca'
                          }
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => toggleRuleStatus(rule.id)}
                          >
                            {rule.is_enabled ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => testNotification(rule.id)}
                          >
                            <Send className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Settings className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Templates */}
        <TabsContent value="templates">
          <Card size="sm">
            <CardHeader>
              <CardTitle>Templates de Notificação</CardTitle>
              <CardDescription>
                Gerencie templates para diferentes tipos de notificação.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead>Variáveis</TableHead>
                    <TableHead>Sistema</TableHead>
                    <TableHead>Criado Em</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{template.name}</div>
                          <div className="text-sm text-muted-foreground max-w-xs">
                            {template.subject_template}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {React.createElement(getChannelIcon(template.channel_type), { className: "w-4 h-4" })}
                          <span className="capitalize">{template.channel_type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {template.variables.slice(0, 3).map(variable => (
                            <Badge key={variable} variant="outline" className="text-xs">
                              {variable}
                            </Badge>
                          ))}
                          {template.variables.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{template.variables.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {template.is_system ? (
                          <Badge variant="secondary">Sistema</Badge>
                        ) : (
                          <Badge variant="outline">Customizado</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(template.created_at).toLocaleDateString('pt-BR')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-3 h-3" />
                          </Button>
                          {!template.is_system && (
                            <>
                              <Button variant="ghost" size="sm">
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Copy className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Histórico */}
        <TabsContent value="history">
          <Card size="sm">
            <CardHeader>
              <CardTitle>Histórico de Notificações</CardTitle>
              <CardDescription>
                Acompanhe o histórico de todas as notificações enviadas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Regra</TableHead>
                    <TableHead>Evento</TableHead>
                    <TableHead>Canais</TableHead>
                    <TableHead>Destinatários</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tempo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(item.sent_at).toLocaleString('pt-BR')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{item.rule_name}</div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.event_type}</div>
                          <div className="text-xs text-muted-foreground">
                            {Object.keys(item.event_data).length} dados
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {item.channels_sent.map(channel => (
                            <Badge key={channel} variant="outline" className="text-xs">
                              {channel}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <div className="text-lg font-semibold">{item.recipients_count}</div>
                          <div className="text-xs text-muted-foreground">enviados</div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {item.response_time_ms}ms
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NotificationManager;