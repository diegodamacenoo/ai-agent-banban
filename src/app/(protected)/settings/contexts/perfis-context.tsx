'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type {
  PerfilUsuario,
  PerfilUsuarioContextType,
  PerfilUsuarioProviderProps,
  PerfilUsuarioState,
  PerfilUsuarioActions,
} from "../types/perfis";

const PerfilUsuarioContext = createContext<PerfilUsuarioContextType | undefined>(undefined);

export function PerfilUsuarioProvider({ children }: PerfilUsuarioProviderProps) {
  const [state, setState] = useState<PerfilUsuarioState>({
    perfis: [],
    isLoading: false,
    error: null,
  });

  const carregarPerfisAction = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    const result = await fetchPerfisUsuario();
    if (!result.success || result.error) {
      setState((prev) => ({ ...prev, isLoading: false, error: result.error || null }));
    } else {
      setState((prev) => ({ ...prev, perfis: result.data, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    carregarPerfisAction();
  }, [carregarPerfisAction]);

  const actions: PerfilUsuarioActions = {
    criarPerfil: useCallback(async (perfilData: Omit<PerfilUsuario, 'id' | 'created_at' | 'updated_at'>) => {
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

    editarPerfil: useCallback(async (perfilData: PerfilUsuario) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const result = await updatePerfilUsuario(perfilData);
      if (!result.success || result.error) {
        setState((prev) => ({ ...prev, isLoading: false, error: result.error || null }));
        throw new Error(result.error || "Erro ao editar perfil.");
      } else {
        await carregarPerfisAction();
        setState((prev) => ({...prev, isLoading: false }));
      }
    }, [carregarPerfisAction]),

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

async function createPerfilUsuario(perfilData: Omit<PerfilUsuario, 'id' | 'created_at' | 'updated_at'>) {
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

async function updatePerfilUsuario(perfilData: PerfilUsuario) {
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
