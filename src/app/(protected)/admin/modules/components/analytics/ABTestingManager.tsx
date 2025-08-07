/**
 * ABTestingManager - Sistema de A/B testing de diferentes configurações
 * Fase 5: Admin Interface Enhancement
 * 
 * Sistema completo para:
 * - Criar e gerenciar experimentos A/B
 * - Configurar variações de módulos e navegação
 * - Monitorar métricas e resultados
 * - Análise estatística de significância
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { Badge } from '@/shared/ui/badge';
import { 
  TestTube,
  Play,
  Pause,
  StopCircle,
  BarChart3,
  TrendingUp,
  Target,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  Edit,
  Copy,
  Trash2,
  RefreshCw,
  Save,
  Eye,
  Settings,
  Calendar,
  Filter,
  Shuffle,
  Zap,
  Award,
  Activity,
  PieChart,
  ArrowUp,
  ArrowDown,
  Minus,
  Percent,
  Hash,
  Globe
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
  // TabsList,
  // TabsTrigger,
} from '@/shared/ui/tabs';
import { Label } from '@/shared/ui/label';
import { Switch } from '@/shared/ui/switch';
import { Slider } from '@/shared/ui/slider';
import { useToast } from '@/shared/ui/toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui/tooltip';

interface ABTestingManagerProps {
  className?: string;
}

interface ABTestExperiment {
  id: string;
  name: string;
  description: string;
  type: 'navigation' | 'module_config' | 'ui_layout' | 'feature_flag';
  status: 'draft' | 'running' | 'paused' | 'completed' | 'terminated';
  start_date: string;
  end_date?: string;
  expected_duration_days: number;
  traffic_allocation: number; // % of users in experiment
  target_metric: string;
  hypothesis: string;
  significance_level: number; // 0.05 = 95% confidence
  power: number; // 0.8 = 80% power
  min_detectable_effect: number; // % minimum effect to detect
  variants: ABTestVariant[];
  results?: ABTestResults;
  created_by: string;
  created_at: string;
}

interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  is_control: boolean;
  traffic_split: number; // % of experiment traffic
  configuration: Record<string, any>;
  metrics?: VariantMetrics;
}

interface VariantMetrics {
  participants: number;
  conversions: number;
  conversion_rate: number;
  avg_session_duration: number;
  bounce_rate: number;
  user_satisfaction: number;
  revenue_per_user?: number;
  page_views_per_session: number;
}

interface ABTestResults {
  winner?: string; // variant_id
  confidence_level: number;
  p_value: number;
  statistical_significance: boolean;
  lift: number; // % improvement over control
  confidence_interval: [number, number];
  recommendation: 'continue' | 'stop_winner' | 'stop_no_effect' | 'needs_more_data';
  total_participants: number;
  days_running: number;
}

interface ExperimentFormData {
  name: string;
  description: string;
  type: 'navigation' | 'module_config' | 'ui_layout' | 'feature_flag';
  target_metric: string;
  hypothesis: string;
  expected_duration_days: number;
  traffic_allocation: number;
  significance_level: number;
  min_detectable_effect: number;
}

/**
 * Gerenciador de experimentos A/B
 */
