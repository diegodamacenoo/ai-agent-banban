import { Session } from '@supabase/supabase-js';

// Extensão dos tipos do Supabase
declare module '@supabase/supabase-js' {
  interface Session {
    id: string;
  }
} 