import type { LavaException, PlayerState, Track } from './types';

export enum WebSocketOp {
  READY = 'ready',
  EVENT = 'event',
  STATS = 'stats',
  PLAYER_UPDATE = 'playerUpdate'
}

export enum WebSocketEventType {
  TRACK_START = 'TrackStartEvent',
  TRACK_END = 'TrackEndEvent',
  TRACK_EXCEPTION = 'TrackExceptionEvent',
  TRACK_STUCK = 'TrackStuckEvent'
}

export enum TrackEndReason {
  FINISHED = 'finished',
  LOAD_FAILED = 'loadFailed',
  STOPPED = 'stopped',
  REPLACED = 'replaced',
  CLEANUP = 'cleanup'
}

export interface WebSocketMessage {
  op: WebSocketOp;
}

export interface WebSocketReadyMessage extends WebSocketMessage {
  op: WebSocketOp.READY;
  resumed: boolean;
  sessionId: string;
}

export interface WebSocketStatsMessage {
  op: WebSocketOp.STATS;
}

export interface WebSocketEventMessage {
  op: WebSocketOp.EVENT;
  type: WebSocketEventType;
}

export interface WebSocketTrackStartEvent extends WebSocketEventMessage {
  type: WebSocketEventType.TRACK_START;
  guildId: string;
  track: Track;
}

export interface WebSocketTrackEndEvent extends WebSocketEventMessage {
  type: WebSocketEventType.TRACK_START;
  guildId: string;
  track: Track;
  reason: TrackEndReason;
}

export interface WebSocketTrackExceptionEvent extends WebSocketEventMessage {
  type: WebSocketEventType.TRACK_START;
  guildId: string;
  track: Track;
  exception: LavaException;
}

export interface WebSocketTrackStuckEvent extends WebSocketEventMessage {
  type: WebSocketEventType.TRACK_START;
  guildId: string;
  track: Track;
  thresholdMs: number;
}

export interface WebSocketPlayerUpdateEvent extends WebSocketMessage {
  op: WebSocketOp.PLAYER_UPDATE;
  guildId: string;
  state: PlayerState;
}