export const ABTestingManager: React.FC<ABTestingManagerProps> = ({ className }) => {
  const [experiments, setExperiments] = useState<ABTestExperiment[]>([]);
  const [loading, setLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedExperiment, setSelectedExperiment] = useState<ABTestExperiment | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('experiments');
  const { toast } = useToast();

  // Form data for new experiment
  const [experimentForm, setExperimentForm] = useState<ExperimentFormData>({
    name: '',
    description: '',
    type: 'navigation',
    target_metric: 'conversion_rate',
    hypothesis: '',
    expected_duration_days: 14,
    traffic_allocation: 20,
    significance_level: 0.05,
    min_detectable_effect: 5
  });

  // Carregar experimentos
  const loadExperiments = useCallback(async () => {
    setLoading(true);
    try {
      // Simulação de dados - em produção viria da API
      const mockExperiments: ABTestExperiment[] = [
        {
          id: '1',
          name: 'Navegação Simplificada vs. Completa',
          description: 'Teste entre navegação simplificada com menos itens vs. navegação completa com todos os módulos',
          type: 'navigation',
          status: 'running',
          start_date: '2024-06-20T10:00:00Z',
          expected_duration_days: 21,
          traffic_allocation: 30,
          target_metric: 'user_engagement',
          hypothesis: 'Uma navegação mais simples aumentará o engagement dos usuários em 15%',
          significance_level: 0.05,
          power: 0.8,
          min_detectable_effect: 10,
          variants: [
            {
              id: 'control',
              name: 'Navegação Completa (Controle)',
              description: 'Navegação atual com todos os módulos visíveis',
              is_control: true,
              traffic_split: 50,
              configuration: { navigation_style: 'full', visible_modules: 'all' },
              metrics: {
                participants: 1247,
                conversions: 896,
                conversion_rate: 71.9,
                avg_session_duration: 420,
                bounce_rate: 23.1,
                user_satisfaction: 4.2,
                page_views_per_session: 5.8
              }
            },
            {
              id: 'variant_a',
              name: 'Navegação Simplificada',
              description: 'Navegação com apenas módulos mais usados visíveis',
              is_control: false,
              traffic_split: 50,
              configuration: { navigation_style: 'simplified', visible_modules: ['alerts', 'performance', 'reports'] },
              metrics: {
                participants: 1203,
                conversions: 942,
                conversion_rate: 78.3,
                avg_session_duration: 468,
                bounce_rate: 18.7,
                user_satisfaction: 4.5,
                page_views_per_session: 6.2
              }
            }
          ],
          results: {
            confidence_level: 97.2,
            p_value: 0.028,
            statistical_significance: true,
            lift: 8.9,
            confidence_interval: [3.2, 14.6],
            recommendation: 'continue',
            total_participants: 2450,
            days_running: 12
          },
          created_by: 'admin@system.com',
          created_at: '2024-06-18T14:00:00Z'
        },
        {
          id: '2',
          name: 'Tema Escuro vs. Claro no Módulo de Alertas',
          description: 'Teste de impacto do tema escuro na usabilidade do módulo de alertas',
          type: 'ui_layout',
          status: 'running',
          start_date: '2024-06-25T09:00:00Z',
          expected_duration_days: 14,
          traffic_allocation: 25,
          target_metric: 'completion_rate',
          hypothesis: 'O tema escuro reduzirá a fadiga visual e aumentará a taxa de conclusão de tarefas em 12%',
          significance_level: 0.05,
          power: 0.8,
          min_detectable_effect: 8,
          variants: [
            {
              id: 'control',
              name: 'Tema Claro (Controle)',
              description: 'Interface padrão com tema claro',
              is_control: true,
              traffic_split: 50,
              configuration: { theme: 'light', color_scheme: 'default' },
              metrics: {
                participants: 634,
                conversions: 521,
                conversion_rate: 82.2,
                avg_session_duration: 380,
                bounce_rate: 28.4,
                user_satisfaction: 4.1,
                page_views_per_session: 4.9
              }
            },
            {
              id: 'variant_b',
              name: 'Tema Escuro',
              description: 'Interface com tema escuro e cores ajustadas',
              is_control: false,
              traffic_split: 50,
              configuration: { theme: 'dark', color_scheme: 'dark_optimized' },
              metrics: {
                participants: 612,
                conversions: 518,
                conversion_rate: 84.6,
                avg_session_duration: 395,
                bounce_rate: 24.8,
                user_satisfaction: 4.3,
                page_views_per_session: 5.1
              }
            }
          ],
          results: {
            confidence_level: 68.4,
            p_value: 0.316,
            statistical_significance: false,
            lift: 2.9,
            confidence_interval: [-2.1, 7.9],
            recommendation: 'needs_more_data',
            total_participants: 1246,
            days_running: 7
          },
          created_by: 'designer@system.com',
          created_at: '2024-06-23T11:30:00Z'
        },
        {
          id: '3',
          name: 'Performance Widget: Gráfico vs. Tabela',
          description: 'Teste de formato de exibição de dados no módulo de performance',
          type: 'module_config',
          status: 'completed',
          start_date: '2024-05-15T08:00:00Z',
          end_date: '2024-06-15T08:00:00Z',
          expected_duration_days: 30,
          traffic_allocation: 40,
          target_metric: 'data_comprehension',
          hypothesis: 'Visualização em gráfico aumentará a compreensão dos dados em 20%',
          significance_level: 0.05,
          power: 0.8,
          min_detectable_effect: 15,
          variants: [
            {
              id: 'control',
              name: 'Exibição em Tabela (Controle)',
              description: 'Dados exibidos em formato tabular tradicional',
              is_control: true,
              traffic_split: 50,
              configuration: { display_format: 'table', sorting: true, pagination: true },
              metrics: {
                participants: 2456,
                conversions: 1578,
                conversion_rate: 64.3,
                avg_session_duration: 512,
                bounce_rate: 35.2,
                user_satisfaction: 3.8,
                page_views_per_session: 3.4
              }
            },
            {
              id: 'variant_c',
              name: 'Exibição em Gráfico',
              description: 'Dados visualizados em gráficos interativos',
              is_control: false,
              traffic_split: 50,
              configuration: { display_format: 'chart', chart_type: 'interactive', filters: true },
              metrics: {
                participants: 2389,
                conversions: 1891,
                conversion_rate: 79.2,
                avg_session_duration: 623,
                bounce_rate: 22.1,
                user_satisfaction: 4.4,
                page_views_per_session: 4.7
              }
            }
          ],
          results: {
            winner: 'variant_c',
            confidence_level: 99.8,
            p_value: 0.002,
            statistical_significance: true,
            lift: 23.2,
            confidence_interval: [18.7, 27.8],
            recommendation: 'stop_winner',
            total_participants: 4845,
            days_running: 31
          },
          created_by: 'product@system.com',
          created_at: '2024-05-10T10:00:00Z'
        },
        {
          id: '4',
          name: 'Feature Flag: Auto-refresh Alerts',
          description: 'Teste de ativação do auto-refresh nos alertas',
          type: 'feature_flag',
          status: 'draft',
          start_date: '2024-07-05T10:00:00Z',
          expected_duration_days: 10,
          traffic_allocation: 15,
          target_metric: 'alert_response_time',
          hypothesis: 'Auto-refresh melhorará o tempo de resposta a alertas em 25%',
          significance_level: 0.05,
          power: 0.8,
          min_detectable_effect: 20,
          variants: [
            {
              id: 'control',
              name: 'Refresh Manual (Controle)',
              description: 'Usuário precisa atualizar manualmente',
              is_control: true,
              traffic_split: 50,
              configuration: { auto_refresh: false, refresh_interval: null }
            },
            {
              id: 'variant_d',
              name: 'Auto-refresh 30s',
              description: 'Página atualiza automaticamente a cada 30 segundos',
              is_control: false,
              traffic_split: 50,
              configuration: { auto_refresh: true, refresh_interval: 30 }
            }
          ],
          created_by: 'dev@system.com',
          created_at: '2024-07-01T16:00:00Z'
        }
      ];

      setExperiments(mockExperiments);
      console.debug(`✅ ${mockExperiments.length} experimentos carregados`);

    } catch (error) {
      console.error('❌ Erro ao carregar experimentos:', error);
      toast.error("Não foi possível carregar os experimentos A/B.", {
        title: "Erro ao carregar experimentos",
      });
    } finally {
      setLoading(false);
    }
  }, []); // ✅ No dependencies needed - only uses state setters

  // Filtrar experimentos
  const filteredExperiments = experiments.filter(exp => {
    const matchesStatus = statusFilter === 'all' || exp.status === statusFilter;
    const matchesType = typeFilter === 'all' || exp.type === typeFilter;
    return matchesStatus && matchesType;
  });

  // Helper functions
  const getStatusBadge = (status: string) => {
    const variants = {
      draft: 'outline',
      running: 'light_success',
      paused: 'light_warning',
      completed: 'secondary',
      terminated: 'light_destructive'
    } as const;
    
    const labels = {
      draft: 'Rascunho',
      running: 'Em Execução',
      paused: 'Pausado',
      completed: 'Concluído',
      terminated: 'Terminado'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const variants = {
      navigation: 'default',
      module_config: 'secondary',
      ui_layout: 'light_warning',
      feature_flag: 'light_success'
    } as const;
    
    const labels = {
      navigation: 'Navegação',
      module_config: 'Config Módulo',
      ui_layout: 'Layout UI',
      feature_flag: 'Feature Flag'
    } as const;
    
    return (
      <Badge variant={variants[type as keyof typeof variants] || 'outline'}>
        {labels[type as keyof typeof labels] || type}
      </Badge>
    );
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 95) {
      return (
        <Badge variant="light_success" className="flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          {confidence.toFixed(1)}%
        </Badge>
      );
    } else if (confidence >= 80) {
      return (
        <Badge variant="light_warning" className="flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          {confidence.toFixed(1)}%
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {confidence.toFixed(1)}%
        </Badge>
      );
    }
  };

  const getLiftBadge = (lift: number) => {
    if (lift > 0) {
      return (
        <Badge variant="light_success" className="flex items-center gap-1">
          <ArrowUp className="w-3 h-3" />
          +{lift.toFixed(1)}%
        </Badge>
      );
    } else if (lift < 0) {
      return (
        <Badge variant="light_destructive" className="flex items-center gap-1">
          <ArrowDown className="w-3 h-3" />
          {lift.toFixed(1)}%
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <Minus className="w-3 h-3" />
          0%
        </Badge>
      );
    }
  };

  const getRecommendationBadge = (recommendation: string) => {
    const variants = {
      continue: 'light_success',
      stop_winner: 'secondary',
      stop_no_effect: 'light_warning',
      needs_more_data: 'outline'
    } as const;
    
    const labels = {
      continue: 'Continuar',
      stop_winner: 'Parar - Temos Vencedor',
      stop_no_effect: 'Parar - Sem Efeito',
      needs_more_data: 'Precisa Mais Dados'
    } as const;
    
    return (
      <Badge variant={variants[recommendation as keyof typeof variants] || 'outline'}>
        {labels[recommendation as keyof typeof labels] || recommendation}
      </Badge>
    );
  };

  // Criar novo experimento
  const createExperiment = async () => {
    try {
      // Validação básica
      if (!experimentForm.name || !experimentForm.hypothesis) {
        throw new Error('Nome e hipótese são obrigatórios');
      }

      // Simular criação
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newExperiment: ABTestExperiment = {
        id: Date.now().toString(),
        ...experimentForm,
        status: 'draft',
        start_date: new Date().toISOString(),
        power: 0.8,
        variants: [],
        created_by: 'admin@system.com',
        created_at: new Date().toISOString()
      };

      setExperiments(prev => [...prev, newExperiment]);
      setCreateDialogOpen(false);
      
      // Reset form
      setExperimentForm({
        name: '',
        description: '',
        type: 'navigation',
        target_metric: 'conversion_rate',
        hypothesis: '',
        expected_duration_days: 14,
        traffic_allocation: 20,
        significance_level: 0.05,
        min_detectable_effect: 5
      });

      toast.success(`O experimento ${newExperiment.name} foi criado com sucesso.`, {
        title: "Experimento criado",
      });

    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro desconhecido", {
        title: "Erro ao criar experimento",
      });
    }
  };

  // Controlar experimento
  const controlExperiment = async (experimentId: string, action: 'start' | 'pause' | 'stop') => {
    try {
      const experiment = experiments.find(e => e.id === experimentId);
      if (!experiment) return;

      let newStatus: string;
      switch (action) {
        case 'start':
          newStatus = experiment.status === 'paused' ? 'running' : 'running';
          break;
        case 'pause':
          newStatus = 'paused';
          break;
        case 'stop':
          newStatus = experiment.results?.winner ? 'completed' : 'terminated';
          break;
        default:
          return;
      }

      setExperiments(prev => prev.map(exp => 
        exp.id === experimentId 
          ? { ...exp, status: newStatus as any }
          : exp
      ));

      toast.success(`Experimento ${action === 'start' ? 'iniciado' : action === 'pause' ? 'pausado' : 'finalizado'}.`, {
        title: "Status atualizado",
      });

    } catch (error) {
      toast.error("Não foi possível alterar o status do experimento.", {
        title: "Erro ao controlar experimento",
      });
    }
  };

  // Carregar dados na inicialização
  useEffect(() => {
    loadExperiments();
  }, [loadExperiments]); // ✅ Includes dependency used inside the callback

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <Card size="sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="w-5 h-5" />
                A/B Testing
              </CardTitle>
              <CardDescription>
                Gerencie experimentos, configure variações e analise resultados estatísticos.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={loadExperiments}
                disabled={loading}
                leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
              >
                Atualizar
              </Button>
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button leftIcon={<Plus className="w-4 h-4" />}>
                    Novo Experimento
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Criar Novo Experimento A/B</DialogTitle>
                    <DialogDescription>
                      Configure um novo teste A/B para otimização de funcionalidades.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Nome do Experimento</Label>
                      <Input
                        value={experimentForm.name}
                        onChange={(e) => setExperimentForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="ex: Teste de Nova Navegação"
                      />
                    </div>
                    <div>
                      <Label>Descrição</Label>
                      <Textarea
                        value={experimentForm.description}
                        onChange={(e) => setExperimentForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Descreva o que será testado..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Tipo</Label>
                        <Select
                          value={experimentForm.type}
                          onValueChange={(value) => setExperimentForm(prev => ({ ...prev, type: value as any }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="navigation">Navegação</SelectItem>
                            <SelectItem value="module_config">Config Módulo</SelectItem>
                            <SelectItem value="ui_layout">Layout UI</SelectItem>
                            <SelectItem value="feature_flag">Feature Flag</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Métrica Alvo</Label>
                        <Select
                          value={experimentForm.target_metric}
                          onValueChange={(value) => setExperimentForm(prev => ({ ...prev, target_metric: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="conversion_rate">Taxa de Conversão</SelectItem>
                            <SelectItem value="user_engagement">Engagement</SelectItem>
                            <SelectItem value="session_duration">Duração da Sessão</SelectItem>
                            <SelectItem value="bounce_rate">Taxa de Rejeição</SelectItem>
                            <SelectItem value="user_satisfaction">Satisfação</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Hipótese</Label>
                      <Textarea
                        value={experimentForm.hypothesis}
                        onChange={(e) => setExperimentForm(prev => ({ ...prev, hypothesis: e.target.value }))}
                        placeholder="ex: Simplificar a navegação aumentará o engagement em 15%"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Duração (dias)</Label>
                        <Input
                          type="number"
                          value={experimentForm.expected_duration_days}
                          onChange={(e) => setExperimentForm(prev => ({ ...prev, expected_duration_days: parseInt(e.target.value) }))}
                          min="1"
                          max="90"
                        />
                      </div>
                      <div>
                        <Label>% Tráfego</Label>
                        <Input
                          type="number"
                          value={experimentForm.traffic_allocation}
                          onChange={(e) => setExperimentForm(prev => ({ ...prev, traffic_allocation: parseInt(e.target.value) }))}
                          min="5"
                          max="100"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Nível de Significância</Label>
                        <Select
                          value={experimentForm.significance_level.toString()}
                          onValueChange={(value) => setExperimentForm(prev => ({ ...prev, significance_level: parseFloat(value) }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0.01">99% (α = 0.01)</SelectItem>
                            <SelectItem value="0.05">95% (α = 0.05)</SelectItem>
                            <SelectItem value="0.10">90% (α = 0.10)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Efeito Mínimo (%)</Label>
                        <Input
                          type="number"
                          value={experimentForm.min_detectable_effect}
                          onChange={(e) => setExperimentForm(prev => ({ ...prev, min_detectable_effect: parseInt(e.target.value) }))}
                          min="1"
                          max="50"
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={createExperiment} leftIcon={<Save className="w-4 h-4" />}>
                      Criar Experimento
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
              <TestTube className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Total Experimentos</p>
                <p className="text-2xl font-bold">{experiments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent>
            <div className="flex items-center">
              <Play className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Em Execução</p>
                <p className="text-2xl font-bold">
                  {experiments.filter(e => e.status === 'running').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent>
            <div className="flex items-center">
              <Award className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Concluídos</p>
                <p className="text-2xl font-bold">
                  {experiments.filter(e => e.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent>
            <div className="flex items-center">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Participantes</p>
                <p className="text-2xl font-bold">
                  {experiments
                    .filter(e => e.results)
                    .reduce((sum, e) => sum + (e.results?.total_participants || 0), 0)
                    .toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="experiments">Experimentos</TabsTrigger>
          <TabsTrigger value="results">Resultados</TabsTrigger>
        </TabsList> */}
        <div className="grid w-full grid-cols-2 gap-2">
          <Button variant={activeTab === 'experiments' ? 'default' : 'outline'} onClick={() => setActiveTab('experiments')}>Experimentos</Button>
          <Button variant={activeTab === 'results' ? 'default' : 'outline'} onClick={() => setActiveTab('results')}>Resultados</Button>
        </div>

        {/* Tab: Experimentos */}
        <TabsContent value="experiments">
          <Card size="sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Experimentos A/B</CardTitle>
                  <CardDescription>
                    Gerencie e monitore todos os experimentos em andamento.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32" icon={Filter}>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="draft">Rascunho</SelectItem>
                      <SelectItem value="running">Em Execução</SelectItem>
                      <SelectItem value="paused">Pausado</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-40" icon={Filter}>
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="navigation">Navegação</SelectItem>
                      <SelectItem value="module_config">Config Módulo</SelectItem>
                      <SelectItem value="ui_layout">Layout UI</SelectItem>
                      <SelectItem value="feature_flag">Feature Flag</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Experimento</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Participantes</TableHead>
                    <TableHead>Confiança</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExperiments.map((experiment) => (
                    <TableRow key={experiment.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{experiment.name}</div>
                          <div className="text-sm text-muted-foreground max-w-xs">
                            {experiment.description}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Métrica: {experiment.target_metric}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(experiment.type)}</TableCell>
                      <TableCell>{getStatusBadge(experiment.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {experiment.status === 'running' || experiment.status === 'paused' ? (
                            <div>
                              <div>{experiment.results?.days_running || 0} / {experiment.expected_duration_days} dias</div>
                              <div className="w-16 h-1 bg-gray-200 rounded-full mt-1">
                                <div 
                                  className="h-full bg-blue-500 rounded-full transition-all"
                                  style={{ 
                                    width: `${Math.min(100, ((experiment.results?.days_running || 0) / experiment.expected_duration_days) * 100)}%` 
                                  }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span>{experiment.expected_duration_days} dias</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <div className="text-lg font-semibold">
                            {experiment.results?.total_participants?.toLocaleString() || 0}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {experiment.traffic_allocation}% tráfego
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {experiment.results ? 
                          getConfidenceBadge(experiment.results.confidence_level) :
                          <Badge variant="outline">-</Badge>
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {experiment.status === 'draft' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => controlExperiment(experiment.id, 'start')}
                            >
                              <Play className="w-3 h-3" />
                            </Button>
                          )}
                          {experiment.status === 'running' && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => controlExperiment(experiment.id, 'pause')}
                              >
                                <Pause className="w-3 h-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => controlExperiment(experiment.id, 'stop')}
                              >
                                <StopCircle className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                          {experiment.status === 'paused' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => controlExperiment(experiment.id, 'start')}
                            >
                              <Play className="w-3 h-3" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm">
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Copy className="w-3 h-3" />
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

        {/* Tab: Resultados */}
        <TabsContent value="results">
          <Card size="sm">
            <CardHeader>
              <CardTitle>Resultados Estatísticos</CardTitle>
              <CardDescription>
                Análise de resultados e significância estatística dos experimentos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Experimento</TableHead>
                    <TableHead>Controle vs. Variação</TableHead>
                    <TableHead>Lift</TableHead>
                    <TableHead>Confiança</TableHead>
                    <TableHead>P-Value</TableHead>
                    <TableHead>Recomendação</TableHead>
                    <TableHead>Vencedor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {experiments
                    .filter(exp => exp.results && (exp.status === 'running' || exp.status === 'completed'))
                    .map((experiment) => {
                      const control = experiment.variants.find(v => v.is_control);
                      const variant = experiment.variants.find(v => !v.is_control);
                      
                      return (
                        <TableRow key={experiment.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{experiment.name}</div>
                              <div className="text-sm text-muted-foreground">{experiment.target_metric}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {control && variant && (
                              <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span>Controle:</span>
                                  <span className="font-medium">
                                    {control.metrics?.conversion_rate.toFixed(1)}%
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span>Variação:</span>
                                  <span className="font-medium">
                                    {variant.metrics?.conversion_rate.toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {experiment.results && getLiftBadge(experiment.results.lift)}
                          </TableCell>
                          <TableCell>
                            {experiment.results && getConfidenceBadge(experiment.results.confidence_level)}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-mono">
                              {experiment.results?.p_value.toFixed(4)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {experiment.results && getRecommendationBadge(experiment.results.recommendation)}
                          </TableCell>
                          <TableCell>
                            {experiment.results?.winner ? (
                              <Badge variant="light_success" className="flex items-center gap-1">
                                <Award className="w-3 h-3" />
                                {experiment.variants.find(v => v.id === experiment.results?.winner)?.name || 'Variação'}
                              </Badge>
                            ) : (
                              <Badge variant="outline">TBD</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ABTestingManager;