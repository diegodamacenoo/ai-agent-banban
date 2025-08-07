'use client';

// ============================================================================
// IMPORTS
// ============================================================================

// React Core
import React, { useEffect, useState, useCallback, useTransition } from 'react';

// UI Components - Layout & Structure
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { AnalyticsGrid } from '@/shared/components/Layout';

// UI Components - Interactive Elements
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip';

// UI Components - Data Display
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';

// UI Components - Dialogs & Modals (Removed - now using modular dialog components)

// UI Components - Dropdown Menus
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';

// Icons from Lucide React
import {
  Activity,        // Analytics
  Monitor,         // Desktop devices
  RefreshCw,       // Refresh actions
  Shield,          // Security/Deep cleanup
  Smartphone,      // Mobile devices
  Users,           // User groups
  UserX,           // User termination
  Clock,           // Quick cleanup/Time
  Globe,           // Location/Geography
  Wifi,            // Active sessions
  WifiOff,         // Inactive sessions
  Settings,        // System maintenance
  Trash2,          // Cleanup actions
  MoreVertical     // Dropdown indicators
} from 'lucide-react';

// External Libraries
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Custom Hooks
import { useToast } from '@/shared/ui/toast';
import { useUser } from '@/app/contexts/UserContext';

// Server Actions
import {
  getOrganizationSessionStats,
  getOrganizationActiveSessions,
  terminateSession,
  terminateAllUserSessions,
  runSessionCleanup,
  cleanupExpiredSessions,
  runScheduledMaintenance,
  detectSuspiciousSessions
} from '../sessions-actions';

// Dialog Components
import { QuickCleanupDialog } from './dialogs/quick-cleanup-dialog';
import { DeepCleanupDialog } from './dialogs/deep-cleanup-dialog';
import { MaintenanceDialog } from './dialogs/maintenance-dialog';
import { TerminateSessionDialog } from './dialogs/terminate-session-dialog';
import { TerminateAllSessionsDialog } from './dialogs/terminate-all-sessions-dialog';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

// Component Props
interface SessionsManagementContentProps {
  onRefreshTrigger?: (triggerFn: () => void) => void;
}

// Session Data from Database
interface SessionData {
  session_id: string;
  user_id: string;
  full_name: string;
  user_role: string;
  created_at: string;
  last_activity: string;
  device_info: any;
  geo_location: any;
  session_type: string;
  is_active: boolean;
  ip: string;
  expires_at: string;
}

// Analytics Metrics
interface SessionStats {
  metric_name: string;
  metric_value: number;
  metric_trend: 'up' | 'down' | 'stable';
  metric_details: any;
}

// Security Monitoring
interface SecurityAlert {
  session_id: string;
  risk_level: 'low' | 'medium' | 'high';
  suspicion_reasons: string[];
  user_email: string;
}

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

/**
 * Loading skeleton displayed while session data is being fetched
 */
