import { client } from '../../../database/client';

export interface Resource1 {
  id: string;
  name: string;
  description: string;
}

export async function findAll(): Promise<Resource1[]> {
  const { data, error } = await client
    .from('resource1')
    .select('*');
  
  if (error) throw error;
  return data;
}

export async function findById(id: string): Promise<Resource1 | null> {
  const { data, error } = await client
    .from('resource1')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

export async function create(resource: Omit<Resource1, 'id'>): Promise<Resource1> {
  const { data, error } = await client
    .from('resource1')
    .insert([resource])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function update(id: string, resource: Partial<Resource1>): Promise<Resource1> {
  const { data, error } = await client
    .from('resource1')
    .update(resource)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function remove(id: string): Promise<void> {
  const { error } = await client
    .from('resource1')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
} 