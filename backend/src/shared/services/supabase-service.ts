import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../../config/config';
import { logger } from '../../utils/logger';

/**
 * Serviço centralizado para gerenciar conexões com o Supabase
 */
export class SupabaseService {
  private static instance: SupabaseService;
  private client: SupabaseClient;

  private constructor() {
    if (!config.SUPABASE_URL || !config.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
    }

    this.client = createClient(
      config.SUPABASE_URL,
      config.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    logger.info('Supabase client initialized successfully');
  }

  static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  getClient(): SupabaseClient {
    return this.client;
  }

  /**
   * Autentica um usuário usando email e senha
   */
  async authenticateUser(email: string, password: string) {
    try {
      const { data, error } = await this.client.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        logger.warn('Authentication failed:', { email, error: error.message });
        return { success: false, error: error.message };
      }

      if (!data.user) {
        logger.warn('No user data returned from authentication:', { email });
        return { success: false, error: 'Authentication failed' };
      }

      logger.info('User authenticated successfully:', { 
        userId: data.user.id, 
        email: data.user.email 
      });

      return {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          emailVerified: data.user.email_confirmed_at ? true : false,
          lastSignIn: data.user.last_sign_in_at,
          userMetadata: data.user.user_metadata
        },
        session: data.session
      };
    } catch (error) {
      logger.error('Unexpected error during authentication:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Verifica se um usuário existe pelo email
   */
  async getUserByEmail(email: string) {
    try {
      const { data, error } = await this.client.auth.admin.listUsers();

      if (error) {
        logger.warn('Error fetching users:', { error: error.message });
        return { success: false, error: error.message };
      }

      const user = data.users.find((u: any) => u.email === email);
      
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      return {
        success: true,
        user: user
      };
    } catch (error) {
      logger.error('Unexpected error fetching user by email:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Verifica se um token JWT do Supabase é válido
   */
  async verifyToken(token: string) {
    try {
      const { data, error } = await this.client.auth.getUser(token);

      if (error) {
        logger.warn('Token verification failed:', { error: error.message });
        return { success: false, error: error.message };
      }

      return {
        success: true,
        user: data.user
      };
    } catch (error) {
      logger.error('Unexpected error during token verification:', error);
      return { success: false, error: 'Internal server error' };
    }
  }
}

// Exporta uma instância singleton
export const supabaseService = SupabaseService.getInstance();