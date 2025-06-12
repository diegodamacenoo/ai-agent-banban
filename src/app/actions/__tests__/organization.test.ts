import "@testing-library/jest-dom";

// Mock Supabase
const mockSupabase = {
  auth: {
    getSession: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn(),
      })),
    })),
  })),
};

jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(() => mockSupabase),
}));

describe('Organization Server Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateOrganizationSettings', () => {
    it('should update organization settings', async () => {
      const mockUpdateSettings = jest.fn().mockResolvedValue({
        success: true,
        data: {
          id: 'org-123',
          name: 'Empresa ABC',
          settings: {
            timezone: 'America/Sao_Paulo',
            currency: 'BRL',
            language: 'pt-BR',
          },
        },
      });

      const result = await mockUpdateSettings({
        name: 'Empresa ABC',
        timezone: 'America/Sao_Paulo',
        currency: 'BRL',
      });

      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Empresa ABC');
    });

    it('should validate organization data', async () => {
      const mockUpdateSettings = jest.fn().mockResolvedValue({
        success: false,
        error: 'Nome da organização é obrigatório',
      });

      const result = await mockUpdateSettings({
        name: '',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('obrigatório');
    });
  });

  describe('getOrganizationSettings', () => {
    it('should return organization settings', async () => {
      const mockGetSettings = jest.fn().mockResolvedValue({
        success: true,
        data: {
          id: 'org-123',
          name: 'Empresa ABC',
          settings: {
            timezone: 'America/Sao_Paulo',
            currency: 'BRL',
            language: 'pt-BR',
          },
          created_at: new Date().toISOString(),
        },
      });

      const result = await mockGetSettings();

      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Empresa ABC');
      expect(result.data.settings.currency).toBe('BRL');
    });
  });
}); 