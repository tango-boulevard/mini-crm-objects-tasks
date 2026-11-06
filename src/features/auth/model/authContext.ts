import type { Session } from '@supabase/supabase-js';
import { createContext } from 'react';

import type { Profile } from '../../../shared/types/domain';

export interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  profileError: string | null;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
