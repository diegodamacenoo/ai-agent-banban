// Re-exporta o middleware principal do core
// Este middleware inclui: rateLimit, sizeLimit, payload validation, security headers, CORS
export { middleware, config } from '@/core/middleware/middleware'; 