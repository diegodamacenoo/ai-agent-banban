"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { createLogger } from '@/shared/utils/logger';
import { DEBUG_MODULES } from '@/shared/utils/debug-config';
import { createSupabaseBrowserClient } from '@/core/supabase/client';

// Criar logger para o UserContext
const logger = createLogger(DEBUG_MODULES.USER_CONTEXT);

// 1. Definição dos Tipos
export interface UserData {
  first_name: string;
  last_name: string;
  username: string | null;
  role: string;
  avatar_url: string | null;
  job_title: string | null;
  phone: string | null;
  team: string | null;
  theme: string;
  location: string | null;
  email: string;
  organization_id: string | null;
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
  username: null,
  role: "",
  avatar_url: null,
  job_title: null,
  phone: null,
  team: null,
  theme: "light", // Valor padrão
  location: null,
  email: "_placeholder_", // Alterado para não ser string vazia
  organization_id: null,
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

  // Função para buscar dados do usuário com retry
  const fetchUserData = async (retries = 3, delay = 500) => {
    setLoading(true);
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const supabase = createSupabaseBrowserClient();
        
        // Usar getUser() que é mais seguro que getSession()
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          logger.warn(`Erro de autenticação (tentativa ${attempt}/${retries}):`, authError.message);
          if (attempt === retries) {
            throw new Error('Usuário não autenticado');
          }
          continue;
        }

        if (!user) {
          logger.warn(`Usuário não encontrado (tentativa ${attempt}/${retries})`);
          if (attempt === retries) {
            throw new Error('Usuário não autenticado');
          }
          continue;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, last_name, job_title, phone, avatar_url, team, organization_id, username, location, role')
          .eq('id', user.id)
          .single();

        if (error) {
          logger.warn(`Erro ao buscar perfil (tentativa ${attempt}/${retries}):`, error.message);
          if (attempt === retries) {
            throw error;
          }
          continue;
        }

        if (!data) {
          logger.warn(`Perfil não encontrado (tentativa ${attempt}/${retries})`);
          if (attempt === retries) {
            throw new Error('Perfil não encontrado');
          }
          continue;
        }

        // Combina os dados do perfil com o email do auth
        const profileData: UserData = {
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          username: data.username,
          role: data.role || '',
          avatar_url: data.avatar_url,
          job_title: data.job_title,
          phone: data.phone,
          team: data.team,
          theme: 'light', // Valor padrão
          location: data.location,
          email: user.email || '',
          organization_id: data.organization_id
        };

        setUserData(profileData);
        logger.info("Dados do usuário carregados com sucesso");
        setLoading(false);
        return; // Sucesso, sair do loop
        
      } catch (error) {
        logger.warn(`Erro ao buscar dados do usuário (tentativa ${attempt}/${retries}):`, error);
        
        if (attempt === retries) {
          // Última tentativa falhou, definir userData como null
          setUserData(null);
          setLoading(false);
          return;
        }
        
        // Aguardar antes da próxima tentativa (backoff exponencial)
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
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
