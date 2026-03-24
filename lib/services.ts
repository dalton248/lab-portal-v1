import { supabase } from './supabase';
import { Service } from './types';

export async function getLabServices(labId: string): Promise<Service[]> {
  const { data, error } = await supabase
    .from('Services')
    .select('*')
    .eq('lab_id', labId)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching services:', error);
    return [];
  }

  return (data || []).map(service => ({
    ...service,
    base_price: typeof service.base_price === 'string' ? parseFloat(service.base_price) : service.base_price
  }));
}

export async function createService(service: Omit<Service, 'id' | 'created_at'>): Promise<Service | null> {
  const { data, error } = await supabase
    .from('Services')
    .insert([service])
    .select()
    .single();

  if (error) {
    console.error('Error creating service:', error);
    return null;
  }

  return data;
}

export async function updateService(id: string, service: Partial<Omit<Service, 'id' | 'created_at'>>): Promise<Service | null> {
  const { data, error } = await supabase
    .from('Services')
    .update(service)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating service:', error);
    return null;
  }

  return data;
}

export async function deleteService(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('Services')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting service:', error);
    return false;
  }

  return true;
}
