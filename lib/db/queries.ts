import { desc, eq, and } from 'drizzle-orm';
import { db } from './index';
import {
  app,
  chatMessage,
  DBApp,
  DBAppRevision,
  DBChatMessage,
  DBUser,
  revision,
  user,
} from './schema';
import { DBError } from '../errors';

export async function getUserById({ id }: { id: string }): Promise<DBUser | null> {
  try {
    const [selectedUser] = await db.select().from(user).where(eq(user.id, id));
    return selectedUser ?? null;
  } catch (error) {
    throw new DBError('bad_request:database', 'Failed to get user by id');
  }
}

export async function getUserByPrivyId({ privyId }: { privyId: string }): Promise<DBUser | null> {
  try {
    const [selectedUser] = await db.select().from(user).where(eq(user.privyId, privyId));
    return selectedUser ?? null;
  } catch (error) {
    throw new DBError('bad_request:database', 'Failed to get user by privy id');
  }
}

export async function getOrCreateUserByPrivyId({ privyId }: { privyId: string }): Promise<DBUser> {
  try {
    const existingUser = await getUserByPrivyId({ privyId });
    if (existingUser) {
      return existingUser;
    }

    const username = `user_${privyId.slice(-8)}`;
    const [newUser] = await db.insert(user).values({
      privyId,
      username,
    }).returning();
    
    return newUser;
  } catch (error) {
    throw new DBError('bad_request:database', 'Failed to get or create user by privy id');
  }
}

export async function linkUserToPrivy({ userId, privyId }: { userId: string; privyId: string }): Promise<DBUser> {
  try {
    const [updatedUser] = await db.update(user)
      .set({ privyId })
      .where(eq(user.id, userId))
      .returning();
    return updatedUser;
  } catch (error) {
    throw new DBError('bad_request:database', 'Failed to link user to privy');
  }
}

export async function getAppById({ id }: { id: string }): Promise<DBApp> {
  try {
    const [selectedApp] = await db.select().from(app).where(eq(app.id, id));
    return selectedApp;
  } catch (error) {
    throw new DBError('bad_request:database', 'Failed to get app by id');
  }
}

export async function getChatById({ id }: { id: string }): Promise<DBChatMessage[]> {
  try {
    return await db.select()
      .from(chatMessage)
      .where(eq(chatMessage.appId, id))
      .orderBy(chatMessage.createdAt);
  } catch (error) {
    throw new DBError('bad_request:database', 'Failed to get chat by id');
  }
}

export async function saveMessages({ appId, messages }: { appId: string, messages: { role: 'user' | 'assistant', content: string }[] }) {
  try {
    return await db.insert(chatMessage).values(
      messages.map(msg => ({
        appId,
        role: msg.role,
        content: msg.content
      }))
    ).returning();
  } catch (error) {
    throw new DBError('bad_request:database', 'Failed to save messages');
  }
}

export async function createUser(userData: { id?: string; username: string; avatarUrl?: string }): Promise<DBUser> {
  try {
    const [newUser] = await db.insert(user).values(userData).returning();
    return newUser;
  } catch (error) {
    throw new DBError('bad_request:database', 'Failed to create user');
  }
}

export async function createApp(appData: { ownerId: string; title?: string; description?: string }): Promise<DBApp> {
  try {
    const [newApp] = await db.insert(app).values({
      ownerId: appData.ownerId,
      title: appData.title || 'Untitled App',
      description: appData.description
    }).returning();
    return newApp;
  } catch (error) {
    throw new DBError('bad_request:database', 'Failed to create app');
  }
}

export async function updateApp({ id, title, description }: { id: string; title?: string; description?: string }): Promise<DBApp> {
  try {
    const updateData: Partial<typeof app.$inferInsert> = { updatedAt: new Date() };
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;

    const [updatedApp] = await db.update(app)
      .set(updateData)
      .where(eq(app.id, id))
      .returning();
      
    return updatedApp;
  } catch (error) {
    throw new DBError('bad_request:database', 'Failed to update app');
  }
}

export async function createRevision(revisionData: { 
  appId: string; 
  commitSha: string; 
  message?: string;
}) {
  try {
    const [newRevision] = await db.insert(revision).values({
      appId: revisionData.appId,
      commitSha: revisionData.commitSha,
      message: revisionData.message,
    }).returning();

    await db.update(app)
      .set({ updatedAt: new Date() })
      .where(eq(app.id, revisionData.appId));

    return newRevision;
  } catch (error) {
    throw new DBError('bad_request:database', 'Failed to create revision');
  }
}

export async function getRevisions({ appId }: { appId: string }): Promise<DBAppRevision[]> {
  try {
    return await db.select()
      .from(revision)
      .where(eq(revision.appId, appId))
      .orderBy(desc(revision.createdAt));
  } catch (error) {
    throw new DBError('bad_request:database', 'Failed to get revisions');
  }
}

export async function getActiveRevision({ appId }: { appId: string }): Promise<DBAppRevision | undefined> {
  try {
    const [selectedApp] = await db.select().from(app).where(eq(app.id, appId));
    if (!selectedApp || !selectedApp.activeRevisionId) return undefined;

    const [activeRevision] = await db.select()
      .from(revision)
      .where(eq(revision.id, selectedApp.activeRevisionId));
    
    return activeRevision;
  } catch (error) {
    throw new DBError('bad_request:database', 'Failed to get active revision');
  }
}

export async function getLatestRevision({ appId }: { appId: string }): Promise<DBAppRevision | undefined> {
  try {
    const [latestRevision] = await db.select()
      .from(revision)
      .where(eq(revision.appId, appId))
      .orderBy(desc(revision.createdAt))
      .limit(1);
    return latestRevision;
  } catch (error) {
    throw new DBError('bad_request:database', 'Failed to get latest revision');
  }
}

export async function setActiveRevision({ appId, revisionId }: { appId: string; revisionId: string }) {
  try {
    await db.transaction(async (tx) => {
      await tx.update(app)
        .set({ activeRevisionId: revisionId, updatedAt: new Date() })
        .where(eq(app.id, appId));

      await tx.update(revision)
        .set({ isActive: false })
        .where(eq(revision.appId, appId));
        
      await tx.update(revision)
        .set({ isActive: true })
        .where(eq(revision.id, revisionId));
    });
  } catch (error) {
    throw new DBError('bad_request:database', 'Failed to set active revision');
  }
}

export async function getRevisionByCommitSha({ appId, commitSha }: { appId: string; commitSha: string }): Promise<DBAppRevision | undefined> {
  try {
    const [selectedRevision] = await db.select()
      .from(revision)
      .where(and(eq(revision.appId, appId), eq(revision.commitSha, commitSha)));
    return selectedRevision;
  } catch (error) {
    throw new DBError('bad_request:database', 'Failed to get revision by commit SHA');
  }
}

export function getAppGitPath(userId: string, appId: string): string {
  return `${userId}/apps/${appId}`;
}
