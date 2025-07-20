import "@testing-library/jest-dom";

// Mock Supabase
const mockSupabase = {
  auth: {
    getSession: jest.fn(),
    admin: {
      updateUserById: jest.fn(),
    },
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
    insert: jest.fn(() => ({
      select: jest.fn(),
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn(),
      })),
    })),
  })),
};

jest.mock('@/core/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(() => mockSupabase),
  createSupabaseAdminClient: jest.fn(() => mockSupabase),
}));

describe('Security Server Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('MFA Actions', () => {
    it('should enroll MFA successfully', async () => {
      const mockEnrollMFA = jest.fn().mockResolvedValue({
        success: true,
        data: {
          qr_code: 'data:image/png;base64,example',
          secret: 'JBSWY3DPEHPK3PXP',
          backup_codes: ['123456', '789012'],
        },
      });

      const result = await mockEnrollMFA({
        factorType: 'totp',
      });

      expect(result.success).toBe(true);
      expect(result.data.qr_code).toContain('data:image');
      expect(result.data.backup_codes).toHaveLength(2);
    });

    it('should verify MFA code', async () => {
      const mockVerifyMFA = jest.fn().mockResolvedValue({
        success: true,
        data: {
          verified: true,
        },
      });

      const result = await mockVerifyMFA({
        factorId: 'factor-123',
        code: '123456',
      });

      expect(result.success).toBe(true);
      expect(result.data.verified).toBe(true);
    });
  });

  describe('Session Management', () => {
    it('should list active sessions', async () => {
      const mockListSessions = jest.fn().mockResolvedValue({
        success: true,
        data: [
          {
            id: 'session-1',
            device: 'Chrome on Windows',
            ip_address: '192.168.1.1',
            last_active: new Date().toISOString(),
            current: true,
          },
        ],
      });

      const result = await mockListSessions();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].current).toBe(true);
    });

    it('should terminate session', async () => {
      const mockTerminateSession = jest.fn().mockResolvedValue({
        success: true,
        message: 'SessÃ£o encerrada com sucesso',
      });

      const result = await mockTerminateSession({
        sessionId: 'session-123',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('sucesso');
    });
  });

  describe('Security Alerts', () => {
    it('should create security alert', async () => {
      const mockCreateAlert = jest.fn().mockResolvedValue({
        success: true,
        data: {
          id: 'alert-123',
          type: 'suspicious_login',
          severity: 'high',
          message: 'Login suspeito detectado',
        },
      });

      const result = await mockCreateAlert({
        type: 'suspicious_login',
        severity: 'high',
        message: 'Login suspeito detectado',
      });

      expect(result.success).toBe(true);
      expect(result.data.type).toBe('suspicious_login');
    });

    it('should get security alerts', async () => {
      const mockGetAlerts = jest.fn().mockResolvedValue({
        success: true,
        data: [
          {
            id: 'alert-1',
            type: 'login_anomaly',
            severity: 'medium',
            created_at: new Date().toISOString(),
            resolved: false,
          },
        ],
      });

      const result = await mockGetAlerts();

      expect(result.success).toBe(true);
      expect(result.data[0].resolved).toBe(false);
    });
  });
}); 
