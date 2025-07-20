import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { BaseError } from './base-error';
export declare class ErrorHandler {
    static register(server: FastifyInstance): void;
    static handleError(error: Error, request: FastifyRequest, reply: FastifyReply): FastifyReply<import("fastify").RouteGenericInterface, import("fastify").RawServerDefault, import("http").IncomingMessage, import("http").ServerResponse<import("http").IncomingMessage>, unknown, import("fastify").FastifySchema, import("fastify").FastifyTypeProviderDefault, unknown>;
    static catchAsync(fn: (request: FastifyRequest, reply: FastifyReply) => Promise<any>): Promise<(request: FastifyRequest, reply: FastifyReply) => Promise<any>>;
    static shouldExposeError(error: Error): boolean;
    static sanitizeError(error: BaseError): BaseError;
}
//# sourceMappingURL=error-handler.d.ts.map