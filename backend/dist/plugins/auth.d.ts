import { FastifyInstance } from 'fastify';
import { ApiKeyPermissionType } from '../shared/schemas/api-keys-schema';
declare module 'fastify' {
    interface FastifyInstance {
        authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
        authenticateUser: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
        authenticateService: (requiredPermission?: ApiKeyPermissionType) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
        authenticateHybrid: (requiredPermission?: ApiKeyPermissionType) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    }
}
declare module '@fastify/jwt' {
    interface FastifyJWT {
        user: {
            id: string;
            email: string;
            emailVerified: boolean;
            lastSignIn: string | null;
            userMetadata?: any;
        };
    }
}
declare module 'fastify' {
    interface FastifyRequest {
        authType?: 'jwt' | 'api_key';
        organizationId?: string;
        apiKeyId?: string;
        permissions?: ApiKeyPermissionType[];
    }
}
declare function authPlugin(fastify: FastifyInstance): Promise<void>;
declare const _default: typeof authPlugin;
export default _default;
//# sourceMappingURL=auth.d.ts.map