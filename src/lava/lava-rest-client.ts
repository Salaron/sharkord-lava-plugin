import type { TLavaNodeOptions, TRtpOptions } from "./types";

export enum LoadType {
  TRACK = "track",
  PLAYLIST = "playlist",
  SEARCH = "search",
  EMPTY = "empty",
  ERROR = "error",
}

export interface Track {
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
}

export interface Playlist {
  encoded: string;
  info: {
    name: string;
    selectedTrack: number;
  };
  tracks: Track[];
}

export interface TrackResult {
  loadType: LoadType.TRACK;
  data: Track;
}

export interface PlaylistResult {
  loadType: LoadType.PLAYLIST;
  data: Playlist;
}

export interface SearchResult {
  loadType: LoadType.SEARCH;
  data: Track[];
}

export interface EmptyResult {
  loadType: LoadType.EMPTY;
  data: Record<string, never>;
}

export interface ErrorResult {
  loadType: LoadType.ERROR;
  data: {
    message: string;
    severity: "common" | "suspicious" | "fault";
    cause: string;
  };
}

export interface UpdatePlayerRequest {}

export type LoadTracksResponse =
  | TrackResult
  | PlaylistResult
  | SearchResult
  | EmptyResult
  | ErrorResult;

class LavaRestClient {
  private options: TLavaNodeOptions;

  constructor(options: TLavaNodeOptions) {
    this.options = options;
  }

  public async loadTracks(identifier: string): Promise<LoadTracksResponse> {
    const response = await this.sendRequest("GET", "/v4/loadtracks", {
      identifier,
    });

    const loadTracksResponse = (await response.json()) as LoadTracksResponse;
    return loadTracksResponse;
  }

  public async updatePlayer(
    sessionId: string,
    voiceChannelId: number,
    encodedTrack: string,
    rtp?: TRtpOptions,
  ) {
    await this.sendRequest(
      "PATCH",
      `/v4/sessions/${sessionId}/players/${voiceChannelId}`,
      {},
      {
        track: {
          encoded: encodedTrack,
        },
        rtp,
      },
    );
  }

  public async destroyPlayer(sessionId: string, voiceChannelId: number) {
    await this.sendRequest(
      "DELETE",
      `/v4/sessions/${sessionId}/players/${voiceChannelId}`,
    );
  }

  private async sendRequest(
    method: string,
    path: string,
    query?: Record<string, string>,
    body?: any,
  ): Promise<Response> {
    const url = new URL(
      `${this.options.secure ? "https" : "http"}://${this.options.host}:${this.options.port}`,
    );

    url.pathname = path;
    url.search = new URLSearchParams(query).toString();

    const opts: RequestInit = {
      method,
      body: JSON.stringify(body),
      headers: {
        Authorization: this.options.password,
        "Client-Name": "Sharkord-Lava-Plugin/0.0.1",
        "Content-Type": "application/json",
      },
    };

    const response = await fetch(url, opts);
    return response;
  }
}

export { LavaRestClient };
