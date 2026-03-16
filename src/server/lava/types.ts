import type { LoadType } from './lava-rest-client';

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

export type TTrack = {
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

export type TPlaylist = {
  encoded: string;
  info: {
    name: string;
    selectedTrack: number;
  };
  tracks: TTrack[];
};

export type TTrackResult = {
  loadType: LoadType.TRACK;
  data: TTrack;
};

export type TPlaylistResult = {
  loadType: LoadType.PLAYLIST;
  data: TPlaylist;
};

export type TSearchResult = {
  loadType: LoadType.SEARCH;
  data: TTrack[];
};

export type TEmptyResult = {
  loadType: LoadType.EMPTY;
  data: Record<string, never>;
};

export type TErrorResult = {
  loadType: LoadType.ERROR;
  data: TLavaException;
};

export type TLavaException = {
  message: string;
  severity: 'common' | 'suspicious' | 'fault';
  cause: string;
};

export type TLoadTracksResponse =
  | TTrackResult
  | TPlaylistResult
  | TSearchResult
  | TEmptyResult
  | TErrorResult;

export type TPlayerState = {
  time: number;
  position: number;
  connected: boolean;
  ping: number;
};
