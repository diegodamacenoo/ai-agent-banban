"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createLogger } from '@/lib/utils/logger';
import { DEBUG_MODULES } from '@/lib/utils/debug-config';

// Criar logger para o UserContext
const logger = createLogger(DEBUG_MODULES.USER_CONTEXT);

// 1. Definição dos Tipos (ajuste conforme necessário)
export interface UserData {
  first_name: string;
  last_name: string;
  username: string;
  role: string;
  avatar_url: string;
  job_title: string;
  phone: string;
  team_id: string;
  theme: string;
  location: string;
  email: string; // Adicionado para exemplo de condição
}

export interface UserConditions {
  isOrganizationAdmin: boolean;
  isEditor: boolean;
  isViewer: boolean;
  isGuest: boolean;
  // Adicione outras condições conforme necessário
}

export interface UserContextType {
  userData: UserData | null;
  userConditions: UserConditions;
  updateUserData: (newData: Partial<UserData>) => void;
  fetchUserData: () => Promise<void>; // Função para buscar dados do usuário
}

// Valores iniciais para userData
const initialUserData: UserData = {
  first_name: "",
  last_name: "",
  username: "",
  role: "",
  avatar_url: "",
  job_title: "",
  phone: "",
  team_id: "",
  theme: "light", // Valor padrão
  location: "",
  email: "_placeholder_", // Alterado para não ser string vazia
};

// Valores iniciais para userConditions
const initialUserConditions: UserConditions = {
  isOrganizationAdmin: false,
  isEditor: false,
  isViewer: false,
  isGuest: true,
};

// 2. Criação do Contexto
const UserContext = createContext<UserContextType | undefined>(undefined);

// 3. Criação do Provedor (UserProvider)
interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userConditions, setUserConditions] = useState<UserConditions>(initialUserConditions);
  const [loading, setLoading] = useState(true);

  // Função para buscar dados do usuário da API
  const fetchUserData = async () => {
    setLoading(true);
    try {
      // Em um cenário real, esta seria uma chamada à sua API de perfil
      // Para este exemplo, vamos simular uma chamada e usar dados mockados
      // ou buscar do /api/profiles/me se disponível e adequado
      const response = await fetch("/api/profiles/me"); // Ajuste este endpoint conforme necessário
      
      logger.debug('Fetch user data response status:', response.status);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      const data = await response.json();
      
      logger.debug('Fetch user data response:', data);
      
      // Supondo que a API retorna um objeto com uma chave 'data' contendo o perfil
      const profileData = data?.data || {}; 

      logger.debug('Profile data before setting userData:', profileData);
      
      // Log adicional para a role
      logger.debug('Role do usuário recebida da API:', profileData.role);
      
      setUserData({
        first_name: profileData.first_name || initialUserData.first_name,
        last_name: profileData.last_name || initialUserData.last_name,
        username: profileData.username || initialUserData.username,
        role: profileData.role || initialUserData.role,
        avatar_url: profileData.avatar_url || initialUserData.avatar_url,
        job_title: profileData.job_title || initialUserData.job_title,
        phone: profileData.phone || initialUserData.phone,
        team_id: profileData.team_id || initialUserData.team_id,
        theme: profileData.theme || initialUserData.theme,
        location: profileData.location || initialUserData.location,
        email: profileData.email || (profileData.email === "" ? initialUserData.email : profileData.email), // Lógica melhorada
      });
    } catch (error) {
      logger.error("Error fetching user data:", error);
      // Em caso de erro, poderia definir userData como null ou um estado de erro
      setUserData(initialUserData); // Ou null, dependendo de como quer tratar o erro
    } finally {
      setLoading(false);
    }
  };

  // Buscar dados do usuário ao montar o provedor
  useEffect(() => {
    fetchUserData();
  }, []);


  // 4. Lógica de Derivação/Recálculo de Condições
  useEffect(() => {
    if (userData) {
      const newConditions: UserConditions = {
        // Exemplo de Regra: isOrganizationAdmin se o role for "organization_admin"
        isOrganizationAdmin: !!userData.role && userData.role === "organization_admin",
        // Exemplo de Regra: isEditor se o role for "editor"
        isEditor: !!userData.role && userData.role === "editor",
        // Exemplo de Regra: isViewer se o role for "reader"
        isViewer: !!userData.role && userData.role === "reader",
        // Exemplo de Regra: isGuest se o role for "visitor"
        isGuest: !!userData.role && userData.role === "visitor",
      };
      setUserConditions(newConditions);
    } else {
      // Se não houver dados do usuário, reseta para as condições iniciais
      setUserConditions(initialUserConditions);
    }
  }, [userData]); // Dependência: recalcular quando userData mudar

  // 5. Função de Atualização de Dados
  const updateUserData = (newData: Partial<UserData>) => {
    // Em um cenário de produção, esta função seria responsável por
    // chamar uma API de backend para persistir as alterações e somente
    // atualizar o estado local após o sucesso da chamada API.
    setUserData(prev => (prev ? { ...prev, ...newData } : null));
  };

  const contextValue: UserContextType = {
    userData,
    userConditions,
    updateUserData,
    fetchUserData, // Expor a função de busca
  };

  // Enquanto estiver carregando os dados, pode-se exibir um loader
  // ou null para não renderizar o children até ter os dados.
  // Para este exemplo, vamos renderizar children imediatamente.
  // if (loading) {
  //   return <div>Loading user data...</div>; // Ou um componente de spinner/loading
  // }

  // 6. Exposição do Contexto
  return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>;
};

// 7. Criação do Custom Hook useUser
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}; 