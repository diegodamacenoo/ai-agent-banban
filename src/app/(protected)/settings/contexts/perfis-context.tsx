'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useUser } from "@/app/contexts/UserContext";
import type {
  UserProfile,
  RoleEnum,
  UserStatusEnum,
} from "../types/perfis";

// Types para o contexto de usuÃ¡rios
type PerfilUsuarioState = {
  perfis: UserProfile[];
  isLoading: boolean;
  error: string | null;
};

type PerfilUsuarioActions = {
  criarPerfil: (perfilData: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  editarPerfil: (perfilData: UserProfile) => Promise<void>;
  removerPerfil: (id: string) => Promise<void>;
  carregarPerfis: () => Promise<void>;
};

interface PerfilUsuarioContextType extends PerfilUsuarioState, PerfilUsuarioActions {}

interface PerfilUsuarioProviderProps {
  children: React.ReactNode;
}

const PerfilUsuarioContext = createContext<PerfilUsuarioContextType | undefined>(undefined);

export function PerfilUsuarioProvider({ children }: PerfilUsuarioProviderProps) {
  const { userData } = useUser();
  const [state, setState] = useState<PerfilUsuarioState>({
    perfis: [],
    isLoading: false, // ComeÃ§a como false, pois a aÃ§Ã£o de carregar depende do role
    error: null,
  });

  const carregarPerfisAction = useCallback(async () => {
    // SÃ³ busca se for admin de organizaÃ§Ã£o
    if (userData?.role !== 'organization_admin') {
      setState((prev) => ({ ...prev, isLoading: false, perfis: [], error: null }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    const result = await fetchPerfisUsuario();
    if (!result.success || result.error) {
      setState((prev) => ({ ...prev, isLoading: false, error: result.error || null }));
    } else {
      setState((prev) => ({ ...prev, perfis: result.data, isLoading: false }));
    }
  }, [userData]);

  useEffect(() => {
    // A verificaÃ§Ã£o do role agora estÃ¡ dentro da action, mas Ã© bom ter aqui tambÃ©m
    // para evitar chamadas desnecessÃ¡rias na montagem.
    if (userData?.role === 'organization_admin') {
      carregarPerfisAction();
    } else {
      // Para master_admin, explicitamente definimos o carregamento como concluÃ­do.
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [userData, carregarPerfisAction]);

  const actions: PerfilUsuarioActions = {
    criarPerfil: useCallback(async (perfilData: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const result = await createPerfilUsuario(perfilData);
      if (!result.success || result.error) {
        setState((prev) => ({ ...prev, isLoading: false, error: result.error || null }));
        throw new Error(result.error || "Erro ao criar perfil.");
      } else {
        await carregarPerfisAction();
        setState((prev) => ({...prev, isLoading: false }));
      }
    }, [carregarPerfisAction]),

    editarPerfil: useCallback(async (perfilData: UserProfile) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const result = await updatePerfilUsuario(perfilData);
      
      if (result.success) {
        setState((prev) => ({
          ...prev,
          perfis: prev.perfis.map(p => p.id === perfilData.id ? perfilData : p),
          isLoading: false
        }));
      } else {
        setState((prev) => ({ ...prev, error: result.error || 'Erro ao atualizar perfil', isLoading: false }));
      }
    }, []),

    removerPerfil: useCallback(async (id: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const result = await deletePerfilUsuario(id);
      if (!result.success || result.error) {
        setState((prev) => ({ ...prev, isLoading: false, error: result.error || null }));
        throw new Error(result.error || "Erro ao remover perfil.");
      } else {
        await carregarPerfisAction();
        setState((prev) => ({...prev, isLoading: false }));
      }
    }, [carregarPerfisAction]),

    carregarPerfis: carregarPerfisAction,
  };

  return (
    <PerfilUsuarioContext.Provider value={{ ...state, ...actions }}>
      {children}
    </PerfilUsuarioContext.Provider>
  );
}

export function usePerfilUsuario() {
  const context = useContext(PerfilUsuarioContext);
  if (!context) {
    throw new Error('usePerfilUsuario deve ser usado dentro de um PerfilUsuarioProvider');
  }
  return context;
}

async function createPerfilUsuario(perfilData: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const response = await fetch('/api/settings/users/profiles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(perfilData),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Erro ao criar perfil');
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function updatePerfilUsuario(perfilData: UserProfile) {
  try {
    const response = await fetch(`/api/settings/users/profiles/${perfilData.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(perfilData),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Erro ao atualizar perfil');
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function deletePerfilUsuario(id: string) {
  try {
    const response = await fetch(`/api/settings/users/profiles/${id}`, {
      method: 'DELETE',
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Erro ao remover perfil');
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function fetchPerfisUsuario() {
  try {
    const response = await fetch('/api/settings/users/profiles');
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Erro ao carregar perfis');
    }
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
