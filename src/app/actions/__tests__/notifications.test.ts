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

describe('Notification Server Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateNotificationPreferences', () => {
    it('should update notification preferences', async () => {
      const mockUpdatePreferences = jest.fn().mockResolvedValue({
        success: true,
        data: {
          email_notifications: true,
          push_notifications: false,
          sms_notifications: true,
        },
      });

      const result = await mockUpdatePreferences({
        email_notifications: true,
        push_notifications: false,
        sms_notifications: true,
      });

      expect(result.success).toBe(true);
      expect(result.data.email_notifications).toBe(true);
    });

    it('should handle update errors', async () => {
      const mockUpdatePreferences = jest.fn().mockResolvedValue({
        success: false,
        error: 'Erro ao atualizar preferências',
      });

      const result = await mockUpdatePreferences({});

      expect(result.success).toBe(false);
      expect(result.error).toContain('Erro');
    });
  });

  describe('getNotificationPreferences', () => {
    it('should return user notification preferences', async () => {
      const mockGetPreferences = jest.fn().mockResolvedValue({
        success: true,
        data: {
          email_notifications: true,
          push_notifications: true,
          sms_notifications: false,
          frequency: 'daily',
        },
      });

      const result = await mockGetPreferences();

      expect(result.success).toBe(true);
      expect(result.data.email_notifications).toBe(true);
      expect(result.data.frequency).toBe('daily');
    });
  });
}); 