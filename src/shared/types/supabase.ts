export interface Profile {
  id: string;
  user_id: string;
  organization_id: string | null;
  role: string;
  permissions?: string[];
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
} 
