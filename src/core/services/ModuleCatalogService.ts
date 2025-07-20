import type { SupabaseClient } from '@supabase/supabase-js';

export interface BaseModule {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string;
  is_active: boolean;
  archived_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export class ModuleCatalogService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Fetches the list of all available modules from the master catalog.
   * @returns A promise that resolves to an array of BaseModule objects.
   */
  async getAvailableModules(): Promise<BaseModule[]> {
    const { data, error } = await this.supabase
      .from('base_modules')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching available modules:', error.message);
      throw new Error('Could not fetch the module catalog.');
    }

    return data || [];
  }

  /**
   * Fetches a single module by its slug.
   * @param slug The unique slug of the module.
   * @returns A promise that resolves to a BaseModule object or null if not found.
   */
  async getModuleBySlug(slug: string): Promise<BaseModule | null> {
    const { data, error } = await this.supabase
      .from('base_modules')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // PostgREST error for "No rows found"
        return null;
      }
      console.error(`Error fetching module with slug ${slug}:`, error.message);
      throw new Error('Could not fetch the module.');
    }

    return data;
  }
} 