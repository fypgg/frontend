import { cookies } from 'next/headers';
import { privyClient } from './index';
import {
  getUserById,
  getUserByPrivyId,
  createUser,
  linkUserToPrivy,
} from '../db/queries';
import type { DBUser } from '../db/schema';

const SESSION_COOKIE = 'session-id';

export type Session = {
  user: DBUser;
  isAuthenticated: boolean;
  privyUserId: string | null;
};

export async function getSession(): Promise<Session> {
  const cookieStore = await cookies();

  const privyToken = cookieStore.get('privy-token')?.value;
  let privyUserId: string | null = null;
  let isAuthenticated = false;

  if (privyToken) {
    try {
      const claims = await privyClient.verifyAuthToken(privyToken);
      privyUserId = claims.userId;
      isAuthenticated = true;

      const privyUser = await getUserByPrivyId({ privyId: privyUserId });
      if (privyUser) {
        return { user: privyUser, isAuthenticated: true, privyUserId };
      }
    } catch {
      privyUserId = null;
      isAuthenticated = false;
    }
  }

  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sessionId) {
    throw new Error('Session cookie not found. Middleware should have set it.');
  }

  let existingUser = await getUserById({ id: sessionId });

  if (!existingUser) {
    existingUser = await createUser({ id: sessionId, username: `anon_${sessionId.slice(0, 8)}` });
  }

  if (privyUserId && !existingUser.privyId) {
    const linkedUser = await linkUserToPrivy({ userId: existingUser.id, privyId: privyUserId });
    return { user: linkedUser, isAuthenticated: true, privyUserId };
  }

  return {
    user: existingUser,
    isAuthenticated,
    privyUserId: isAuthenticated ? existingUser.privyId : null,
  };
}
