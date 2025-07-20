/**
 * Sanitiza um texto removendo caracteres especiais e scripts
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '') // Remove tags HTML
    .replace(/[<>]/g, '') // Remove < e >
    .replace(/&/g, '&amp;') // Escapa &
    .replace(/"/g, '&quot;') // Escapa aspas duplas
    .replace(/'/g, '&#x27;') // Escapa aspas simples
    .replace(/\//g, '&#x2F;') // Escapa /
    .trim(); // Remove espaços extras
} 