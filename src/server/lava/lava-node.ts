import { logDebug, logError } from '../server';
import { LavaPlayer } from './lava-player';
import { LavaRestClient, type LoadTracksResponse } from './lava-rest-client';
import type { TLavaNodeOptions } from './types';
import {
  WebSocketOp,
  type WebSocketEvent,
  type WebSocketReadyEvent
} from './websocket-events';

class LavaNode {
  public isConnected = false;
  public sessionId: string | undefined;

  private players = new Map<number, LavaPlayer>();
  private restClient: LavaRestClient;
  private options: TLavaNodeOptions;
  private websocket: WebSocket | undefined;

  constructor(options: TLavaNodeOptions) {
    this.options = options;
    this.restClient = new LavaRestClient(options);
  }

  public connect(): Promise<void> {
    if (this.isConnected) return Promise.resolve();

    const url = `${this.options.secure ? 'wss' : 'ws'}://${this.options.host}:${this.options.port}/v4/websocket`;

    return new Promise((resolve, reject) => {
      const websocket = new WebSocket(url, {
        headers: {
          Authorization: this.options.password,
          'User-Id': '1',
          'Client-Name': 'Sharkord-Lava-Plugin/0.0.1'
        }
      });

      const onopen = () => {
        this.isConnected = true;
        this.websocket = websocket;
        websocket.removeEventListener('close', onclose);

        websocket.addEventListener('message', (ev) => {
          this.handleMessage(ev.data);
          if (this.sessionId) resolve();
        });
      };

      const onclose = () => {
        this.isConnected = false;
        this.websocket = undefined;
        websocket.removeEventListener('open', onopen);
        reject();
      };

      websocket.addEventListener('open', onopen);
      websocket.addEventListener('close', onclose);
    });
  }

  public disconnect() {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = undefined;
      this.isConnected = false;
      this.sessionId = undefined;
    }
  }

  public getPlayer(voiceChannelId: number): LavaPlayer | undefined {
    return this.players.get(voiceChannelId);
  }

  public createPlayer(voiceChannelId: number): LavaPlayer {
    const player = new LavaPlayer(this, this.restClient, voiceChannelId);
    this.players.set(voiceChannelId, player);
    return player;
  }

  public async destroyPlayer(voiceChannelId: number) {
    const player = this.players.get(voiceChannelId);
    if (!player) return;

    await player.destroy();
    this.players.delete(voiceChannelId);
  }

  public async search(query: string): Promise<LoadTracksResponse> {
    const tracks = await this.restClient.loadTracks(query);
    return tracks;
  }

  private handleMessage(messageJson: string) {
    try {
      const event: WebSocketEvent = JSON.parse(messageJson);

      switch (event.op) {
        case WebSocketOp.READY:
          const readyEvent = event as WebSocketReadyEvent;
          this.sessionId = readyEvent.sessionId;
          break;

        default:
          logDebug('WebSocket unhandled message', event);
      }
    } catch (err) {
      logError('WebSocket message handle error', err);
    }
  }
}

export { LavaNode };
