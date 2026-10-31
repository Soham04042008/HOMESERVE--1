import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type UserRole = 'customer' | 'worker';

export type UserProfileRow = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  worker_onboarding_complete: boolean;
  worker_onboarding_step: number;
};

type UseUserRoleResult = {
  profile: UserProfileRow | null;
  role: UserRole | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setOnboardingStep: (step: number) => Promise<void>;
  completeOnboarding: () => Promise<void>;
};

export function useUserRole(session: Session | null): UseUserRoleResult {
  const [profile, setProfile] = useState<UserProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!supabase || !session) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const { data, error: fetchErr } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();

    if (fetchErr) {
      setError(fetchErr.message);
      setLoading(false);
      return;
    }

    if (data) {
      setProfile(data as UserProfileRow);
      setLoading(false);
      return;
    }

    // No profile yet — try to register from user_metadata
    const metaRole = (session.user.user_metadata?.account_role as string) || 'customer';
    const safeRole: UserRole = metaRole === 'worker' ? 'worker' : 'customer';
    const fullName = (session.user.user_metadata?.full_name as string) || '';

    const { error: rpcErr } = await supabase.rpc('register_user_role', {
      p_role: safeRole,
      p_full_name: fullName,
    });

    if (rpcErr) {
      setError(rpcErr.message);
      setLoading(false);
      return;
    }

    // Re-fetch after registration
    const { data: newRow } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();

    if (newRow) {
      setProfile(newRow as UserProfileRow);
    } else {
      // Fallback: construct from RPC response
      setProfile({
        id: session.user.id,
        email: session.user.email ?? '',
        full_name: fullName,
        role: safeRole,
        worker_onboarding_complete: false,
        worker_onboarding_step: 0,
      });
    }
    setLoading(false);
  }, [session]);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  const setOnboardingStep = useCallback(async (step: number) => {
    if (!supabase || !profile) return;
    const { error: e } = await supabase
      .from('user_profiles')
      .update({ worker_onboarding_step: step, updated_at: new Date().toISOString() })
      .eq('id', profile.id);
    if (e) {
      setError(e.message);
      return;
    }
    setProfile((prev) => (prev ? { ...prev, worker_onboarding_step: step } : prev));
  }, [profile]);

  const completeOnboarding = useCallback(async () => {
    if (!supabase || !profile) return;
    const { error: e } = await supabase
      .from('user_profiles')
      .update({
        worker_onboarding_complete: true,
        worker_onboarding_step: 7,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);
    if (e) {
      setError(e.message);
      return;
    }
    setProfile((prev) =>
      prev ? { ...prev, worker_onboarding_complete: true, worker_onboarding_step: 7 } : prev,
    );
  }, [profile]);

  return {
    profile,
    role: profile?.role ?? null,
    loading,
    error,
    refresh: fetchProfile,
    setOnboardingStep,
    completeOnboarding,
  };
}
