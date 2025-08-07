import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getAllOrganizations, createOrganization, deleteOrganization } from '@/app/actions/admin/organizations';

// Mock das dependências
vi.mock('@/core/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(),
  createSupabaseAdminClient: vi.fn(),
}));

vi.mock('@/app/actions/admin/organizations', async () => {
  const actual = await vi.importActual('@/app/actions/admin/organizations');
  return {
    ...actual,
    verifyMasterAdminAccess: vi.fn(),
  };
});

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Organizations Server Actions', () => {
  const mockSupabaseClient = {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        is: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAllOrganizations', () => {
    it('deve retornar erro se usuário não autorizado', async () => {
      const { verifyMasterAdminAccess } = await import('@/app/actions/admin/organizations');
      vi.mocked(verifyMasterAdminAccess).mockResolvedValue({ authorized: false });

      const result = await getAllOrganizations();

      expect(result).toEqual({ error: 'Acesso negado.' });
    });

    it('deve retornar organizações se usuário autorizado', async () => {
      const { verifyMasterAdminAccess } = await import('@/app/actions/admin/organizations');
      const { createSupabaseServerClient } = await import('@/core/supabase/server');
      
      vi.mocked(verifyMasterAdminAccess).mockResolvedValue({ authorized: true });
      vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabaseClient);
      
      const mockOrganizations = [
        {
          id: '1',
          company_trading_name: 'Test Company',
          company_legal_name: 'Test Company Ltd',
          client_type: 'standard',
        },
      ];

      mockSupabaseClient.from().select().is().order.mockResolvedValue({
        data: mockOrganizations,
        error: null,
      });

      const result = await getAllOrganizations();

      expect(result).toEqual({ data: mockOrganizations });
      expect(verifyMasterAdminAccess).toHaveBeenCalled();
    });

    it('deve tratar erro do banco de dados', async () => {
      const { verifyMasterAdminAccess } = await import('@/app/actions/admin/organizations');
      const { createSupabaseServerClient } = await import('@/core/supabase/server');
      
      vi.mocked(verifyMasterAdminAccess).mockResolvedValue({ authorized: true });
      vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabaseClient);

      mockSupabaseClient.from().select().is().order.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const result = await getAllOrganizations();

      expect(result).toEqual({ error: 'Erro ao carregar dados.' });
    });
  });

  describe('createOrganization', () => {
    const validFormData = {
      company_legal_name: 'Test Company Ltd',
      company_trading_name: 'Test Company',
      slug: 'test-company',
      client_type: 'standard' as const,
    };

    it('deve retornar erro para dados inválidos', async () => {
      const invalidData = {
        company_legal_name: '', // Required field empty
        company_trading_name: 'Test Company',
        slug: 'test-company',
        client_type: 'standard' as const,
      };

      const result = await createOrganization(invalidData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Razão social é obrigatória');
    });

    it('deve retornar erro se usuário não autorizado', async () => {
      const { verifyMasterAdminAccess } = await import('@/app/actions/admin/organizations');
      vi.mocked(verifyMasterAdminAccess).mockResolvedValue({ authorized: false });

      const result = await createOrganization(validFormData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Acesso negado.');
    });

    it('deve criar organização com sucesso', async () => {
      const { verifyMasterAdminAccess } = await import('@/app/actions/admin/organizations');
      const { createSupabaseServerClient } = await import('@/core/supabase/server');
      
      vi.mocked(verifyMasterAdminAccess).mockResolvedValue({ 
        authorized: true, 
        userId: 'admin-user-id' 
      });
      vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabaseClient);

      const mockCreatedOrg = { id: 'new-org-id', ...validFormData };
      mockSupabaseClient.from().insert().select().single.mockResolvedValue({
        data: mockCreatedOrg,
        error: null,
      });

      const result = await createOrganization(validFormData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCreatedOrg);
    });
  });

  describe('deleteOrganization', () => {
    it('deve retornar erro se usuário não autorizado', async () => {
      const { verifyMasterAdminAccess } = await import('@/app/actions/admin/organizations');
      vi.mocked(verifyMasterAdminAccess).mockResolvedValue({ authorized: false });

      const result = await deleteOrganization('org-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Acesso negado.');
    });

    it('deve retornar erro se organização não encontrada', async () => {
      const { verifyMasterAdminAccess } = await import('@/app/actions/admin/organizations');
      const { createSupabaseServerClient } = await import('@/core/supabase/server');
      
      vi.mocked(verifyMasterAdminAccess).mockResolvedValue({ 
        authorized: true, 
        userId: 'admin-user-id' 
      });
      vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabaseClient);

      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      const result = await deleteOrganization('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Organização não encontrada.');
    });
  });
});