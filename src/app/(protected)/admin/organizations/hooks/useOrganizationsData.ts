// AIDEV-NOTE: Import order following patterns - External → @/ absolute → relative → types
import { useEffect, useState, useCallback, useRef } from 'react';
import { useToast } from '@/shared/ui/toast';
import { getAllOrganizations, deleteOrganization } from '@/app/actions/admin/organizations';
import { getAllUsers } from '@/app/actions/admin/users';
import { conditionalDebugLogSync } from '@/shared/utils/conditional-debug-sync';
import { DEBOUNCE_DELAY } from '../constants';
import type { Organization, User } from '../types';

/**
 * Hook customizado para gerenciamento de dados de organizações
 * Centraliza toda a lógica de carregamento, cache e manipulação de dados
 */
export const useOrganizationsData = () => {
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [deletingOrganization, setDeletingOrganization] = useState<string | null>(null);
  
  // Data state
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // ==========================================
  // REFS FOR LIFECYCLE MANAGEMENT
  // ==========================================
  
  // Refs para controle de ciclo de vida e prevenção de race conditions
  // NOTA: Usar chave única por instância para evitar conflitos entre abas
  const hookId = useRef(`org-hook-${Math.random().toString(36).substring(2)}`);
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
   * Carrega dados das organizações do servidor
   * Implementa proteções contra race conditions e múltiplas chamadas
   * Utiliza sistema de refs para controle de ciclo de vida
   */
  const loadOrganizations = useCallback(async () => {
    // AIDEV-NOTE: Race condition protection via refs
    if (loadingRef.current) {
      conditionalDebugLogSync('🚫 CLIENT: Carregamento já em progresso, ignorando...', { module: 'useOrganizationsData' });
      return;
    }

    // AIDEV-NOTE: Prevent unnecessary reloads using completion flag
    if (loadCompletedRef.current) {
      conditionalDebugLogSync('🚫 CLIENT: Dados já carregados, ignorando...', { module: 'useOrganizationsData' });
      return;
    }

    // AIDEV-NOTE: Component lifecycle safety check
    if (!mountedRef.current && mountedRef.current !== false) {
      conditionalDebugLogSync('🚫 CLIENT: Component not mounted, skipping loadData', { module: 'useOrganizationsData' });
      return;
    }

    const callId = `LOAD_${Date.now()}_${hookId.current}`;
    conditionalDebugLogSync(`🚀 CLIENT: Starting loadOrganizations ${callId}`, { module: 'useOrganizationsData', callId, hookId: hookId.current });

    // Ativação dos flags de carregamento
    loadingRef.current = true;
    setLoading(true);
    
    try {
      setError(null);
      const result = await getAllOrganizations();

      // Tratamento de erro do servidor
      if (result.error) {
        setError(result.error);
        return;
      }

      // Atualização dos dados em caso de sucesso
      if (result.data) {
        setOrganizations(result.data);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Erro ao carregar organizações:', err);
      setError('Erro inesperado ao carregar organizações');
      setOrganizations([]);
    } finally {
      // Limpeza dos flags independente do resultado
      loadingRef.current = false;
      setLoading(false);
      setIsInitialLoad(false);
      loadCompletedRef.current = true;
      conditionalDebugLogSync(`✅ CLIENT: Completed loadOrganizations ${callId}`, { module: 'useOrganizationsData', callId }); // AIDEV-NOTE: Load completion tracking
    }
  }, []);
  
  /**
   * Carrega dados reais de usuários do servidor
   * Implementa proteções contra race conditions e múltiplas chamadas
   */
  const loadUsers = useCallback(async () => {
    conditionalDebugLogSync('🚀 CLIENT: Starting loadUsers', { module: 'useOrganizationsData' });
    
    try {
      const result = await getAllUsers();

      // Tratamento de erro do servidor
      if (result.error) {
        console.error('Erro ao carregar usuários:', result.error);
        setUsers([]);
        return;
      }

      // Atualização dos dados em caso de sucesso
      if (result.data) {
        // Mapear dados para o formato esperado pelo frontend
        const mappedUsers = result.data.map(user => ({
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          organization_id: user.organization_id,
          organization_name: user.organization_name,
          is_active: user.is_active,
          last_login: user.last_sign_in_at,
          created_at: user.created_at,
          phone: user.phone,
        }));
        
        setUsers(mappedUsers);
        conditionalDebugLogSync(`✅ CLIENT: Loaded ${mappedUsers.length} users`, { module: 'useOrganizationsData', usersCount: mappedUsers.length });
      }
    } catch (err) {
      console.error('Erro inesperado ao carregar usuários:', err);
      setUsers([]);
    }
  }, []);

  /**
   * Manipula exclusão de organização com confirmação e feedback
   * Implementa estado otimístico e tratamento de erros
   */
  const handleDeleteOrganization = useCallback(async (organizationId: string) => {
    try {
      setDeletingOrganization(organizationId);
      const result = await deleteOrganization(organizationId);

      // Tratamento de erro do servidor
      if (result.error) {
        toast.error("Erro ao excluir organização", {
          description: result.error,
        });
        return;
      }

      // Feedback de sucesso
      toast.success("A organização foi excluída com sucesso.", {
        title: "Organização excluída",
      });

      // Recarrega dados após exclusão
      loadOrganizations();
    } catch (err) {
      console.error('Erro ao excluir organização:', err);
      toast.error("Ocorreu um erro ao tentar excluir a organização.", {
        title: "Erro inesperado",
      });
    } finally {
      // Limpa estado de loading independente do resultado
      setDeletingOrganization(null);
    }
  }, [toast, loadOrganizations]);
  
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
      loadOrganizations();
    }, DEBOUNCE_DELAY);
  }, [loadOrganizations]);

  /**
   * Effect de inicialização do componente
   * Carrega dados iniciais e configura cleanup
   */
  useEffect(() => {
    if (loadCalledRef.current) {
      conditionalDebugLogSync('🚫 CLIENT: loadOrganizations já foi chamado, pulando...', { module: 'useOrganizationsData' });
      return;
    }

    loadCalledRef.current = true;
    mountedRef.current = true;

    loadOrganizations();
    loadUsers();

    // Cleanup ao desmontar componente
    return () => {
      mountedRef.current = false;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [loadOrganizations, loadUsers]);

  return {
    // Data
    organizations,
    users,
    error,
    lastUpdated,
    
    // Loading states
    loading,
    isInitialLoad,
    deletingOrganization,
    
    // Actions
    loadOrganizations,
    handleRefresh,
    handleDeleteOrganization,
  };
};