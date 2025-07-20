export const userRoleOptions = [
  'master_admin',
  'organization_admin',
  'user'
] as const;

export type UserRole = typeof userRoleOptions[number];

export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'DELETED';
  job_title?: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  last_sign_in_at?: string;
} 
