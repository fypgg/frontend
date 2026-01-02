import { createSocketRuntime } from "./client";
import { createRedisKv } from "./redis/kv";
import { type AppRuntime } from "./types";

export const createRuntime = async (
  appId: string,
  roomId: string,
  userId: string,
): Promise<AppRuntime> => {
  const { kv, globalKv } = createRedisKv(appId, roomId);
  const { socket, players } = createSocketRuntime({ appId, roomId, userId });

  return { appId, roomId, kv, globalKv, socket, players };
};

export { createRuntimeServer } from "./server";

export type {
  AppRuntime,
  AppSocket,
  KV,
  Json,
  Player,
  Players,
} from "./types";


