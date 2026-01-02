import type { InferSelectModel } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  timestamp,
  uuid,
  text,
  boolean,
  integer,
} from 'drizzle-orm/pg-core';

export const user = pgTable('User', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),

  privyId: text('privyId').unique(),

  username: text('username').unique().notNull(),
  avatarUrl: text('avatarUrl'),

  createdAt: timestamp('createdAt', { mode: 'string' })
    .notNull()
    .defaultNow(),
});

export type DBUser = InferSelectModel<typeof user>;

export const app = pgTable('App', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  ownerId: uuid('ownerId').references(() => user.id).notNull(),

  title: text('title'),
  description: text('description'),

  activeRevisionId: uuid('activeRevisionId'),

  playersCount: integer('playersCount').notNull().default(0),
  remixesCount: integer('remixesCount').notNull().default(0),

  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

export type DBApp = InferSelectModel<typeof app>;

export const revision = pgTable('Revision', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  appId: uuid('appId').references(() => app.id).notNull(),

  commitSha: varchar('commitSha', { length: 40 }).notNull(),
  message: text('message'),

  isActive: boolean('isActive').notNull().default(false),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type DBAppRevision = InferSelectModel<typeof revision>;

export const chatMessage = pgTable('ChatMessage', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),

  appId: uuid('appId').references(() => app.id).notNull(),

  role: text('role').notNull(),
  content: text('content').notNull(),

  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type DBChatMessage = InferSelectModel<typeof chatMessage>;

export const comment = pgTable('Comment', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),

  appId: uuid('appId').references(() => app.id).notNull(),
  authorId: uuid('authorId').references(() => user.id).notNull(),

  content: text('content').notNull(),

  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type DBComment = InferSelectModel<typeof comment>;
