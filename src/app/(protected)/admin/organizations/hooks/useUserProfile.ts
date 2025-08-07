import { useState, useCallback } from 'react';
import type { User } from '../types';

/**
 * Hook customizado para gerenciamento do drawer de perfil de usuário
 * Centraliza estado e handlers relacionados à visualização de perfis
 */
export const useUserProfile = () => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);

  /**
   * Abre drawer de perfil do usuário com dados selecionados
   */
  const handleViewUserProfile = useCallback((user: User) => {
    setSelectedUser(user);
    setIsUserProfileOpen(true);
  }, []);

  /**
   * Fecha drawer de perfil e limpa dados selecionados
   */
  const handleCloseUserProfile = useCallback(() => {
    setIsUserProfileOpen(false);
    setSelectedUser(null);
  }, []);

  return {
    selectedUser,
    isUserProfileOpen,
    handleViewUserProfile,
    handleCloseUserProfile,
  };
};