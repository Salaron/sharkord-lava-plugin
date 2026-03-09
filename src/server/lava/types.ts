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
  data: {
    message: string;
    severity: 'common' | 'suspicious' | 'fault';
    cause: string;
  };
};

export type LoadTracksResponse =
  | TrackResult
  | PlaylistResult
  | SearchResult
  | EmptyResult
  | ErrorResult;
