import { io } from "socket.io-client";
import { type AppSocket, type Json, type Player, type Players } from "./types";

const createPresence = (publish: (player: Player) => void) => {
  const players = new Map<string, Player>();

  const upsert = (id: string, state: Record<string, Json> = {}) => {
    const existing = players.get(id);
    if (existing) {
      existing.state = { ...existing.state, ...state };
      return existing;
    }

    const player: Player = {
      id,
      state,
      setState(partial) {
        player.state = { ...player.state, ...partial };
        publish(player);
      },
    };

    players.set(id, player);
    return player;
  };

  const remove = (id: string) => {
    const player = players.get(id);
    players.delete(id);
    return player;
  };

  const view: Players = {
    get(id: string) {
      return players.get(id);
    },
    list() {
      return Array.from(players.values());
    },
    count() {
      return players.size;
    },
  };

  return { players: view, upsert, remove };
};

type SocketRuntimeOptions = {
  appId: string;
  roomId: string;
  userId: string;
  endpoint?: string;
};

export const createSocketRuntime = ({
  appId,
  roomId,
  userId,
  endpoint,
}: SocketRuntimeOptions) => {
  const url =
    endpoint ??
    process.env.NEXT_PUBLIC_SOCKET_URL ??
    process.env.SOCKET_URL;

  if (!url) {
    throw new Error("Socket endpoint is not configured");
  }

  const socketClient = io(url, {
    transports: ["websocket"],
    query: { appId, roomId, userId },
  });

  const joinHandlers = new Set<(player: Player) => void>();
  const leaveHandlers = new Set<(player: Player) => void>();
  const messageHandlers = new Map<
    string,
    Set<(payload: Json, player: Player) => void>
  >();

  const presence = createPresence((player) => {
    socketClient.emit("runtime:state", {
      appId,
      roomId,
      playerId: player.id,
      state: player.state,
    });
  });

  const self = presence.upsert(userId, {});
  socketClient.emit("runtime:join", {
    appId,
    roomId,
    playerId: userId,
    state: self.state,
  });

  socketClient.on("runtime:join", (payload: any) => {
    const { playerId, state } = payload as {
      playerId: string;
      state?: Record<string, Json>;
    };
    const player = presence.upsert(playerId, state ?? {});
    joinHandlers.forEach((handler) => handler(player));
  });

  socketClient.on("runtime:leave", (payload: any) => {
    const { playerId } = payload as { playerId: string };
    const player = presence.remove(playerId);
    if (!player) return;
    leaveHandlers.forEach((handler) => handler(player));
  });

  socketClient.on("runtime:state", (payload: any) => {
    const { playerId, state } = payload as {
      playerId: string;
      state?: Record<string, Json>;
    };
    presence.upsert(playerId, state ?? {});
  });

  socketClient.on("runtime:event", (payload: any) => {
    const { event, body, playerId } = payload as {
      event: string;
      body: Json;
      playerId: string;
    };
    const player = presence.upsert(playerId);
    const handlers = messageHandlers.get(event);
    handlers?.forEach((handler) => handler(body, player));
  });

  const socket: AppSocket = {
    on(event, handler) {
      if (!messageHandlers.has(event)) {
        messageHandlers.set(event, new Set());
      }
      messageHandlers.get(event)!.add(handler);
    },
    broadcast(event, payload) {
      socketClient.emit("runtime:event", {
        appId,
        roomId,
        event,
        body: payload,
        playerId: userId,
      });
    },
    onJoin(handler) {
      joinHandlers.add(handler);
    },
    onLeave(handler) {
      leaveHandlers.add(handler);
    },
  };

  return {
    socket,
    players: presence.players,
  };
};

