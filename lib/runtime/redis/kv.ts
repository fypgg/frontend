import Redis from "ioredis";
import { type Json, type KV } from "../types";

let client: Redis | null = null;

const ensureClient = (): Redis => {
  if (client) return client;
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error("REDIS_URL is not configured");
  }
  client = new Redis(url);
  return client;
};

const createPrefixedKv = (prefix: string, redis: Redis): KV => {
  const toKey = (key: string) => `${prefix}${key}`;
  const prefixLength = prefix.length;

  return {
    async get<T = Json>(key: string): Promise<T | null> {
      const raw = await redis.get(toKey(key));
      return raw ? (JSON.parse(raw) as T) : null;
    },
    async set(key: string, value: Json): Promise<void> {
      await redis.set(toKey(key), JSON.stringify(value));
    },
    async delete(key: string): Promise<void> {
      await redis.del(toKey(key));
    },
    async list<T = Json>(keyPrefix: string): Promise<Record<string, T>> {
      const matchPrefix = `${toKey(keyPrefix)}*`;
      const entries: Record<string, T> = {};
      let cursor = "0";

      do {
        const [next, keys] = await redis.scan(cursor, "MATCH", matchPrefix, "COUNT", 100);
        cursor = next;
        if (!keys.length) continue;

        const values = await redis.mget(keys);
        keys.forEach((fullKey, index) => {
          const raw = values[index];
          if (raw === null) return;
          const suffix = fullKey.slice(prefixLength);
          entries[suffix] = JSON.parse(raw) as T;
        });
      } while (cursor !== "0");

      return entries;
    },
    async update<T = Json>(
      key: string,
      fn: (cur: T | null) => T,
    ): Promise<void> {
      const namespaced = toKey(key);
      let attempts = 0;

      while (attempts < 3) {
        await redis.watch(namespaced);
        const currentRaw = await redis.get(namespaced);
        const current = currentRaw ? (JSON.parse(currentRaw) as T) : null;
        const next = fn(current);

        const tx = redis.multi();
        tx.set(namespaced, JSON.stringify(next));
        const result = await tx.exec();

        if (result) {
          await redis.unwatch();
          return;
        }

        attempts += 1;
      }

      throw new Error("KV update failed after retries");
    },
  };
};

export const createRedisKv = (appId: string, roomId: string) => {
  const redis = ensureClient();
  const basePrefix = `app:${appId}:`;

  return {
    kv: createPrefixedKv(`${basePrefix}room:${roomId}:`, redis),
    globalKv: createPrefixedKv(`${basePrefix}global:`, redis),
  };
};

