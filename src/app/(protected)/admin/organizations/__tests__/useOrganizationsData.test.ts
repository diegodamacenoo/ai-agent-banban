import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useOrganizationsData } from '../hooks/useOrganizationsData';

// Mock das dependências
vi.mock('@/shared/ui/toast', () => ({
  useToast: () => ({
    toast: {
      success: vi.fn(),
      error: vi.fn(),
    },
  }),
}));

vi.mock('@/app/actions/admin/organizations', () => ({
  getAllOrganizations: vi.fn(),
  deleteOrganization: vi.fn(),
}));

vi.mock('@/app/actions/admin/users', () => ({
  getAllUsers: vi.fn(),
}));

describe('useOrganizationsData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve inicializar com estado inicial correto', () => {
    const { result } = renderHook(() => useOrganizationsData());

    expect(result.current.organizations).toEqual([]);
    expect(result.current.users).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.isInitialLoad).toBe(true);
    expect(result.current.error).toBe(null);
  });

  it('deve carregar organizações com sucesso', async () => {
    const { getAllOrganizations } = await import('@/app/actions/admin/organizations');
    const { getAllUsers } = await import('@/app/actions/admin/users');
    
    const mockOrganizations = [
      {
        id: '1',
        company_trading_name: 'Test Company',
        company_legal_name: 'Test Company Ltd',
        client_type: 'standard',
        is_implementation_complete: true,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
    ];

    const mockUsers = [
      {
        id: '1',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'admin',
        organization_id: '1',
        organization_name: 'Test Company',
        is_active: true,
        last_sign_in_at: '2024-01-01',
        created_at: '2024-01-01',
      },
    ];

    vi.mocked(getAllOrganizations).mockResolvedValue({ data: mockOrganizations });
    vi.mocked(getAllUsers).mockResolvedValue({ data: mockUsers });

    const { result } = renderHook(() => useOrganizationsData());

    // Wait for initial load to complete
    await waitFor(() => {
      expect(result.current.isInitialLoad).toBe(false);
    });

    expect(result.current.organizations).toEqual(mockOrganizations);
    expect(result.current.users).toHaveLength(1);
    expect(result.current.error).toBe(null);
  });

  it('deve tratar erro ao carregar organizações', async () => {
    const { getAllOrganizations } = await import('@/app/actions/admin/organizations');
    const { getAllUsers } = await import('@/app/actions/admin/users');
    
    vi.mocked(getAllOrganizations).mockResolvedValue({ error: 'Erro do servidor' });
    vi.mocked(getAllUsers).mockResolvedValue({ data: [] });

    const { result } = renderHook(() => useOrganizationsData());

    await waitFor(() => {
      expect(result.current.isInitialLoad).toBe(false);
    });

    expect(result.current.error).toBe('Erro do servidor');
    expect(result.current.organizations).toEqual([]);
  });

  it('deve executar refresh corretamente', async () => {
    const { getAllOrganizations } = await import('@/app/actions/admin/organizations');
    const { getAllUsers } = await import('@/app/actions/admin/users');
    
    vi.mocked(getAllOrganizations).mockResolvedValue({ data: [] });
    vi.mocked(getAllUsers).mockResolvedValue({ data: [] });

    const { result } = renderHook(() => useOrganizationsData());

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.isInitialLoad).toBe(false);
    });

    // Clear mock calls from initial load
    vi.clearAllMocks();

    // Execute refresh
    await result.current.handleRefresh();

    // Wait for refresh to complete
    await waitFor(() => {
      expect(getAllOrganizations).toHaveBeenCalled();
    });

    expect(getAllOrganizations).toHaveBeenCalledTimes(1);
  });

  it('deve executar delete organization corretamente', async () => {
    const { deleteOrganization } = await import('@/app/actions/admin/organizations');
    const { getAllOrganizations } = await import('@/app/actions/admin/organizations');
    const { getAllUsers } = await import('@/app/actions/admin/users');
    
    vi.mocked(deleteOrganization).mockResolvedValue({ success: true });
    vi.mocked(getAllOrganizations).mockResolvedValue({ data: [] });
    vi.mocked(getAllUsers).mockResolvedValue({ data: [] });

    const { result } = renderHook(() => useOrganizationsData());

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.isInitialLoad).toBe(false);
    });

    // Execute delete
    await result.current.handleDeleteOrganization('org-id');

    expect(deleteOrganization).toHaveBeenCalledWith('org-id');
    expect(result.current.deletingOrganization).toBe(null);
  });

  it('deve tratar erro ao deletar organização', async () => {
    const { deleteOrganization } = await import('@/app/actions/admin/organizations');
    const { getAllOrganizations } = await import('@/app/actions/admin/organizations');
    const { getAllUsers } = await import('@/app/actions/admin/users');
    
    vi.mocked(deleteOrganization).mockResolvedValue({ 
      success: false, 
      error: 'Erro ao deletar' 
    });
    vi.mocked(getAllOrganizations).mockResolvedValue({ data: [] });
    vi.mocked(getAllUsers).mockResolvedValue({ data: [] });

    const { result } = renderHook(() => useOrganizationsData());

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.isInitialLoad).toBe(false);
    });

    // Execute delete
    await result.current.handleDeleteOrganization('org-id');

    expect(deleteOrganization).toHaveBeenCalledWith('org-id');
    expect(result.current.deletingOrganization).toBe(null);
  });
});