import { FastifyInstance as BaseFastifyInstance } from 'fastify';

declare module 'fastify' {
  export interface FastifyInstance extends BaseFastifyInstance {
    // Adicione extensões personalizadas aqui se necessário
  }

  export interface FastifyRequest {
    user?: {
      id: string;
      email: string | undefined;
      role: string;
      permissions: string[];
    };
    server: FastifyInstance;
  }
} 