import { LavalinkClientName } from '../server';
import type {
  TLavaNodeOptions,
  TLoadTracksResponse,
  TRtpOptions
} from './types';

export enum LoadType {
  TRACK = 'track',
  PLAYLIST = 'playlist',
  SEARCH = 'search',
  EMPTY = 'empty',
  ERROR = 'error'
}

type TRequestOptions = {
  queryParams?: Record<string, string>;
  body?: unknown;
};

class LavaRestClient {
  private options: TLavaNodeOptions;

  constructor(options: TLavaNodeOptions) {
    this.options = options;
  }

  public async loadTracks(identifier: string): Promise<TLoadTracksResponse> {
    const response = await this.sendRequest('GET', '/v4/loadtracks', {
      queryParams: { identifier }
    });

    const loadTracksResponse = (await response.json()) as TLoadTracksResponse;
    return loadTracksResponse;
  }

  public async updatePlayer(
    sessionId: string,
    voiceChannelId: number,
    encodedTrack: string,
    volume: number,
    replace: boolean,
    rtpOptions?: TRtpOptions
  ) {
    await this.sendRequest(
      'PATCH',
      `/v4/sessions/${sessionId}/players/${voiceChannelId}`,
      {
        queryParams: {
          noReplace: (!replace).toString()
        },
        body: {
          track: {
            encoded: encodedTrack
          },
          volume
        }
      }
    );

    await this.sendRequest(
      'PATCH',
      `/v4/sessions/${sessionId}/players/${voiceChannelId}/rtp`,
      {
        body: rtpOptions
      }
    );
  }

  public async destroyPlayer(sessionId: string, voiceChannelId: number) {
    await this.sendRequest(
      'DELETE',
      `/v4/sessions/${sessionId}/players/${voiceChannelId}`
    );
  }

  private async sendRequest(
    method: string,
    path: string,
    options?: TRequestOptions
  ): Promise<Response> {
    const url = new URL(
      `${this.options.secure ? 'https' : 'http'}://${this.options.host}:${this.options.port}`
    );

    url.pathname = path;
    url.search = new URLSearchParams(options?.queryParams).toString();

    const request: RequestInit = {
      method,
      headers: {
        Authorization: this.options.password,
        'Client-Name': LavalinkClientName,
        'Content-Type': 'application/json'
      }
    };

    if (options?.body) request.body = JSON.stringify(options.body);

    const response = await fetch(url, request);
    return response;
  }
}

export { LavaRestClient };
