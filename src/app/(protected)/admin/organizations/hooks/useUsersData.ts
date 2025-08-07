// AIDEV-NOTE: Import order following patterns - External → @/ absolute → relative → types
import { useEffect, useState, useCallback, useRef } from 'react';
import { useToast } from '@/shared/ui/toast';
import { getAllUsers, getUserStats } from '@/app/actions/admin/users';
import { conditionalDebugLogSync } from '@/shared/utils/conditional-debug-sync';
import { DEBOUNCE_DELAY } from '../constants';
import type { User, UserStats } from '../types';

/**
 * Hook customizado para gerenciamento de dados de usuários
 * Centraliza toda a lógica de carregamento, cache e manipulação de dados
 */
export const useUsersData = () => {
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Data state
  const [users, setUsers] = useState<User[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    total: 0,
    active: 0,
    admins: 0,
    managers: 0,
    regular: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // ==========================================
  // REFS FOR LIFECYCLE MANAGEMENT
  // ==========================================
  
  // Refs para controle de ciclo de vida e prevenção de race conditions
  // NOTA: Usar chave única por instância para evitar conflitos entre abas
  const hookId = useRef(`users-hook-${Math.random().toString(36).substring(2)}`);
  const loadingRef = useRef(false);          // Previne carregamentos simultâneos
  const debounceRef = useRef<NodeJS.Timeout | null>(null); // Controle de debounce
  const mountedRef = useRef(false);          // Status de montagem do componente
  const loadCalledRef = useRef(false);       // Previne múltiplas chamadas iniciais
  const loadCompletedRef = useRef(false);    // Controla se dados já foram carregados
  
  // ==========================================
  // HOOKS
  // ==========================================
  
  const { toast } = useToast();
  
  // ==========================================
  // DATA LOADING LOGIC
  // ==========================================
  
  /**
   * Carrega dados dos usuários do servidor
   * Implementa proteções contra race conditions e múltiplas chamadas
   * Utiliza sistema de refs para controle de ciclo de vida
   */
  const loadUsers = useCallback(async () => {
    // AIDEV-NOTE: Race condition protection via refs
    if (loadingRef.current) {
      conditionalDebugLogSync('🚫 CLIENT: Carregamento já em progresso, ignorando...', { module: 'useUsersData' });
      return;
    }

    // AIDEV-NOTE: Prevent unnecessary reloads using completion flag
    if (loadCompletedRef.current) {
      conditionalDebugLogSync('🚫 CLIENT: Dados já carregados, ignorando...', { module: 'useUsersData' });
      return;
    }

    // AIDEV-NOTE: Component lifecycle safety check
    if (!mountedRef.current && mountedRef.current !== false) {
      conditionalDebugLogSync('🚫 CLIENT: Component not mounted, skipping loadData', { module: 'useUsersData' });
      return;
    }

    const callId = `LOAD_USERS_${Date.now()}_${hookId.current}`;
    conditionalDebugLogSync(`🚀 CLIENT: Starting loadUsers ${callId}`, { module: 'useUsersData', callId, hookId: hookId.current });

    // Ativação dos flags de carregamento
    loadingRef.current = true;
    setLoading(true);
    
    try {
      setError(null);
      
      // Carregar usuários e estatísticas em paralelo
      const [usersResult, statsResult] = await Promise.all([
        getAllUsers(),
        getUserStats()
      ]);

      // Tratamento de erro dos usuários
      if (usersResult.error) {
        setError(usersResult.error);
        return;
      }

      // Tratamento de erro das estatísticas
      if (statsResult.error) {
        console.warn('Erro ao carregar estatísticas:', statsResult.error);
      }

      // Atualização dos dados em caso de sucesso
      if (usersResult.data) {
        // Os dados já vêm mapeados do server action
        const mappedUsers = usersResult.data.map((user: any) => ({
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          organization_id: user.organization_id,
          organization_name: user.organization_name,
          is_active: user.is_active,
          last_login: user.last_sign_in_at,
          created_at: user.created_at,
          profile_picture: null,
          phone: user.phone,
        }));

        setUsers(mappedUsers);
        setLastUpdated(new Date());
      }

      // Atualizar estatísticas se disponíveis
      if (statsResult.data) {
        setUserStats({
          total: statsResult.data.total,
          active: statsResult.data.active,
          admins: statsResult.data.admins,
          managers: statsResult.data.managers || 0,
          regular: statsResult.data.regular || 0,
        });
      }

    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
      setError('Erro inesperado ao carregar usuários');
      setUsers([]);
    } finally {
      // Limpeza dos flags independente do resultado
      loadingRef.current = false;
      setLoading(false);
      setIsInitialLoad(false);
      loadCompletedRef.current = true;
      conditionalDebugLogSync(`✅ CLIENT: Completed loadUsers ${callId}`, { module: 'useUsersData', callId }); // AIDEV-NOTE: Load completion tracking
    }
  }, []);
  
  /**
   * Atualiza dados com debounce para evitar múltiplas chamadas
   * Reseta flags de carregamento para permitir nova busca
   */
  const handleRefresh = useCallback(async () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Reset flags para permitir novo carregamento
    loadCompletedRef.current = false;
    loadCalledRef.current = false;
    // isInitialLoad mantém false durante refresh para UX consistente

    debounceRef.current = setTimeout(() => {
      loadUsers();
    }, DEBOUNCE_DELAY);
  }, [loadUsers]);

  /**
   * Effect de inicialização do componente
   * Carrega dados iniciais e configura cleanup
   */
  useEffect(() => {
    if (loadCalledRef.current) {
      conditionalDebugLogSync('🚫 CLIENT: loadUsers já foi chamado, pulando...', { module: 'useUsersData' });
      return;
    }

    loadCalledRef.current = true;
    mountedRef.current = true;

    loadUsers();

    // Cleanup ao desmontar componente
    return () => {
      mountedRef.current = false;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [loadUsers]);

  return {
    // Data
    users,
    userStats,
    error,
    lastUpdated,
    
    // Loading states
    loading,
    isInitialLoad,
    
    // Actions
    loadUsers,
    handleRefresh,
  };
};