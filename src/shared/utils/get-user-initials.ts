/**
 * Gera as iniciais do nome do usuÃ¡rio
 * @param firstName O primeiro nome do usuÃ¡rio
 * @param lastName O sobrenome do usuÃ¡rio
 * @returns As iniciais do nome do usuÃ¡rio
 * 
 * Exemplo:
 * - Diego Henrique Damaceno -> DD
 * - JoÃ£o Silva -> JS
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
