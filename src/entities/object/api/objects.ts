import { supabase } from '../../../shared/api/supabase';
import type { ConstructionObject } from '../../../shared/types/domain';

export async function getObjects(): Promise<ConstructionObject[]> {
  const { data, error } = await supabase
    .from('construction_objects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getObject(objectId: string): Promise<ConstructionObject> {
  const { data, error } = await supabase
    .from('construction_objects')
    .select('*')
    .eq('id', objectId)
    .single();

  if (error) throw error;
  return data;
}

interface ObjectInput {
  name: string;
  address: string;
}

export async function createObject(input: ObjectInput): Promise<void> {
  const { error } = await supabase.from('construction_objects').insert(input);
  if (error) throw error;
}

export async function updateObject(objectId: string, input: ObjectInput): Promise<void> {
  const { error } = await supabase.from('construction_objects').update(input).eq('id', objectId);
  if (error) throw error;
}

export async function deleteObject(objectId: string): Promise<void> {
  const { error } = await supabase.from('construction_objects').delete().eq('id', objectId);
  if (error) throw error;
}
