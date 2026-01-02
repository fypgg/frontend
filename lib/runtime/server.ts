import { Server as IOServer } from "socket.io";
import type { Server as HttpServer } from "http";
import type { Json } from "./types";

type RuntimeServerOptions = {
  server?: HttpServer;
  port?: number;
  path?: string;
  corsOrigin?: string | string[];
};

const roomKey = (appId: string, roomId: string) => `app:${appId}:room:${roomId}`;

export const createRuntimeServer = (options: RuntimeServerOptions = {}) => {
  const io = new IOServer(options.server, {
    path: options.path,
    cors: { origin: options.corsOrigin ?? "*" },
  });

  if (!options.server) {
    io.listen(options.port ?? 4000);
  }

  const roomStates = new Map<string, Map<string, Record<string, Json>>>();

  const ensureRoom = (key: string) => {
    if (!roomStates.has(key)) roomStates.set(key, new Map());
    return roomStates.get(key)!;
  };

  io.on("connection", (socket) => {
    const appId = String(socket.handshake.query.appId ?? "");
    const roomId = String(socket.handshake.query.roomId ?? "");
    const userId = String(socket.handshake.query.userId ?? "");

    if (!appId || !roomId || !userId) {
      socket.disconnect();
      return;
    }

    const key = roomKey(appId, roomId);
    const players = ensureRoom(key);

    socket.join(key);

    const state = players.get(userId) ?? {};
    players.set(userId, state);

    io.to(key).emit("runtime:join", { playerId: userId, state });

    socket.on("runtime:event", (payload: any) => {
      const { event, body, playerId } = payload as {
        event: string;
        body: Json;
        playerId?: string;
      };
      io.to(key).emit("runtime:event", {
        event,
        body,
        playerId: playerId ?? userId,
      });
    });

    socket.on("runtime:state", (payload: any) => {
      const { playerId, state } = payload as {
        playerId?: string;
        state?: Record<string, Json>;
      };
      const id = playerId ?? userId;
      players.set(id, state ?? {});
      io.to(key).emit("runtime:state", { playerId: id, state: state ?? {} });
    });

    socket.on("disconnect", () => {
      players.delete(userId);
      io.to(key).emit("runtime:leave", { playerId: userId });
      if (players.size === 0) roomStates.delete(key);
    });
  });

  return {
    io,
    close: () => io.close(),
  };
};

