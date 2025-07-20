import { Session } from '@supabase/supabase-js';

// ExtensÃ£o dos tipos do Supabase
declare module '@supabase/supabase-js' {
  interface Session {
    id: string;
  }
} 
