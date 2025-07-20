import { client } from '../../../database/client';

export interface Resource2 {
  id: string;
  name: string;
  description: string;
  status: string;
}

export async function findAll(): Promise<Resource2[]> {
  const { data, error } = await client
    .from('resource2')
    .select('*');
  
  if (error) throw error;
  return data;
}

export async function findById(id: string): Promise<Resource2 | null> {
  const { data, error } = await client
    .from('resource2')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

export async function create(resource: Omit<Resource2, 'id'>): Promise<Resource2> {
  const { data, error } = await client
    .from('resource2')
    .insert([resource])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function update(id: string, resource: Partial<Resource2>): Promise<Resource2> {
  const { data, error } = await client
    .from('resource2')
    .update(resource)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function remove(id: string): Promise<void> {
  const { error } = await client
    .from('resource2')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
} 