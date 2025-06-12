/**
 * Interface para representar os dados de uma sessão de usuário
 */
export interface UserSession {
  /** ID único da sessão */
  id: string;
  
  /** Nome do dispositivo e navegador */
  dispositivo: string;
  
  /** Localização e IP */
  local: string;
  
  /** Data e hora do login formatada */
  dataHoraLogin: string;
  
  /** Indica se é a sessão atual do usuário */
  atual: boolean;
  
  /** User-Agent original */
  userAgent: string;
  
  /** Endereço IP */
  ip: string | null;
}

/**
 * Extensão para o tipo Session do Supabase Auth
 * para evitar erros de TypeScript quando acessamos a propriedade id
 */
declare global {
  namespace Supabase {
    interface Session {
      id: string;
    }
  }
} 