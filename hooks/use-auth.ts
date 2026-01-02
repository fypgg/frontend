'use client';

import { usePrivy, useLogin, useLogout } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export function useAuth() {
  const router = useRouter();
  const { ready, authenticated, user } = usePrivy();

  const { login } = useLogin({
    onComplete: () => {
      router.refresh();
    },
  });

  const { logout } = useLogout({
    onSuccess: () => {
      router.refresh();
    },
  });

  const signIn = useCallback(() => login(), [login]);
  const signOut = useCallback(() => logout(), [logout]);

  return {
    isReady: ready,
    isAuthenticated: authenticated,
    privyUser: user,
    privyUserId: user?.id ?? null,
    signIn,
    signOut,
  };
}
