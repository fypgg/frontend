export type Json =
  | null
  | boolean
  | number
  | string
  | Json[]
  | { [key: string]: Json };

/**
 * Key/value storage for game state.
 *
 * - `kv` is room-scoped: isolated per (appId, roomId).
 * - `globalKv` is app-scoped: shared across all rooms of the app.
 *
 * Values are JSON-serializable.
 */
export interface KV {
  /**
   * Reads a key. Returns null if the key does not exist.
   */
  get<T = Json>(key: string): Promise<T | null>;

  /**
   * Writes a key.
   * Room-scoped KV may be configured with TTL on writes (implementation detail).
   */
  set(key: string, value: Json): Promise<void>;

  /**
   * Deletes a key.
   */
  delete(key: string): Promise<void>;

  /**
   * Lists all keys under a prefix and returns a map of suffixKey -> value.
   * Example: list("score:") may return { "score:u1": 10, "score:u2": 3 }.
   */
  list<T = Json>(prefix: string): Promise<Record<string, T>>;

  /**
   * Read-modify-write helper.
   *
   * Server runtimes can implement atomic update; client runtimes may implement it
   * as best-effort (get -> fn -> set) depending on transport.
   */
  update<T = Json>(key: string, fn: (cur: T | null) => T): Promise<void>;
}

/**
 * A connected player in a room.
 *
 * Player state is ephemeral and exists only while connected.
 * Use `kv` for state that must survive reconnects.
 */
export interface Player {
  id: string;
  state: Record<string, Json>;
  setState(partial: Record<string, Json>): void;
}

/**
 * Snapshot of current room presence as seen by this runtime instance.
 */
export interface Players {
  get(id: string): Player | undefined;
  list(): Player[];
  count(): number;
}

/**
 * Realtime events scoped to a room.
 *
 * - `broadcast` sends an event to all clients in the room (including sender).
 * - `on` subscribes to events broadcast into the room.
 * - `onJoin` / `onLeave` subscribe to presence lifecycle.
 */
export interface AppSocket {
  on(event: string, handler: (payload: Json, player: Player) => void): void;
  broadcast(event: string, payload: Json): void;
  onJoin(handler: (player: Player) => void): void;
  onLeave(handler: (player: Player) => void): void;
}

/**
 * Runtime bound to a specific (appId, roomId).
 *
 * - `kv` is room-scoped (session state).
 * - `globalKv` is app-scoped (shared state).
 * - `socket` and `players` are room-scoped (presence + realtime).
 */
export interface  AppRuntime {
  appId: string;
  roomId: string;
  kv: KV;
  globalKv: KV;
  socket: AppSocket;
  players: Players;
}
