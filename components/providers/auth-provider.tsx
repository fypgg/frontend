'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana';
import type { ReactNode } from 'react';

interface AuthProviderProps {
  children: ReactNode;
}

const solanaConnectors = toSolanaWalletConnectors({
  shouldAutoConnect: true,
});

export function AuthProvider({ children }: AuthProviderProps) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!appId) {
    throw new Error('NEXT_PUBLIC_PRIVY_APP_ID is not set');
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        appearance: {
          theme: 'light',
        },
        loginMethods: ['email', 'google', 'apple'],
        embeddedWallets: {
          solana: {
            createOnLogin: 'users-without-wallets',
          },
        },
        externalWallets: {
          solana: {
            connectors: solanaConnectors,
          },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}

