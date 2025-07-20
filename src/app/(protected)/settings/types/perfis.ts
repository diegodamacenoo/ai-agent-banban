export type RoleEnum = 'organization_admin' | 'standard_user' | 'reader';
export type UserStatusEnum = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'DELETED';

// Novo tipo para gerenciar Roles/Perfis de Acesso
export interface Role {
  id: string;
  name: string;
  description?: string | null;
  permissions?: string[];
  created_at?: Date;
  updated_at?: Date;
}

// Tipo para o perfil de um usuÃ¡rio individual
export interface UserProfile {
  id: string;
  organization_id?: string;
  role: RoleEnum;
  first_name: string | null;
  last_name: string | null;
  username?: string | null;
  date_of_birth?: Date | null;
  avatar_url?: string | null;
  job_title?: string | null;
  team_id?: string | null;
  team?: string | null;
  status: UserStatusEnum;
  deleted_at?: Date | null;
  is_2fa_enabled: boolean;
  prefers_email_notifications: boolean;
  prefers_push_notifications: boolean;
  theme: string;
  created_at?: Date;
  updated_at?: Date;
  is_setup_complete: boolean;
  phone?: string | null;
  location?: string | null;
}

export type PerfilState = {
  roles: Role[];
  isLoading: boolean;
  error: string | null;
}

export type PerfilActions = {
  criarPerfil: (perfil: Omit<Role, 'id' | 'created_at' | 'updated_at'>) => void;
  editarPerfil: (perfil: Role) => void;
  removerPerfil: (id: string) => void;
  carregarPerfis: () => void;
}

export interface PerfilContextType extends PerfilState, PerfilActions {}

export interface PerfilProviderProps {
  children: React.ReactNode;
}

export type PerfilDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSalvar: (perfil: Role) => void;
  perfil?: Role;
}
