import { supabase } from './supabase';
import { Partnership } from './types';

export async function getLabPartnerships(labId: string): Promise<Partnership[]> {
  const { data, error } = await supabase
    .from('partnerships')
    .select(`
      id,
      lab_id,
      user_id,
      status,
      agreement_accepted,
      Users:user_id (
        full_name,
        email,
        office_name
      )
    `)
    .eq('lab_id', labId);

  if (error) {
    console.error('Error fetching partnerships:', error);
    return [];
  }

  return (data as any[]).map((p: any) => ({
    id: p.id,
    labId: p.lab_id,
    userId: p.user_id,
    status: p.status,
    agreementAccepted: p.agreement_accepted,
    dentistName: p.Users?.full_name || p.Users?.email?.split('@')[0] || 'N/A',
    dentistEmail: p.Users?.email || 'N/A',
    officeName: p.Users?.office_name || 'N/A',
    createdAt: p.created_at,
  }));
}
