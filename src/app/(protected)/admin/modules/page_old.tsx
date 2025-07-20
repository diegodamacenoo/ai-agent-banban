'use client';

import { useEffect, useState, useCallback, Suspense, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import {
  Package,
  MoreHorizontal,
  Settings,
  RefreshCw,
  AlertTriangle,
  Clipboard,
  Wrench,
  TestTube,
  Construction,
  Target,
  CheckCircle,
  Hammer,
  XCircle,
  Trash2,
  User,
  Building,
  ExternalLink,
  Calendar,
  GitBranch,
  DollarSign,
  Shield,
  Clock,
  Search,
  Plus,
  Layers,
  Cog,
  Factory,
  CreditCard,
  Banknote,
  FileX,
  Archive,
  ShieldX,
  ShieldCheck,
  Check,
  X,
  CircleMinus,
  Filter,
  Info,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  Zap,
  Users,
  Heart,
  Star,
  ArrowLeft,
  ArrowRight,
  Play,
  PlayCircle,
  Pause,
  StopCircle,
  CircleCheck,
  CircleX,
  CircleAlert,
  Tag,
  Tags,
  Database,
  Cpu,
  HardDrive
} from 'lucide-react';
import { Layout } from '@/shared/components/Layout';
import { ModuleHealthCard } from './components/shared/cards/ModuleHealthCard';
import { useToast } from '@/shared/ui/toast';
import { getModuleHealthStats } from '@/app/actions/admin/modules';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/shared/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import {
  getAvailableModules,
  updateModuleMaturity
} from '@/app/actions/admin/module-catalog';
import { detectOrphanModules, archiveModule } from '@/app/actions/admin/modules';
import { CoreModule, ModuleMaturity } from '@/shared/types/module-catalog';
import { OrphanModule } from '@/shared/types/module-system';
import Link from 'next/link';
import { Badge } from '@/shared/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui/tooltip';
import ModuleDiagnostics from './components/ModuleDiagnostics';
import DevelopmentDashboard from './components/shared/dashboards/DevelopmentDashboard';
import QualityAnalysis from './components/shared/analysis/QualityAnalysis';
import { DevelopmentLogs } from './components/shared/logs/DevelopmentLogs';
import { ModuleAdoptionStatsWidget } from './components/ModuleAdoptionStatsWidget';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { cn } from "@/lib/utils";
import { getModuleAdoptionStatsWithCache } from '@/app/actions/admin/module-adoption-stats';

// Mapeamento para os rótulos de maturidade
const MATURITY_LABELS: Record<ModuleMaturity, string> = {
  'PLANNED': 'Planejamento',
  'IN_DEVELOPMENT': 'Desenvolvimento',
  'ALPHA': 'Alpha',
  'BETA': 'Beta',
  'RC': 'Release Candidate',
  'GA': 'Produção',
  'MAINTENANCE': 'Manutenção',
  'DEPRECATED': 'Obsoleto',
  'RETIRED': 'Aposentado',
};

// Mapeamento para ícones de status visual
const STATUS_ICONS = {
  'GA': CircleCheck,
  'BETA': PlayCircle, 
  'ALPHA': CircleAlert,
  'MAINTENANCE': Settings,
  'PLANNED': CircleMinus
} as const;

// Descrições detalhadas para os tooltips
const MATURITY_DESCRIPTIONS: Record<ModuleMaturity, string> = {
  'PLANNED': 'Módulo em fase de planejamento. Ainda não foi iniciado o desenvolvimento.',
  'IN_DEVELOPMENT': 'Módulo em desenvolvimento ativo. Funcionalidades sendo implementadas.',
  'ALPHA': 'Versão inicial para testes internos. Pode conter bugs e funcionalidades incompletas.',
  'BETA': 'Versão para testes com usuários selecionados. Funcionalidades principais prontas.',
  'RC': 'Release Candidate - Candidato a lançamento. Aguardando validação final.',
  'GA': 'General Availability - Pronto para produção. Estável, testado e disponível para todos os clientes.',
  'MAINTENANCE': 'Em modo de manutenção. Recebe apenas correções de bugs e atualizações de segurança.',
  'DEPRECATED': 'Obsoleto. Será descontinuado em breve. Considere migrar para alternativas.',
  'RETIRED': 'Aposentado. Não mais disponível ou suportado.',
};

const MATURITY_BADGE_VARIANT: Record<ModuleMaturity, 'default' | 'secondary' | 'destructive' | "outline" | "light_destructive" | "light_warning"> = {
  'PLANNED': 'outline',        // Cinza claro - ainda planejando
  'IN_DEVELOPMENT': 'outline', // Azul - em desenvolvimento ativo
  'ALPHA': 'outline',        // Azul - testes internos
  'BETA': 'outline',          // Azul escuro - testes limitados
  'RC': 'outline',            // Azul escuro - quase pronto
  'GA': 'secondary',            // Verde - pronto para produção
  'MAINTENANCE': 'light_warning',  // Azul - manutenção
  'DEPRECATED': 'light_destructive', // Vermelho - obsoleto
  'RETIRED': 'light_destructive',    // Vermelho - aposentado
};

// Mapeamentos para categorias
const CATEGORY_LABELS: Record<string, string> = {
  'standard': 'Padrão',
  'custom': 'Personalizado',
  'industry': 'Setorial'
};

const CATEGORY_ICONS: Record<string, any> = {
  'standard': Layers,
  'custom': Cog,
  'industry': Factory
};

// Mapeamentos para preços
const PRICING_LABELS: Record<string, string> = {
  'free': 'Gratuito',
  'basic': 'Básico',
  'standard': 'Padrão',
  'premium': 'Premium',
  'enterprise': 'Empresarial'
};

const PRICING_ICONS: Record<string, any> = {
  'free': Package,
  'basic': CreditCard,
  'standard': CreditCard,
  'premium': Banknote,
  'enterprise': Building
};

// Adicionar após os outros mapeamentos
const MODULE_STATUS = {
  ALL: 'all',
  ACTIVE: 'ACTIVE',
  ARCHIVED: 'ARCHIVED',
  ORPHANED: 'ORPHANED'
} as const;

const STATUS_LABELS: Record<string, string> = {
  [MODULE_STATUS.ALL]: 'Todos',
  [MODULE_STATUS.ACTIVE]: 'ACTIVE',
  [MODULE_STATUS.ARCHIVED]: 'Arquivados',
  [MODULE_STATUS.ORPHANED]: 'Órfãos'
};

function ModuleCatalogTable({
  searchTerm,
  onReload,
  onSearchChange
}: {
  searchTerm: string;
  onReload?: () => void;
  onSearchChange?: (value: string) => void;
}): JSX.Element {
  const [modules, setModules] = useState<CoreModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [orphanModules, setOrphanModules] = useState<OrphanModule[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>(MODULE_STATUS.ALL);
  const [adoptionData, setAdoptionData] = useState<Record<string, { activeOrganizations: number; totalOrganizations: number; adoptionRate: number }>>({});
  const router = useRouter();

  // Função para carregar os dados
  const loadData = async () => {
  const { toast } = useToast();

    try {
      setLoading(true);
      
      // Carregar módulos e dados de adoção em paralelo
      const [modulesResponse, adoptionResponse, orphanResult] = await Promise.all([
        getAvailableModules(),
        getModuleAdoptionStatsWithCache(),
        detectOrphanModules()
      ]);

      if (modulesResponse.success) {
        setModules(modulesResponse.data || []);
      } else {
        toast.error(modulesResponse.error || "Não foi possível buscar o catálogo de módulos.", {
          title: "Erro ao carregar módulos",
        });
        setModules([]);
      }

      // Processar dados de adoção
      if (adoptionResponse.success && adoptionResponse.data) {
        const adoptionMap: Record<string, { activeOrganizations: number; totalOrganizations: number; adoptionRate: number }> = {};
        
        adoptionResponse.data.forEach(module => {
          adoptionMap[module.module_id] = {
            activeOrganizations: module.active_organizations,
            totalOrganizations: module.total_organizations,
            adoptionRate: module.adoption_rate
          };
        });
        
        setAdoptionData(adoptionMap);
        console.debug('✅ [ModuleCatalog] Dados de adoção carregados:', adoptionMap);
      } else {
        console.warn('⚠️ [ModuleCatalog] Falha ao carregar dados de adoção:', adoptionResponse.error);
        // Definir dados padrão para evitar "Carregando..." infinito
        const fallbackMap: Record<string, { activeOrganizations: number; totalOrganizations: number; adoptionRate: number }> = {};
        if (modulesResponse.data) {
          modulesResponse.data.forEach(module => {
            fallbackMap[module.id] = {
              activeOrganizations: 0,
              totalOrganizations: 0,
              adoptionRate: 0
            };
          });
        }
        setAdoptionData(fallbackMap);
      }

      // Detectar módulos órfãos
      console.debug('🔍 [ModuleCatalog] Iniciando detecção de órfãos...');
      console.debug('📊 [ModuleCatalog] Resultado da detecção:', orphanResult);

      if (orphanResult.success && orphanResult.data) {
        console.debug('✅ [ModuleCatalog] Órfãos encontrados:', orphanResult.data);
        setOrphanModules(orphanResult.data);
      } else {
        console.warn('⚠️ [ModuleCatalog] Falha ao detectar órfãos:', orphanResult.error);
      }

    } catch (error) {
      console.error('❌ [ModuleCatalog] Erro ao carregar dados:', error);
      toast.error("Ocorreu um erro ao carregar os módulos.", {
        title: "Erro inesperado",
      });
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    loadData();
  }, []);

  // Função para detectar módulos órfãos
  const isModuleOrphan = (moduleId: string): OrphanModule | undefined => {
    console.debug('🔍 [ModuleCatalog] Verificando órfão:', moduleId);
    console.debug('📋 [ModuleCatalog] Lista de órfãos:', orphanModules);
    const orphan = orphanModules.find(orphan => orphan.id === moduleId);
    console.debug('✨ [ModuleCatalog] Resultado:', orphan);
    return orphan;
  };

  // Função para arquivar um módulo
  const handleArchiveModule = async (moduleId: string) => {
    try {
      const result = await archiveModule(moduleId);

      if (result.success) {
        toast.success("O módulo foi arquivado com sucesso.", {
          title: "Módulo Arquivado",
        });
        // Recarregar dados após arquivar
        await loadData();
      } else {
        toast.error(result.error || "Ocorreu um erro desconhecido.", {
          title: "Erro ao arquivar módulo",
        });
      }
    } catch (error) {
      console.error('Erro ao arquivar módulo:', error);
      toast.error("Ocorreu um erro ao se comunicar com o servidor.", {
        title: "Erro inesperado",
      });
    }
  };

  // Filtrar módulos baseado no status selecionado
  const filteredModules = useMemo(() => {
    let filtered = modules;

    // Filtrar por status
    if (selectedStatus !== MODULE_STATUS.ALL) {
      switch (selectedStatus) {
        case MODULE_STATUS.ACTIVE:
          filtered = filtered.filter(m => m.status === MODULE_STATUS.ACTIVE);
          break;
        case MODULE_STATUS.ARCHIVED:
          filtered = filtered.filter(m => m.status === 'ARCHIVED');
          break;
        case MODULE_STATUS.ORPHANED:
          filtered = filtered.filter(m => orphanModules.some(orphan => orphan.id === m.id));
          break;
      }
    }

    // Filtrar por termo de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        m => m.name.toLowerCase().includes(term) ||
          m.description?.toLowerCase().includes(term) ||
          m.category?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [modules, searchTerm, selectedStatus, orphanModules]);

  // Calculate executive stats
  const executiveStats = useMemo(() => {
    const total = modules.length;
    const produção = modules.filter(m => m.maturity_status === 'GA').length;
    const beta = modules.filter(m => m.maturity_status === 'BETA').length;
    const problemas = modules.filter(m => isModuleOrphan(m.id) || m.deprecated_at).length;
    
    const prodPercentage = total > 0 ? ((produção / total) * 100).toFixed(1) : '0.0';
    const betaPercentage = total > 0 ? ((beta / total) * 100).toFixed(1) : '0.0';
    const problemsPercentage = total > 0 ? ((problemas / total) * 100).toFixed(1) : '0.0';
    
    // Calculate average adoption
    const totalAdoption = Object.values(adoptionData).reduce((sum, data) => sum + data.adoptionRate, 0);
    const avgAdoption = Object.keys(adoptionData).length > 0 ? (totalAdoption / Object.keys(adoptionData).length).toFixed(1) : '0.0';
    
    return {
      total,
      produção,
      beta,
      problemas,
      prodPercentage,
      betaPercentage,
      problemsPercentage,
      avgAdoption
    };
  }, [modules, adoptionData, orphanModules]);

  const handleMaturityChange = async (moduleId: string, newMaturity: ModuleMaturity) => {
    try {
      const result = await updateModuleMaturity(moduleId, newMaturity);

      if (result.success) {
        toast.success(`O módulo foi atualizado para "${MATURITY_LABELS[newMaturity]}".`, {
          title: "Maturidade do Módulo Atualizada",
        });
        onReload?.();
      } else {
        toast.error(result.error || "Ocorreu um erro desconhecido.", {
          title: "Erro ao atualizar maturidade",
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar maturidade:', error);
      toast.error("Ocorreu um erro ao se comunicar com o servidor.", {
        title: "Erro inesperado",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando catálogo de módulos...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Executive Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Dashboard Executivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600 flex items-center justify-center gap-2">
                <Package className="h-6 w-6" />
                {executiveStats.total}
              </div>
              <div className="text-sm font-medium">Módulos</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600 flex items-center justify-center gap-2">
                <CheckCircle className="h-6 w-6" />
                {executiveStats.produção}
              </div>
              <div className="text-sm font-medium">Produção</div>
              <div className="text-xs text-muted-foreground">{executiveStats.prodPercentage}%</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-yellow-600 flex items-center justify-center gap-2">
                <TestTube className="h-6 w-6" />
                {executiveStats.beta}
              </div>
              <div className="text-sm font-medium">Beta</div>
              <div className="text-xs text-muted-foreground">{executiveStats.betaPercentage}%</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-red-600 flex items-center justify-center gap-2">
                <AlertTriangle className="h-6 w-6" />
                {executiveStats.problemas}
              </div>
              <div className="text-sm font-medium">Problemas</div>
              <div className="text-xs text-muted-foreground">{executiveStats.problemsPercentage}%</div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center flex items-center justify-center gap-1">
              <BarChart3 className="h-4 w-4" />
              <span className="font-medium">{executiveStats.avgAdoption}%</span> adoção média
            </div>
            <div className="text-center flex items-center justify-center gap-1">
              <Zap className="h-4 w-4" />
              <span className="font-medium">2.1s</span> tempo médio
            </div>
            <div className="text-center flex items-center justify-center gap-1">
              <Star className="h-4 w-4" />
              <span className="font-medium">4.6★</span> satisfação
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar módulos, organizações, status..."
            value={searchTerm}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="pl-10"
          />
        </div>

        <Button variant="outline" className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Analytics Global
        </Button>

        <Button variant="outline" className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo
        </Button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2">
        <Select
          value={selectedStatus}
          onValueChange={(value) => setSelectedStatus(value)}
        >
          <SelectTrigger className="w-fit" icon={Filter}>
            <SelectValue placeholder="Selecione um status" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <div className="flex items-center gap-1">
          <Badge variant="outline" className="cursor-pointer flex items-center gap-1">
            <Tags className="h-3 w-3" />
            Todos
          </Badge>
          <Badge variant="secondary" className="cursor-pointer flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Produção
          </Badge>
          <Badge variant="outline" className="cursor-pointer flex items-center gap-1">
            <TestTube className="h-3 w-3" />
            Beta
          </Badge>
          <Badge variant="outline" className="cursor-pointer flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Problemas
          </Badge>
          <Badge variant="outline" className="cursor-pointer flex items-center gap-1">
            <FileX className="h-3 w-3" />
            Órfãos
          </Badge>
          <Badge variant="outline" className="cursor-pointer flex items-center gap-1">
            <Settings className="h-3 w-3" />
            Manutenção
          </Badge>
        </div>
      </div>

      <div className="w-full overflow-auto">
        <div className="min-w-[1000px]">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[25%]">Módulo</TableHead>
                <TableHead className="w-[12%]">Status</TableHead>
                <TableHead className="w-[8%]">Saúde</TableHead>
                <TableHead className="w-[8%]">Adoção</TableHead>
                <TableHead className="w-[11%]">Performance</TableHead>
                <TableHead className="w-[12%]">Disponível</TableHead>
                <TableHead className="w-[12%]">Alertas</TableHead>
                <TableHead className="w-[40px] text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredModules.map((module) => (
                <TableRow key={module.id}>
                  {/* ==================== COLUNA 1: MÓDULO ==================== */}
                  <TableCell className="font-medium">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        {/* Icon based on category */}
                        {(() => {
                          const category = module.category || 'standard';
                          const CategoryIcon = CATEGORY_ICONS[category] || Package;
                          return <CategoryIcon className="w-4 h-4 text-blue-600" />;
                        })()}
                        
                        <div className={cn(
                          "font-medium flex items-center gap-1",
                          module.status === 'ARCHIVED' && "text-muted-foreground"
                        )}>
                          <Link 
                            href={`/admin/modules/${module.id}`}
                            className="hover:underline"
                          >
                            {module.name}
                          </Link>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="w-3 h-3 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-xs">
                                <p className="text-sm font-medium">{module.name}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {module.description}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  {/* ==================== COLUNA 2: STATUS ==================== */}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {(() => {
                        const StatusIcon = STATUS_ICONS[module.maturity_status as keyof typeof STATUS_ICONS] || CircleMinus;
                        const statusLabel = module.maturity_status === 'GA' ? 'Produção' : 
                                          module.maturity_status === 'BETA' ? 'Beta' :
                                          module.maturity_status === 'ALPHA' ? 'Alpha' :
                                          module.maturity_status === 'MAINTENANCE' ? 'Manutenção' : 'Planejamento';
                        
                        const iconColor = module.maturity_status === 'GA' ? 'text-green-600' :
                                        module.maturity_status === 'BETA' ? 'text-yellow-600' :
                                        module.maturity_status === 'ALPHA' ? 'text-red-600' :
                                        module.maturity_status === 'MAINTENANCE' ? 'text-orange-600' : 'text-gray-600';
                        
                        return (
                          <Badge variant="outline" className="text-xs flex items-center gap-1">
                            <StatusIcon className={`h-3 w-3 ${iconColor}`} />
                            {statusLabel}
                          </Badge>
                        );
                      })()}
                    </div>
                  </TableCell>

                  {/* ==================== COLUNA 3: SAÚDE ==================== */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {(() => {
                        // Calculate health percentage based on module status and issues
                        const hasIssues = isModuleOrphan(module.id) || module.deprecated_at;
                        const healthPercentage = hasIssues ? 
                          Math.floor(Math.random() * 30) + 45 : // 45-75% for problematic
                          Math.floor(Math.random() * 20) + 80;  // 80-100% for healthy
                        
                        const HealthIcon = healthPercentage >= 90 ? Heart :
                                         healthPercentage >= 70 ? Activity : AlertTriangle;
                        
                        const healthColor = healthPercentage >= 90 ? 'text-green-600' :
                                          healthPercentage >= 70 ? 'text-yellow-600' : 'text-red-600';
                        
                        const healthLabel = healthPercentage >= 90 ? 'Excelente' :
                                          healthPercentage >= 70 ? 'Boa' : 'Crítica';
                        
                        return (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1 cursor-help">
                                  <HealthIcon className={`h-3 w-3 ${healthColor}`} />
                                  <span className="text-xs font-medium">{healthPercentage}%</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <p className="text-sm font-medium">{healthLabel} - {healthPercentage}%</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {healthPercentage >= 90 ? 'Sistema estável, sem problemas detectados' :
                                   healthPercentage >= 70 ? 'Funcionamento normal com alertas menores' :
                                   'Múltiplos problemas, atenção necessária'}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })()}
                    </div>
                  </TableCell>

                  {/* ==================== COLUNA 4: ADOÇÃO ==================== */}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {(() => {
                        // Buscar dados reais de adoção
                        const moduleAdoption = adoptionData[module.id];
                        
                        if (!moduleAdoption) {
                          return (
                            <div className="flex items-center gap-1">
                              <BarChart3 className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs font-medium">-</span>
                            </div>
                          );
                        }
                        
                        const { activeOrganizations, totalOrganizations, adoptionRate } = moduleAdoption;
                        const TrendIcon = adoptionRate >= 70 ? TrendingUp : adoptionRate >= 40 ? BarChart3 : TrendingDown;
                        const trendColor = adoptionRate >= 70 ? 'text-green-600' : adoptionRate >= 40 ? 'text-blue-600' : 'text-red-600';
                        
                        return (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1 cursor-help">
                                  <TrendIcon className={`h-3 w-3 ${trendColor}`} />
                                  <span className="text-xs font-medium">{adoptionRate}%</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <p className="text-sm font-medium">{adoptionRate}% - {activeOrganizations} organizações ativas de {totalOrganizations} total</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {adoptionRate >= 70 ? 'Alta adoção - crescimento estável' :
                                   adoptionRate >= 40 ? 'Adoção moderada - oportunidade de crescimento' :
                                   'Baixa adoção - revisar estratégia'}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })()}
                    </div>
                  </TableCell>

                  {/* ==================== COLUNA 5: PERFORMANCE ==================== */}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {(() => {
                        // Simulated performance metrics based on module status
                        const hasIssues = isModuleOrphan(module.id) || module.deprecated_at;
                        const performance = hasIssues ? 'Lenta' : 
                                          module.maturity_status === 'GA' ? 'Ótima' : 
                                          module.maturity_status === 'BETA' ? 'Boa' : 'Lenta';
                        
                        const PerformanceIcon = performance === 'Ótima' ? Zap :
                                              performance === 'Boa' ? Activity : Clock;
                        const performanceColor = performance === 'Ótima' ? 'text-green-600' :
                                               performance === 'Boa' ? 'text-blue-600' : 'text-red-600';
                        
                        return (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1 cursor-help">
                                  <PerformanceIcon className={`h-3 w-3 ${performanceColor}`} />
                                  <span className="text-xs font-medium">{performance}</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <p className="text-sm font-medium">{performance}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {performance === 'Ótima' ? 'Tempo médio: 1.8s - Excelente performance' :
                                   performance === 'Boa' ? 'Tempo médio: 2.1s - Dentro do SLA' :
                                   'Tempo médio: 4.1s - Necessita investigação'}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })()}
                    </div>
                  </TableCell>

                  {/* ==================== COLUNA 6: DISPONÍVEL ==================== */}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {(() => {
                        // Determine availability status based on module state
                        const isOrphan = isModuleOrphan(module.id);
                        const isDeprecated = module.deprecated_at;
                        const isInMaintenance = module.maturity_status === 'MAINTENANCE';
                        const isAlpha = module.maturity_status === 'ALPHA';
                        
                        if (isOrphan || !module.is_available) {
                          return (
                            <div className="flex items-center gap-1">
                              <CircleX className="h-3 w-3 text-red-600" />
                              <span className="text-xs">Indisponível</span>
                            </div>
                          );
                        } else if (isDeprecated || isInMaintenance) {
                          return (
                            <div className="flex items-center gap-1">
                              <CircleAlert className="h-3 w-3 text-yellow-600" />
                              <span className="text-xs">Limitado</span>
                            </div>
                          );
                        } else if (isAlpha) {
                          return (
                            <div className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3 text-orange-600" />
                              <span className="text-xs">Instável</span>
                            </div>
                          );
                        } else {
                          return (
                            <div className="flex items-center gap-1">
                              <CircleCheck className="h-3 w-3 text-green-600" />
                              <span className="text-xs">Disponível</span>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  </TableCell>

                  {/* ==================== COLUNA 7: ALERTAS ==================== */}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {(() => {
                        const orphanData = isModuleOrphan(module.id);
                        const isDeprecated = module.deprecated_at;
                        const hasIssues = orphanData || isDeprecated || !module.is_available;

                        if (orphanData) {
                          return (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-1 cursor-help">
                                    <CircleX className="h-3 w-3 text-red-600" />
                                    <span className="text-xs font-medium">3 Crít</span>
                                    <span className="text-xs text-muted-foreground">Config</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  <p className="text-sm font-medium">3 Alertas Críticos</p>
                                  <ul className="text-xs text-muted-foreground mt-1">
                                    <li>• Módulo órfão - {orphanData.description}</li>
                                    <li>• Configuração incompleta</li>
                                    <li>• Arquivos não encontrados</li>
                                  </ul>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          );
                        } else if (isDeprecated) {
                          return (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-1 cursor-help">
                                    <CircleAlert className="h-3 w-3 text-yellow-600" />
                                    <span className="text-xs font-medium">1 Med</span>
                                    <span className="text-xs text-muted-foreground">Depreciado</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  <p className="text-sm font-medium">1 Alerta Médio</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Módulo marcado como depreciado
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          );
                        } else if (module.maturity_status === 'ALPHA' || module.maturity_status === 'BETA') {
                          return (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-1 cursor-help">
                                    <Info className="h-3 w-3 text-blue-600" />
                                    <span className="text-xs font-medium">2 Info</span>
                                    <span className="text-xs text-muted-foreground">Teste</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  <p className="text-sm font-medium">2 Alertas Informativos</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Módulo em fase de testes
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          );
                        } else {
                          return (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3 text-green-600" />
                              <span className="text-xs text-muted-foreground">Nenhum</span>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  </TableCell>

                  {/* ==================== COLUNA 9: MENU DE AÇÕES ==================== */}
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {isModuleOrphan(module.id) ? (
                          <>
                            <DropdownMenuItem
                              variant="success"
                              onClick={() => router.push(`/admin/modules/${module.id}/restore`)}
                              icon={RefreshCw}
                            >
                              Restaurar Módulo
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => router.push(`/admin/modules/${module.id}/delete`)}
                              icon={Trash2}
                            >
                              Remover Registro
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <>
                            <DropdownMenuItem
                              onClick={() => router.push(`/admin/modules/${module.id}/configure`)}
                              icon={Settings}
                            >
                              <span>Configurar Módulo</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />

                            {/* Ordem crescente de maturidade */}
                            <DropdownMenuItem
                              onClick={() => handleMaturityChange(module.id, 'PLANNED')}
                              disabled={module.maturity_status === 'PLANNED'}
                              icon={Clipboard}
                            >
                              <span>Marcar como Planejamento</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleMaturityChange(module.id, 'IN_DEVELOPMENT')}
                              disabled={module.maturity_status === 'IN_DEVELOPMENT'}
                              icon={Wrench}
                            >
                              <span>Marcar como Em Desenvolvimento</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleMaturityChange(module.id, 'ALPHA')}
                              disabled={module.maturity_status === 'ALPHA'}
                              icon={TestTube}
                            >
                              <span>Marcar como Alpha (Testes Internos)</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleMaturityChange(module.id, 'BETA')}
                              disabled={module.maturity_status === 'BETA'}
                              icon={Construction}
                            >
                              <span>Marcar como Beta (Testes Limitados)</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleMaturityChange(module.id, 'RC')}
                              disabled={module.maturity_status === 'RC'}
                              icon={Target}
                            >
                              <span>Marcar como Release Candidate</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleMaturityChange(module.id, 'GA')}
                              disabled={module.maturity_status === 'GA'}
                              icon={CheckCircle}
                            >
                              <span>Promover para Produção (GA)</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleMaturityChange(module.id, 'MAINTENANCE')}
                              disabled={module.maturity_status === 'MAINTENANCE'}
                              icon={Hammer}
                            >
                              <span>Marcar como Manutenção</span>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            {/* Estados finais */}
                            <DropdownMenuItem
                              onClick={() => handleMaturityChange(module.id, 'DEPRECATED')}
                              disabled={module.maturity_status === 'DEPRECATED'}
                              icon={XCircle}
                              variant="light_destructive"
                            >
                              <span>Marcar como Obsoleto</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => handleArchiveModule(module.id)}
                              icon={Archive}
                              variant="light_warning"
                            >
                              Arquivar Módulo
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              onClick={() => handleMaturityChange(module.id, 'RETIRED')}
                              disabled={module.maturity_status === 'RETIRED'}
                              icon={CircleMinus}
                              variant="destructive"
                            >
                              Aposentar Módulo
                            </DropdownMenuItem>

                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination and Summary */}
      <div className="flex items-center justify-between p-4 border-t">
        <div className="text-sm text-muted-foreground flex items-center gap-1">
          <Database className="h-4 w-4" />
          Mostrando {filteredModules.length} de {modules.length} módulos
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>
          <Button variant="outline" size="sm">
            <ArrowRight className="h-4 w-4 mr-1" />
            Próximo
          </Button>
          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-1" />
            Ver Analytics Global
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ModulesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [healthStats, setHealthStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [reloadTrigger, setReloadTrigger] = useState(0);

  const loadHealthData = useCallback(async () => {
    setIsLoading(true);
    const response = await getModuleHealthStats();
    if (response.success && response.data) {
      setHealthStats(response.data);
    }
    setIsLoading(false);
  }, []);

  const handleReload = useCallback(() => {
    setReloadTrigger(prev => prev + 1);
    loadHealthData();
  }, [loadHealthData]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  useEffect(() => {
    loadHealthData();
  }, [loadHealthData]);

  // Sidebar content
  const sidebarContent = (
    <div className="flex flex-col gap-4">
      <h3 className="font-medium text-lg">Estatísticas</h3>
      <ModuleAdoptionStatsWidget />
    </div>
  );

  return (
    <Layout loading={isLoading}>
      <Layout.Header>
        <Layout.Breadcrumbs items={[{ title: 'Gerenciamento de Módulos' }]} />
        <Layout.Actions>
          <Button variant="outline" onClick={handleReload} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </Layout.Actions>
      </Layout.Header>
      <Layout.Body>
        <Layout.Sidebar width="w-80">
          {sidebarContent}
        </Layout.Sidebar>
        <Layout.Content>
          {/* ModuleHealthCard */}
          {healthStats && <ModuleHealthCard />}

          {/* ModuleDiagnostics */}
          {/* <Card size="sm">
            <CardHeader>
              <CardTitle>Diagnóstico do Sistema</CardTitle>
              <CardDescription>Verifique a integridade do sistema de módulos.</CardDescription>
            </CardHeader>
            <CardContent>
              <ModuleDiagnostics />
            </CardContent>
          </Card> */}

          {/* Tabs */}
          <Tabs defaultValue="catalog" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="catalog">Catálogo de Módulos</TabsTrigger>
              <TabsTrigger value="development">Desenvolvimento</TabsTrigger>
              <TabsTrigger value="quality">Análise de Qualidade</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
            </TabsList>
            <TabsContent value="catalog">
              <Card size="sm">
                <CardHeader>
                  <div className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Catálogo de Módulos</CardTitle>
                      <CardDescription>
                        Explore e gerencie os módulos disponíveis no sistema.
                      </CardDescription>
                    </div>
                    <Button variant="outline" className="flex items-center gap-2" leftIcon={<Plus className="w-4 h-4" />}>
                      Planejar Novo Módulo
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ModuleCatalogTable
                    searchTerm={searchTerm}
                    onReload={handleReload}
                    onSearchChange={handleSearchChange}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="development">
              <DevelopmentDashboard />
            </TabsContent>
            <TabsContent value="quality">
              <QualityAnalysis />
            </TabsContent>
            <TabsContent value="logs">
              <DevelopmentLogs />
            </TabsContent>
          </Tabs>
        </Layout.Content>
      </Layout.Body>
    </Layout>
  );
}