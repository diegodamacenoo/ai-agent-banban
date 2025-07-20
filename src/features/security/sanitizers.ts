import DOMPurify from 'dompurify';

// ConfiguraÃ§Ã£o de sanitizaÃ§Ã£o padrÃ£o
const DEFAULT_CONFIG = {
  ALLOWED_TAGS: ['b', 'i', 'u', 'br', 'p', 'span', 'div', 'strong', 'em'],
  ALLOWED_ATTR: ['class', 'style'],
  FORBID_SCRIPTS: true,
  FORBID_TAGS: ['script', 'object', 'embed', 'iframe'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
};

// ConfiguraÃ§Ã£o restritiva para chat/mensagens
const CHAT_CONFIG = {
  ALLOWED_TAGS: ['b', 'i', 'u', 'br', 'span'],
  ALLOWED_ATTR: ['class'],
  FORBID_SCRIPTS: true,
  FORBID_TAGS: ['script', 'object', 'embed', 'iframe', 'img', 'video', 'audio'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'style']
};

// ConfiguraÃ§Ã£o para SVG/Charts (mais permissiva)
const SVG_CONFIG = {
  ALLOWED_TAGS: ['svg', 'path', 'rect', 'circle', 'line', 'text', 'g', 'defs', 'title'],
  ALLOWED_ATTR: ['d', 'x', 'y', 'width', 'height', 'fill', 'stroke', 'viewBox', 'class'],
  FORBID_SCRIPTS: true,
  FORBID_TAGS: ['script', 'object', 'embed', 'iframe'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
};

/**
 * Sanitiza HTML usando DOMPurify com configuraÃ§Ã£o padrÃ£o
 */
export const sanitizeHTML = (dirty: string): string => {
  if (!dirty || typeof dirty !== 'string') return '';
  return DOMPurify.sanitize(dirty, DEFAULT_CONFIG);
};

/**
 * Sanitiza mensagens de chat com configuraÃ§Ã£o restritiva
 */
export const sanitizeChatMessage = (message: string): string => {
  if (!message || typeof message !== 'string') return '';
  return DOMPurify.sanitize(message, CHAT_CONFIG);
};

/**
 * Sanitiza dados de chart/SVG
 */
export const sanitizeChartData = (svgContent: string): string => {
  if (!svgContent || typeof svgContent !== 'string') return '';
  return DOMPurify.sanitize(svgContent, SVG_CONFIG);
};

/**
 * Escape simples de HTML para texto puro
 */
export const escapeHtml = (unsafe: string): string => {
  if (!unsafe || typeof unsafe !== 'string') return '';
  
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Remove completamente todas as tags HTML
 */
export const stripHtml = (html: string): string => {
  if (!html || typeof html !== 'string') return '';
  return html.replace(/<[^>]*>/g, '');
};

/**
 * Valida se o conteÃºdo Ã© seguro (nÃ£o contÃ©m scripts ou tags perigosas)
 */
export const isContentSafe = (content: string): boolean => {
  if (!content || typeof content !== 'string') return true;
  
  const dangerousPatterns = [
    /<script[^>]*>/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe[^>]*>/i,
    /<object[^>]*>/i,
    /<embed[^>]*>/i,
    /eval\s*\(/i,
    /expression\s*\(/i
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(content));
};

/**
 * Sanitiza URL para evitar javascript: e data: maliciosos
 */
export const sanitizeUrl = (url: string): string => {
  if (!url || typeof url !== 'string') return '';
  
  // Remove espaÃ§os e caracteres de controle
  const cleanUrl = url.trim().replace(/[\x00-\x1f\x7f-\x9f]/g, '');
  
  // Bloqueia esquemas perigosos
  const dangerousSchemes = /^(javascript|data|vbscript|file|about):/i;
  if (dangerousSchemes.test(cleanUrl)) {
    return '';
  }
  
  // Permite apenas HTTP, HTTPS, mailto, tel
  const allowedSchemes = /^(https?|mailto|tel):/i;
  if (cleanUrl.includes(':') && !allowedSchemes.test(cleanUrl)) {
    return '';
  }
  
  return cleanUrl;
};

/**
 * Hook React para sanitizaÃ§Ã£o segura
 */
export const useSafeHTML = (content: string, config?: any) => {
  if (typeof window === 'undefined') {
    // Server-side: retorna conteÃºdo escapado
    return escapeHtml(content);
  }
  
  // Client-side: usa DOMPurify
  return DOMPurify.sanitize(content, config || DEFAULT_CONFIG);
};

// ConfiguraÃ§Ãµes exportadas para uso customizado
export const SANITIZE_CONFIGS = {
  DEFAULT: DEFAULT_CONFIG,
  CHAT: CHAT_CONFIG,
  SVG: SVG_CONFIG
} as const; 
