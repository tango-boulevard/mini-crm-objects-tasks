import { supabase } from '../../../shared/api/supabase';
import type { Profile } from '../../../shared/types/domain';

export async function getExecutors(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, role, is_active')
    .eq('role', 'executor')
    .eq('is_active', true)
    .order('display_name');

  if (error) throw error;
  return data;
}
