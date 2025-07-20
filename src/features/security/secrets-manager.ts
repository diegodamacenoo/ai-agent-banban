import { createClient } from '@supabase/supabase-js';
import { createLogger } from '@/shared/utils/logger';
import { DEBUG_MODULES } from '@/shared/utils/debug-config';
import { encrypt, decrypt } from '@/features/security/encryption';

const logger = createLogger(DEBUG_MODULES.SECURITY);

interface Secret {
  id: string;
  name: string;
  value: string;
  created_at: string;
  expires_at?: string;
  metadata?: Record<string, any>;
}

interface SecretMetadata {
  description?: string;
  owner?: string;
  environment?: string;
  rotation_period?: number; // em dias
  last_rotated?: string;
  next_rotation?: string;
}

export class SecretsManager {
  private static instance: SecretsManager;
  private supabase;
  private cache: Map<string, Secret>;
  private cacheTimeout: number = 5 * 60 * 1000; // 5 minutos
  private lastCacheUpdate: number = 0;

  private constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    this.cache = new Map();
  }

  public static getInstance(): SecretsManager {
    if (!SecretsManager.instance) {
      SecretsManager.instance = new SecretsManager();
    }
    return SecretsManager.instance;
  }

  private async refreshCache(): Promise<void> {
    try {
      const { data: secrets, error } = await this.supabase
        .from('secrets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.cache.clear();
      secrets.forEach((secret: Secret) => {
        this.cache.set(secret.name, secret);
      });

      this.lastCacheUpdate = Date.now();
      logger.debug('Cache de secrets atualizado');
    } catch (error) {
      logger.error('Erro ao atualizar cache de secrets:', error);
      throw error;
    }
  }

  private async ensureCacheValid(): Promise<void> {
    const now = Date.now();
    if (now - this.lastCacheUpdate > this.cacheTimeout) {
      await this.refreshCache();
    }
  }

  public async getSecret(name: string): Promise<string | null> {
    try {
      await this.ensureCacheValid();

      const secret = this.cache.get(name);
      if (!secret) {
        logger.warn(`Secret nÃ£o encontrado: ${name}`);
        return null;
      }

      // Verificar expiraÃ§Ã£o
      if (secret.expires_at && new Date(secret.expires_at) < new Date()) {
        logger.warn(`Secret expirado: ${name}`);
        return null;
      }

      // Descriptografar valor
      return decrypt(secret.value);
    } catch (error) {
      logger.error(`Erro ao buscar secret ${name}:`, error);
      throw error;
    }
  }

  public async setSecret(
    name: string,
    value: string,
    metadata?: SecretMetadata
  ): Promise<void> {
    try {
      // Criptografar valor
      const encryptedValue = encrypt(value);

      const { error } = await this.supabase.from('secrets').upsert({
        name,
        value: encryptedValue,
        metadata,
        updated_at: new Date().toISOString()
      });

      if (error) throw error;

      // Atualizar cache
      await this.refreshCache();
      logger.info(`Secret ${name} atualizado com sucesso`);
    } catch (error) {
      logger.error(`Erro ao definir secret ${name}:`, error);
      throw error;
    }
  }

  public async deleteSecret(name: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('secrets')
        .delete()
        .eq('name', name);

      if (error) throw error;

      // Atualizar cache
      this.cache.delete(name);
      logger.info(`Secret ${name} removido com sucesso`);
    } catch (error) {
      logger.error(`Erro ao remover secret ${name}:`, error);
      throw error;
    }
  }

  public async rotateSecret(
    name: string,
    newValue: string,
    metadata?: SecretMetadata
  ): Promise<void> {
    try {
      const now = new Date();
      const rotationMetadata = {
        ...metadata,
        last_rotated: now.toISOString(),
        next_rotation: metadata?.rotation_period
          ? new Date(now.getTime() + metadata.rotation_period * 24 * 60 * 60 * 1000).toISOString()
          : undefined
      };

      await this.setSecret(name, newValue, rotationMetadata);
      logger.info(`Secret ${name} rotacionado com sucesso`);
    } catch (error) {
      logger.error(`Erro ao rotacionar secret ${name}:`, error);
      throw error;
    }
  }

  public async listExpiredSecrets(): Promise<Secret[]> {
    try {
      await this.ensureCacheValid();

      const now = new Date();
      return Array.from(this.cache.values()).filter(
        secret => secret.expires_at && new Date(secret.expires_at) < now
      );
    } catch (error) {
      logger.error('Erro ao listar secrets expirados:', error);
      throw error;
    }
  }

  public async listSecretsNeedingRotation(): Promise<Secret[]> {
    try {
      await this.ensureCacheValid();

      const now = new Date();
      return Array.from(this.cache.values()).filter(secret => {
        const metadata = secret.metadata as SecretMetadata;
        return (
          metadata?.next_rotation &&
          new Date(metadata.next_rotation) < now
        );
      });
    } catch (error) {
      logger.error('Erro ao listar secrets que precisam de rotaÃ§Ã£o:', error);
      throw error;
    }
  }
} 
