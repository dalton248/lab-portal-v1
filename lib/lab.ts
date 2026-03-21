import { supabase } from './supabase';
import { Lab } from './types';

export async function getLabDetails(labId: string): Promise<Lab | null> {
  const { data, error } = await supabase
    .from('Labs')
    .select('*')
    .eq('id', labId)
    .single();

  if (error) {
    console.error('Error fetching lab details:', error);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    logo: data.logo || undefined,
    address: data.address || undefined,
  } as Lab;
}
