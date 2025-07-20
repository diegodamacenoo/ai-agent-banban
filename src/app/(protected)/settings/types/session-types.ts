/**
 * Interface para representar os dados de uma sessÃ£o de usuÃ¡rio
 */
export interface UserSession {
  /** ID Ãºnico da sessÃ£o */
  id: string;
  
  /** Nome do dispositivo e navegador */
  dispositivo: string;
  
  /** LocalizaÃ§Ã£o e IP */
  local: string;
  
  /** Data e hora do login formatada */
  dataHoraLogin: string;
  
  /** Indica se Ã© a sessÃ£o atual do usuÃ¡rio */
  atual: boolean;
  
  /** User-Agent original */
  userAgent: string;
  
  /** EndereÃ§o IP */
  ip: string | null;
}

/**
 * ExtensÃ£o para o tipo Session do Supabase Auth
 * para evitar erros de TypeScript quando acessamos a propriedade id
 */
declare global {
  namespace Supabase {
    interface Session {
      id: string;
    }
  }
} 
