import { createClient } from '@supabase/supabase-js';

import { getEnv } from '../config/env';
import type { Database } from './database.types';

const env = getEnv();

export const supabase = createClient<Database>(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
