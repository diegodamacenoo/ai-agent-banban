import xss from 'xss';

/**
 * Sanitiza uma string no lado do servidor para remover potenciais scripts
 * ou tags HTML maliciosas, retornando apenas texto puro.
 * Ãštil para limpar mensagens de erro ou dados antes de serem enviados ao frontend.
 * 
 * @param {string | null | undefined} dirty A string a ser limpa.
 * @returns {string} A string limpa e segura.
 */
export function sanitizeText(dirty: string | null | undefined): string {
  if (!dirty) {
    return '';
  }
  // A biblioteca 'xss' com options em branco remove todas as tags HTML.
  return xss(dirty, {
    whiteList: {}, // Lista de tags permitidas (vazia para remover tudo)
    stripIgnoreTag: true, // Remove tags nÃ£o permitidas em vez de encodÃ¡-las
    stripIgnoreTagBody: ['script'] // Remove o conteÃºdo de tags perigosas como <script>
  });
} 
