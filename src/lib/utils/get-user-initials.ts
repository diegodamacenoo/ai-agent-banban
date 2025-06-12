/**
 * Gera as iniciais do nome do usuário
 * @param firstName O primeiro nome do usuário
 * @param lastName O sobrenome do usuário
 * @returns As iniciais do nome do usuário
 * 
 * Exemplo:
 * - Diego Henrique Damaceno -> DD
 * - João Silva -> JS
 * - Maria -> M
 */
export function getUserInitials(firstName?: string | null, lastName?: string | null): string {
  if (!firstName && !lastName) {
    return 'U'; // Fallback para "User"
  }

  let initials = '';

  if (firstName) {
    initials += firstName.charAt(0).toUpperCase();
  }

  if (lastName) {
    initials += lastName.charAt(0).toUpperCase();
  }

  return initials || 'U';
} 