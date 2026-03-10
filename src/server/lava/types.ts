import type { LoadType } from './lava-rest-client';
import type {
  WebSocketPlayerUpdateEvent,
  WebSocketTrackEndEvent,
  WebSocketTrackStartEvent,
  WebSocketTrackStuckEvent
} from './websocket-events';

export type TLavaNodeOptions = {
  host: string;
  port: number;
  password: string;
  secure: boolean;
};

export type TRtpOptions = {
  host: string;
  port: number;
  ssrc: number;
  payloadType: number;
};

export type Track = {
  encoded: string;
  info: {
    identifier: string;
    isSeekable: boolean;
    author: string;
    length: number;
    isStream: boolean;
    position: number;
    title: string;
    uri?: string;
    artworkUrl?: string;
    isrc?: string;
    sourceName: string;
  };
};

export type Playlist = {
  encoded: string;
  info: {
    name: string;
    selectedTrack: number;
  };
  tracks: Track[];
};

export type TrackResult = {
  loadType: LoadType.TRACK;
  data: Track;
};

export type PlaylistResult = {
  loadType: LoadType.PLAYLIST;
  data: Playlist;
};

export type SearchResult = {
  loadType: LoadType.SEARCH;
  data: Track[];
};

export type EmptyResult = {
  loadType: LoadType.EMPTY;
  data: Record<string, never>;
};

export type ErrorResult = {
  loadType: LoadType.ERROR;
  data: LavaException;
};

export type LavaException = {
  message: string;
  severity: 'common' | 'suspicious' | 'fault';
  cause: string;
};

export type LoadTracksResponse =
  | TrackResult
  | PlaylistResult
  | SearchResult
  | EmptyResult
  | ErrorResult;

export type PlayerState = {
  time: number;
  position: number;
  connected: boolean;
  ping: number;
};

export type LavaNodeEvents = {
  trackStart: (ev: WebSocketTrackStartEvent) => void;
  trackEnd: (ev: WebSocketTrackEndEvent) => void;
  trackStuck: (ev: WebSocketTrackStuckEvent) => void;
  playerUpdate: (ev: WebSocketPlayerUpdateEvent) => void;
};

export type LavaPlayerEvents = {
  trackStart: (track: Track) => void;
  queueEmpty: () => void;
};
