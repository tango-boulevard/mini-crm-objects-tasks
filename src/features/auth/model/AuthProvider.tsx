import type { Session } from '@supabase/supabase-js';
import { useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { supabase } from '../../../shared/api/supabase';
import type { Profile } from '../../../shared/types/domain';
import { AuthContext, type AuthContextValue } from './authContext';

async function loadProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, role, is_active')
    .eq('id', userId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const applySession = async (nextSession: Session | null) => {
      if (!isMounted) return;

      setSession(nextSession);
      setProfile(null);
      setProfileError(null);

      if (!nextSession) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const nextProfile = await loadProfile(nextSession.user.id);
        if (isMounted) setProfile(nextProfile);
      } catch (error) {
        if (isMounted) {
          setProfileError(error instanceof Error ? error.message : 'Профиль пользователя не найден');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void supabase.auth.getSession().then(({ data }) => applySession(data.session));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void applySession(nextSession);
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      isLoading,
      profileError,
      signOut: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      },
    }),
    [isLoading, profile, profileError, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
