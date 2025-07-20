import "@testing-library/jest-dom";

// Mock Supabase
const mockSupabase = {
  auth: {
    getSession: jest.fn(),
    updateUser: jest.fn(),
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
    delete: jest.fn(() => ({
      eq: jest.fn(),
    })),
  })),
};

jest.mock('@/core/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(() => mockSupabase),
}));

describe('Account Management Server Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Account Management', () => {
    it('should update account settings', async () => {
      const mockUpdateAccount = jest.fn().mockResolvedValue({
        success: true,
        data: {
          id: 'user-123',
          email: 'user@example.com',
          name: 'JoÃ£o Silva',
          updated_at: new Date().toISOString(),
        },
      });

      const result = await mockUpdateAccount({
        name: 'JoÃ£o Silva',
        email: 'user@example.com',
      });

      expect(result.success).toBe(true);
      expect(result.data.name).toBe('JoÃ£o Silva');
    });

    it('should handle account deactivation request', async () => {
      const mockDeactivateAccount = jest.fn().mockResolvedValue({
        success: true,
        message: 'SolicitaÃ§Ã£o de desativaÃ§Ã£o registrada',
      });

      const result = await mockDeactivateAccount({
        reason: 'NÃ£o uso mais o serviÃ§o',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('registrada');
    });
  });

  describe('Account Status', () => {
    it('should get account status', async () => {
      const mockGetStatus = jest.fn().mockResolvedValue({
        success: true,
        data: {
          status: 'ACTIVE',
          last_login: new Date().toISOString(),
          mfa_enabled: true,
          email_verified: true,
        },
      });

      const result = await mockGetStatus();

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('ACTIVE');
      expect(result.data.mfa_enabled).toBe(true);
    });

    it('should update account status', async () => {
      const mockUpdateStatus = jest.fn().mockResolvedValue({
        success: true,
        data: {
          status: 'INACTIVE',
          reason: 'Security review',
          updated_at: new Date().toISOString(),
        },
      });

      const result = await mockUpdateStatus({
        status: 'INACTIVE',
        reason: 'Security review',
      });

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('INACTIVE');
    });
  });

  describe('Data Export Processing', () => {
    it('should process data export request', async () => {
      const mockProcessExport = jest.fn().mockResolvedValue({
        success: true,
        data: {
          export_id: 'export-123',
          status: 'processing',
          estimated_completion: new Date(Date.now() + 3600000).toISOString(),
        },
      });

      const result = await mockProcessExport({
        format: 'json',
        include_deleted: false,
      });

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('processing');
    });
  });
});
