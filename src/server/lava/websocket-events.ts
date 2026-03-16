import type { TLavaException, TPlayerState, TTrack } from './types';

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

export interface WebSocketPlayerMessage extends WebSocketMessage {
  guildId: string;
}

export interface WebSocketPlayerUpdateMessage extends WebSocketPlayerMessage {
  op: WebSocketOp.PLAYER_UPDATE;
  state: TPlayerState;
}

export interface WebSocketPlayerEvent extends WebSocketPlayerMessage {
  op: WebSocketOp.EVENT;
  type: WebSocketEventType;
  track: TTrack;
}

export interface WebSocketTrackStartEvent extends WebSocketPlayerEvent {
  type: WebSocketEventType.TRACK_START;
}

export interface WebSocketTrackEndEvent extends WebSocketPlayerEvent {
  type: WebSocketEventType.TRACK_END;
  reason: TrackEndReason;
}

export interface WebSocketTrackExceptionEvent extends WebSocketPlayerEvent {
  type: WebSocketEventType.TRACK_EXCEPTION;
  exception: TLavaException;
}

export interface WebSocketTrackStuckEvent extends WebSocketPlayerEvent {
  type: WebSocketEventType.TRACK_STUCK;
  thresholdMs: number;
}