function SessionsLoadingSkeleton() {
  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between py-2">
          <div>
            <h3 className="text-lg font-medium">Gestão de Sessões</h3>
            <p className="text-sm text-muted-foreground">
              Monitore e gerencie sessões ativas dos usuários da organização
            </p>
          </div>
        </div>
        {[...Array(2)].map((_, y) => (
          <Card size="sm" variant="rounded" key={y}>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

/**
 * Individual session row component for the sessions table
 * Handles session termination actions and displays session details
 */
function SessionRow({
  session,
  onTerminate,
  onTerminateAll,
  currentUserId
}: {
  session: SessionData;
  onTerminate: (id: string) => void;
  onTerminateAll: (userId: string) => void;
  currentUserId?: string;
}) {
  // ============================================================================
  // HELPER FUNCTIONS - Session Data Formatting
  // ============================================================================

  /**
   * Returns appropriate icon based on session type
   */
  const getDeviceIcon = () => {
    if (session.session_type === 'mobile') return <Smartphone className="h-4 w-4" />;
    if (session.session_type === 'web') return <Monitor className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  /**
   * Formats timestamp into human-readable relative time
   */
  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    return `${diffDays}d atrás`;
  };

  /**
   * Formats geographic location from session data
   */
  const getLocationString = () => {
    // Se é localhost, retornar indicação específica
    if (session.ip === '::1' || session.ip === '127.0.0.1') {
      return 'Desenvolvimento local';
    }

    if (!session.geo_location) return 'Local desconhecido';
    const parts = [];
    if (session.geo_location.city) parts.push(session.geo_location.city);
    if (session.geo_location.region) parts.push(session.geo_location.region);
    if (session.geo_location.country) parts.push(session.geo_location.country);
    return parts.length > 0 ? parts.join(', ') : 'Local desconhecido';
  };

  /**
   * Formats IP address for display (handles localhost and IPv6)
   */
  const formatIpAddress = (ip: string) => {
    if (!ip) return 'IP desconhecido';

    // Normalizar endereços localhost
    if (ip === '::1' || ip === '127.0.0.1') {
      return 'Localhost';
    }

    // Se for IPv6, mostrar versão mais amigável
    if (ip.includes(':') && ip !== '::1') {
      return `${ip.substring(0, 20)}...`; // Truncar IPv6 muito longos
    }

    return ip;
  };

  /**
   * Formats device information (browser and OS)
   */
  const getDeviceString = () => {
    if (!session.device_info) return 'Dispositivo desconhecido';
    const parts = [];
    if (session.device_info.browser) parts.push(session.device_info.browser);
    if (session.device_info.os) parts.push(session.device_info.os);
    return parts.length > 0 ? parts.join(' - ') : 'Dispositivo desconhecido';
  };

  /**
   * Converts database role codes to user-friendly names
   */
  const formatUserRole = (role: string) => {
    const roleMap: Record<string, string> = {
      'master_admin': 'Administrador Master',
      'admin': 'Administrador',
      'user': 'Usuário',
      'viewer': 'Visualizador',
      'reader': 'Leitor',
      'moderator': 'Moderador',
      'editor': 'Editor'
    };

    return roleMap[role] || role;
  };


  // Check if this session belongs to the current user (prevents self-termination)
  const isOwnSession = session.user_id === currentUserId;

  // ============================================================================
  // RENDER - Session Table Row
  // ============================================================================

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          {getDeviceIcon()}
          <div>
            <div className="font-medium flex items-center gap-2">
              {session.full_name || 'Usuário sem nome'}
              {isOwnSession && (
                <Badge variant="secondary" className="text-xs">
                  Você
                </Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground">{formatUserRole(session.user_role)}</div>
          </div>
        </div>
      </TableCell>
      <TableCell>{getDeviceString()}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Globe className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{getLocationString()}</span>
        </div>
      </TableCell>
      <TableCell>{formatIpAddress(session.ip)}</TableCell>
      <TableCell>
        <div className="text-sm">
          <div>{formatTimeAgo(session.last_activity)}</div>
          <div className="text-xs text-muted-foreground">
            {format(new Date(session.last_activity), "dd/MM HH:mm", { locale: ptBR })}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {session.is_active ? (
            <>
              <Wifi className="h-3 w-3 text-green-500" />
              <Badge variant="default">Ativa</Badge>
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3 text-gray-400" />
              <Badge variant="secondary">Inativa</Badge>
            </>
          )}
        </div>
      </TableCell>
      <TableCell>
        {/* Session Actions: Terminate Individual & All Sessions */}
        <div className="flex items-center gap-2">
          {/* Terminate Single Session Dialog */}
          <Tooltip>
            <TerminateSessionDialog
              onConfirm={() => onTerminate(session.session_id)}
              userName={session.full_name}
            >
              <TooltipTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isOwnSession}
                >
                  Encerrar
                </Button>
              </TooltipTrigger>
            </TerminateSessionDialog>
            <TooltipContent>
              <p>{isOwnSession ? "Você não pode encerrar sua própria sessão" : "Encerrar esta sessão"}</p>
            </TooltipContent>
          </Tooltip>

          {/* Terminate All User Sessions Dialog */}
          <Tooltip>
            <TerminateAllSessionsDialog
              onConfirm={() => onTerminateAll(session.user_id)}
              userName={session.full_name}
            >
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isOwnSession}
                >
                  <UserX className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
            </TerminateAllSessionsDialog>
            <TooltipContent>
              <p>{isOwnSession ? "Você não pode encerrar suas próprias sessões" : "Encerrar todas as sessões deste usuário"}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TableCell>
    </TableRow>
  );
}

// ============================================================================
// UTILITY FUNCTIONS - Security Alerts
// ============================================================================

/**
 * Maps technical security alert codes to user-friendly messages
 */
const formatSuspicionReason = (reason: string) => {
  const reasonMap: Record<string, string> = {
    'unusual_hours': 'Horário incomum',
    'multiple_locations': 'Múltiplas localizações',
    'suspicious_ip': 'IP suspeito',
    'rapid_location_change': 'Mudança rápida de localização',
    'unknown_device': 'Dispositivo desconhecido',
    'failed_attempts': 'Tentativas de login falharam',
    'unusual_user_agent': 'Navegador/dispositivo incomum',
    'concurrent_sessions': 'Múltiplas sessões simultâneas',
    'tor_proxy': 'Uso de Tor/Proxy',
    'vpn_detected': 'VPN detectada',
    'high_frequency_requests': 'Muitas requisições',
    'unusual_patterns': 'Padrões incomuns',
    'geolocation_mismatch': 'Localização inconsistente',
    'session_hijacking': 'Possível sequestro de sessão'
  };

  return reasonMap[reason] || reason;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Main Sessions Management Component
 * 
 * Features:
 * - Real-time session monitoring
 * - Individual and bulk session termination
 * - Quick and deep cleanup operations
 * - Security alerts for suspicious activities
 * - Analytics dashboard with session metrics
 * 
 * @param onRefreshTrigger - Optional callback to register refresh function
 */
export default function SessionsManagementContent({ onRefreshTrigger }: SessionsManagementContentProps = {}) {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // Flag para executar loadSessionData apenas uma vez
  const hasLoadedData = React.useRef(false);
  // Flag para controlar se deve mostrar skeleton apenas no primeiro carregamento
  // Usando sessionStorage para persistir o estado mesmo após remontagem do componente
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('sessions-management-loaded') === 'true';
    }
    return false;
  });

  // Core session data
  const [sessions, setSessions] = useState<SessionData[]>(() => {
    // Inicializar com dados do sessionStorage se disponível
    if (typeof window !== 'undefined') {
      const cachedSessions = sessionStorage.getItem('sessions-management-sessions');
      return cachedSessions ? JSON.parse(cachedSessions) : [];
    }
    return [];
  });
  const [stats, setStats] = useState<SessionStats[]>(() => {
    if (typeof window !== 'undefined') {
      const cachedStats = sessionStorage.getItem('sessions-management-stats');
      return cachedStats ? JSON.parse(cachedStats) : [];
    }
    return [];
  });
  const [alerts, setAlerts] = useState<SecurityAlert[]>(() => {
    if (typeof window !== 'undefined') {
      const cachedAlerts = sessionStorage.getItem('sessions-management-alerts');
      return cachedAlerts ? JSON.parse(cachedAlerts) : [];
    }
    return [];
  });

  // UI states - se já temos dados em cache, não mostrar loading
  const [loading, setLoading] = useState(() => {
    if (typeof window !== 'undefined') {
      const hasCachedData = sessionStorage.getItem('sessions-management-loaded') === 'true';
      return !hasCachedData;
    }
    return true;
  });
  const [isPending, startTransition] = useTransition();

  // ============================================================================
  // HOOKS
  // ============================================================================

  const { toast } = useToast();
  const { user } = useUser();

  // ============================================================================
  // DATA LOADING & MANAGEMENT
  // ============================================================================

  /**
   * Loads session data, statistics, and security alerts from the server
   */
  const loadSessionData = useCallback(async (forceRefresh = false) => {
    // Prevenir execução múltipla apenas no carregamento inicial
    if (hasLoadedData.current && !forceRefresh) {
      return;
    }

    if (!hasLoadedData.current) {
      hasLoadedData.current = true;
    }

    try {
      // Apenas mostrar loading/skeleton se nunca carregou antes
      if (!hasInitiallyLoaded) {
        setLoading(true);
      }

      const [sessionsResult, statsResult, alertsResult] = await Promise.all([
        getOrganizationActiveSessions(),
        getOrganizationSessionStats(),
        detectSuspiciousSessions()
      ]);

      if (sessionsResult.success && sessionsResult.data) {
        setSessions(sessionsResult.data);
        // Cache no sessionStorage
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('sessions-management-sessions', JSON.stringify(sessionsResult.data));
        }
      } else if (sessionsResult.error) {
        console.error('Erro ao carregar sessões:', sessionsResult.error);
      }

      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('sessions-management-stats', JSON.stringify(statsResult.data));
        }
      }

      if (alertsResult.success && alertsResult.data) {
        setAlerts(alertsResult.data);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('sessions-management-alerts', JSON.stringify(alertsResult.data));
        }
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      // Marcar como carregado inicialmente e remover loading
      if (!hasInitiallyLoaded) {
        setHasInitiallyLoaded(true);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('sessions-management-loaded', 'true');
        }
        setLoading(false);
      }
    }
  }, [hasInitiallyLoaded]);

  // ============================================================================
  // EVENT HANDLERS - Data Operations
  // ============================================================================

  /**
   * Handles manual refresh of session data
   */
  const handleRefresh = useCallback(() => {
    startTransition(async () => {
      await loadSessionData(true); // Force refresh
      toast.success("Dados atualizados", {
        description: "Informações das sessões foram atualizadas com sucesso"
      });
    });
  }, [loadSessionData, toast]);

  // ============================================================================
  // EVENT HANDLERS - Session Termination
  // ============================================================================

  /**
   * Terminates a single session
   */
  const handleTerminateSession = useCallback(async (sessionId: string) => {
    startTransition(async () => {
      const result = await terminateSession(sessionId);

      if (result.success) {
        toast.success("Sessão encerrada", {
          description: result.message
        });
        await loadSessionData(true);
      } else {
        // Sintaxe correta: title no primeiro parâmetro, description nas options
        toast.error("Erro ao encerrar sessão", {
          description: result.error
        });
      }
    });
  }, [loadSessionData, toast]);

  /**
   * Terminates all sessions for a specific user
   */
  const handleTerminateAllSessions = useCallback(async (userId: string) => {
    startTransition(async () => {
      const result = await terminateAllUserSessions(userId);

      if (result.success) {
        toast.success("Sessões encerradas", {
          description: `${result.count || 0} sessões foram encerradas com sucesso`
        });
        await loadSessionData(true);
      } else {
        toast.error("Erro ao encerrar sessões", {
          description: result.error || 'Ocorreu um erro inesperado.'
        });
      }
    });
  }, [loadSessionData, toast]);

  // ============================================================================
  // EVENT HANDLERS - System Cleanup Operations
  // ============================================================================

  /**
   * Performs deep cleanup of old and inactive sessions
   */
  const handleCleanup = useCallback(async () => {
    startTransition(async () => {
      const result = await runSessionCleanup();

      if (result.success) {
        toast.success("Limpeza concluída", {
          description: result.message
        });
        await loadSessionData(true);
      } else {
        toast.error("Erro na limpeza", {
          description: result.error || 'Ocorreu um erro inesperado.'
        });
      }
    });
  }, [loadSessionData, toast]);

  /**
   * Performs quick cleanup of expired sessions only
   */
  const handleQuickCleanup = useCallback(async () => {
    startTransition(async () => {
      const result = await cleanupExpiredSessions();

      if (result.success) {
        toast.success("Limpeza rápida concluída", {
          description: result.message
        });
        await loadSessionData(true);
      } else {
        toast.error("Erro na limpeza rápida", {
          description: result.error || 'Ocorreu um erro inesperado.'
        });
      }
    });
  }, [loadSessionData, toast]);

  /**
   * Runs comprehensive system maintenance (master admin only)
   */
  const handleMaintenance = useCallback(async () => {
    startTransition(async () => {
      const result = await runScheduledMaintenance();

      if (result.success) {
        toast.success("Manutenção concluída", {
          description: result.message
        });
        await loadSessionData(true);
      } else {
        toast.error("Erro na manutenção", {
          description: result.error || 'Ocorreu um erro inesperado.'
        });
      }
    });
  }, [loadSessionData, toast]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Load data on component mount
  useEffect(() => {
    loadSessionData();
  }, [loadSessionData]);

  // Register external refresh trigger (from parent component)
  useEffect(() => {
    if (onRefreshTrigger) {
      onRefreshTrigger(() => handleRefresh());
    }
  }, [onRefreshTrigger, handleRefresh]);

  // Limpar cache quando o componente for desmontado (usuário sai da página)
  useEffect(() => {
    const clearCacheOnUnload = () => {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('sessions-management-loaded');
        sessionStorage.removeItem('sessions-management-sessions');
        sessionStorage.removeItem('sessions-management-stats');
        sessionStorage.removeItem('sessions-management-alerts');
      }
    };

    // Limpar cache quando o usuário sair da página/aplicação
    window.addEventListener('beforeunload', clearCacheOnUnload);
    
    return () => {
      window.removeEventListener('beforeunload', clearCacheOnUnload);
    };
  }, []);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  // Transform stats data for analytics grid display
  const analyticsData = stats.map(stat => ({
    title: stat.metric_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: stat.metric_value.toString(),
    icon: Activity,
    trend: stat.metric_trend === 'up' ? 'positive' as const :
      stat.metric_trend === 'down' ? 'negative' as const :
        'neutral' as const,
    trendValue: stat.metric_details?.percentage_change || '0%'
  }));

  // ============================================================================
  // RENDER
  // ============================================================================

  // Show loading skeleton only on initial load
  if (loading && !hasInitiallyLoaded) {
    return <SessionsLoadingSkeleton />;
  }

  return (
    <TooltipProvider>
      <div className="space-y-2">
        {/* ================================================================ */}
        {/* PAGE HEADER - Title and Global Actions */}
        {/* ================================================================ */}
        <div className="flex items-center justify-between py-2">
          <div>
            <h3 className="text-lg font-medium">Gestão de Sessões</h3>
            <p className="text-sm text-muted-foreground">
              Monitore e gerencie sessões ativas dos usuários da organização
            </p>
          </div>
          <div className="flex gap-2">
            {/* Manutenção Programada - apenas para master_admin */}
            {user?.role === 'master_admin' && (
              <MaintenanceDialog onConfirm={handleMaintenance} disabled={isPending}>
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Manutenção
                </Button>
              </MaintenanceDialog>
            )}
          </div>
        </div>

        {/* ================================================================ */}
        {/* ANALYTICS DASHBOARD - Session Metrics */}
        {/* ================================================================ */}
        {/* <AnalyticsGrid data={analyticsData} /> */}

        {/* ================================================================ */}
        {/* SECURITY ALERTS - Suspicious Session Activities */}
        {/* ================================================================ */}

        <Card size="sm" variant='rounded'>
          <CardHeader>
            <CardTitle>
              Alertas de Segurança
              <CardDescription>
                Sessões com atividade suspeita detectada
              </CardDescription>
            </CardTitle>

          </CardHeader>

          <CardContent>
            {alerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.session_id}
                    className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800"
                  >
                    <Badge
                      variant={
                        alert.risk_level === 'high' ? 'destructive' :
                          alert.risk_level === 'medium' ? 'default' :
                            'secondary'
                      }
                    >
                      {alert.risk_level === 'high' ? 'Alto' :
                        alert.risk_level === 'medium' ? 'Médio' :
                          'Baixo'} Risco
                    </Badge>
                    <div className="flex-1">
                      <p className="font-medium">{alert.user_email}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Motivos: {alert.suspicion_reasons.map(reason => formatSuspicionReason(reason)).join(', ')}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const session = sessions.find(s => s.session_id === alert.session_id);
                        if (session) handleTerminateSession(session.session_id);
                      }}
                    >
                      Encerrar Sessão
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <p>Nenhum alerta de segurança encontrado</p>
              </div>
            )}
          </CardContent>
        </Card>


        {/* ================================================================ */}
        {/* SESSIONS TABLE - Active Session Management */}
        {/* ================================================================ */}
        <Card size="sm" variant="rounded">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Sessões Ativas</CardTitle>
                <CardDescription>
                  Total de {sessions.length} sessões ativas na organização
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {/* Individual Refresh Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isPending}
                >
                  <RefreshCw className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
                </Button>

                {/* Cleanup Actions Dropdown Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4" />
                      <MoreVertical className="h-3 w-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {/* Quick Cleanup - Expired Sessions Only */}
                    <QuickCleanupDialog onConfirm={handleQuickCleanup} disabled={isPending}>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} icon={Clock}>
                        Limpeza Rápida
                      </DropdownMenuItem>
                    </QuickCleanupDialog>

                    {/* Menu Separator */}
                    <DropdownMenuSeparator />

                    {/* Deep Cleanup - Comprehensive Session Cleanup */}
                    <DeepCleanupDialog onConfirm={handleCleanup} disabled={isPending}>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} icon={Shield} variant="destructive">
                        Limpeza Completa
                      </DropdownMenuItem>
                    </DeepCleanupDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Nenhuma sessão ativa encontrada</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Dispositivo</TableHead>
                    <TableHead>Localização</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Última Atividade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <SessionRow
                      key={session.session_id}
                      session={session}
                      onTerminate={handleTerminateSession}
                      onTerminateAll={handleTerminateAllSessions}
                      currentUserId={user?.id}
                    />
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}