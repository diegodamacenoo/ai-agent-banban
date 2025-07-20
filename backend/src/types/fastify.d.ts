import { FastifyRequest, FastifyInstance } from 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    startTime?: number;
    user?: {
      id: string;
      email: string;
      emailVerified: boolean;
      lastSignIn: string | null;
      userMetadata?: any;
    };
  }
  
  interface FastifyInstance {
    jwt: {
      sign: (payload: any) => string;
      verify: (token: string) => any;
    };
    authenticate: (request: FastifyRequest, reply: any) => Promise<void>;
  }
} 