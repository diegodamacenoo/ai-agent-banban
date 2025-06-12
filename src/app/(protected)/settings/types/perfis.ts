export type RoleEnum = 'organization_admin' | 'standard_user';
export type UserStatusEnum = 'active' | 'inactive' | 'suspended';

export interface PerfilUsuario {
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

export type PerfilUsuarioState = {
  perfis: PerfilUsuario[];
  isLoading: boolean;
  error: string | null;
}

export type PerfilUsuarioActions = {
  criarPerfil: (perfil: Omit<PerfilUsuario, 'id' | 'created_at' | 'updated_at'>) => void;
  editarPerfil: (perfil: PerfilUsuario) => void;
  removerPerfil: (id: string) => void;
  carregarPerfis: () => void;
}

export interface PerfilUsuarioContextType extends PerfilUsuarioState, PerfilUsuarioActions {}

export interface PerfilUsuarioProviderProps {
  children: React.ReactNode;
}

export type PerfilUsuarioDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSalvar: (perfil: PerfilUsuario) => void;
  perfil?: PerfilUsuario;
}
