import { useState, useEffect, useCallback } from 'react';

// Tipos para os dados de auditoria
export interface AuditLog {
  id: string;
  usuario: string;
  acao: string;
  data: string;
  ip: string;
  dispositivo: string;
  detalhes?: any;
}

export interface AuditLogFilters {
  dateFrom: string;
  dateTo: string;
  userEmail: string;
  actionType: string;
  ipAddress: string;
}

export interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

const defaultFilters: AuditLogFilters = {
  dateFrom: '',
  dateTo: '',
  userEmail: '',
  actionType: '',
  ipAddress: '',
};

/**
 * Hook personalizado para gerenciar logs de auditoria
 * 
 * Inclui:
 * - Busca automÃ¡tica com debounce
 * - Gerenciamento de filtros
 * - PaginaÃ§Ã£o
 * - Estados de loading e erro
 * - ExportaÃ§Ã£o de dados
 * - Busca textual
 */
export function useAuditLogs() {
  // Estados principais
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de filtros e paginaÃ§Ã£o
  const [filters, setFiltersState] = useState<AuditLogFilters>(defaultFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [shouldFetch, setShouldFetch] = useState(true);
  
  // Estados para exportaÃ§Ã£o
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Busca textual nos detalhes
  const [searchText, setSearchText] = useState('');
  const [debouncedSearchText, setDebouncedSearchText] = useState('');
  
  // Debounce dos filtros para evitar muitas requisiÃ§Ãµes
  const [debouncedFilters, setDebouncedFilters] = useState<AuditLogFilters>(filters);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [filters]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchText]);
  
  // FunÃ§Ã£o para buscar logs
  const fetchLogs = useCallback(async (page: number = 1, filtersToUse: AuditLogFilters = debouncedFilters) => {
    if (!shouldFetch) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(filtersToUse.dateFrom && { dateFrom: filtersToUse.dateFrom }),
        ...(filtersToUse.dateTo && { dateTo: filtersToUse.dateTo }),
        ...(filtersToUse.userEmail && { userEmail: filtersToUse.userEmail }),
        ...(filtersToUse.actionType && { actionType: filtersToUse.actionType }),
        ...(filtersToUse.ipAddress && { ipAddress: filtersToUse.ipAddress }),
      });

      const response = await fetch(`/api/audit-logs?${queryParams}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao buscar logs de auditoria');
      }
      
      const data = await response.json();
      
      setLogs(data.data || []);
      setPagination(data.pagination);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao buscar logs de auditoria:', err);
    } finally {
      setIsLoading(false);
    }
  }, [shouldFetch, debouncedFilters]);
  
  // Efeito para buscar dados quando filtros ou pÃ¡gina mudam
  useEffect(() => {
    fetchLogs(currentPage, debouncedFilters);
  }, [fetchLogs, currentPage, debouncedFilters]);
  
  // FunÃ§Ã£o para atualizar filtros
  const setFilters = useCallback((newFilters: Partial<AuditLogFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset para primeira pÃ¡gina quando filtros mudam
  }, []);
  
  // FunÃ§Ã£o para limpar filtros
  const clearFilters = useCallback(() => {
    setFiltersState(defaultFilters);
    setCurrentPage(1);
    setSearchText(''); // Limpar busca textual tambÃ©m
  }, []);
  
  // FunÃ§Ãµes de paginaÃ§Ã£o
  const nextPage = useCallback(() => {
    if (pagination?.hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  }, [pagination]);
  
  const previousPage = useCallback(() => {
    if (pagination?.hasPreviousPage) {
      setCurrentPage(prev => prev - 1);
    }
  }, [pagination]);
  
  // FunÃ§Ã£o para refresh manual
  const refresh = useCallback(() => {
    setShouldFetch(true);
    fetchLogs(currentPage, filters);
  }, [fetchLogs, currentPage, filters]);
  
  // FunÃ§Ã£o para aplicar filtros manualmente (Ãºtil para botÃ£o "Filtrar")
  const applyFilters = useCallback(() => {
    setCurrentPage(1);
    setShouldFetch(true);
    fetchLogs(1, filters);
  }, [fetchLogs, filters]);

  // FunÃ§Ã£o para exportar logs
  const exportLogs = useCallback(async (format: 'csv' | 'json' = 'csv', limit: number = 1000) => {
    setIsExporting(true);
    setExportError(null);
    
    try {
      const queryParams = new URLSearchParams({
        format,
        limit: limit.toString(),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
        ...(filters.actionType && { actionType: filters.actionType }),
        ...(filters.ipAddress && { ipAddress: filters.ipAddress }),
      });

      const response = await fetch(`/api/audit-logs/export?${queryParams}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao exportar logs');
      }
      
      // Criar download automÃ¡tico
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Extrair nome do arquivo do cabeÃ§alho ou usar padrÃ£o
      const contentDisposition = response.headers.get('Content-Disposition');
      const fileName = contentDisposition?.match(/filename="([^"]+)"/)?.[1] || 
                      `logs-auditoria-${new Date().toISOString().split('T')[0]}.${format}`;
      
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido na exportaÃ§Ã£o';
      setExportError(errorMessage);
      console.error('Erro ao exportar logs:', err);
    } finally {
      setIsExporting(false);
    }
  }, [filters]);

  // Filtrar logs localmente por busca textual
  const filteredLogs = logs.filter(log => {
    if (!debouncedSearchText.trim()) return true;
    
    const searchTerm = debouncedSearchText.toLowerCase();
    return (
      log.acao.toLowerCase().includes(searchTerm) ||
      log.usuario.toLowerCase().includes(searchTerm) ||
      log.ip.toLowerCase().includes(searchTerm) ||
      log.dispositivo.toLowerCase().includes(searchTerm) ||
      JSON.stringify(log.detalhes || {}).toLowerCase().includes(searchTerm)
    );
  });
  
  return {
    // Dados
    logs: filteredLogs,
    pagination,
    
    // Estados
    isLoading,
    error,
    
    // Filtros
    filters,
    setFilters,
    clearFilters,
    
    // Busca textual
    searchText,
    setSearchText,
    
    // PaginaÃ§Ã£o
    currentPage,
    nextPage,
    previousPage,
    
    // AÃ§Ãµes
    refresh,
    applyFilters,
    
    // ExportaÃ§Ã£o
    exportLogs,
    isExporting,
    exportError,
  };
} 
