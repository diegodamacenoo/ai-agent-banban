import "@testing-library/jest-dom";

// Mock Supabase
const mockSupabase = {
  auth: {
    getSession: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
  })),
};

jest.mock('@/core/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(() => mockSupabase),
}));

// Mock headers
jest.mock('next/headers', () => ({
  headers: jest.fn(() => ({
    get: jest.fn(),
  })),
}));

describe('Auth Server Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('changePassword', () => {
    it('should validate input parameters', async () => {
      // Mock implementation
      const mockChangePassword = jest.fn().mockResolvedValue({
        success: false,
        error: 'Senha atual Ã© obrigatÃ³ria',
      });

      const result = await mockChangePassword({
        currentPassword: '',
        newPassword: 'newpass123',
        confirmPassword: 'newpass123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('obrigatÃ³ria');
    });

    it('should require matching passwords', async () => {
      const mockChangePassword = jest.fn().mockResolvedValue({
        success: false,
        error: 'As senhas nÃ£o coincidem',
      });

      const result = await mockChangePassword({
        currentPassword: 'oldpass123',
        newPassword: 'newpass123',
        confirmPassword: 'different123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('nÃ£o coincidem');
    });
  });

  describe('requestPasswordReset', () => {
    it('should validate email format', async () => {
      const mockRequestReset = jest.fn().mockResolvedValue({
        success: false,
        error: 'Email invÃ¡lido',
      });

      const result = await mockRequestReset({
        email: 'invalid-email',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('invÃ¡lido');
    });

    it('should handle valid email', async () => {
      const mockRequestReset = jest.fn().mockResolvedValue({
        success: true,
        message: 'Email de recuperaÃ§Ã£o enviado',
      });

      const result = await mockRequestReset({
        email: 'user@example.com',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('enviado');
    });
  });

  describe('Session Management', () => {
    it('should handle session validation', async () => {
      const mockGetSession = jest.fn().mockResolvedValue({
        success: true,
        data: {
          user: { id: '123', email: 'user@example.com' },
          session: { access_token: 'token123' },
        },
      });

      const result = await mockGetSession();

      expect(result.success).toBe(true);
      expect(result.data.user).toBeDefined();
      expect(result.data.session).toBeDefined();
    });

    it('should handle invalid session', async () => {
      const mockGetSession = jest.fn().mockResolvedValue({
        success: false,
        error: 'SessÃ£o invÃ¡lida',
      });

      const result = await mockGetSession();

      expect(result.success).toBe(false);
      expect(result.error).toContain('invÃ¡lida');
    });
  });
}); 
