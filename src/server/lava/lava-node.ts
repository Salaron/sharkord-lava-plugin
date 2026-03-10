import EventEmitter from 'events';
import type TypedEmitter from 'typed-emitter';
import { logDebug, logError } from '../server';
import { LavaPlayer } from './lava-player';
import { LavaRestClient } from './lava-rest-client';
import type {
  LavaNodeEvents,
  LoadTracksResponse,
  TLavaNodeOptions
} from './types';
import {
  WebSocketEventType,
  WebSocketOp,
  type WebSocketEventMessage,
  type WebSocketMessage,
  type WebSocketPlayerUpdateEvent,
  type WebSocketReadyMessage,
  type WebSocketTrackEndEvent,
  type WebSocketTrackStartEvent,
  type WebSocketTrackStuckEvent
} from './websocket-events';

class LavaNode extends (EventEmitter as new () => TypedEmitter<LavaNodeEvents>) {
  public isConnected = false;
  public sessionId: string | undefined;

  private players = new Map<number, LavaPlayer>();
  private restClient: LavaRestClient;
  private options: TLavaNodeOptions;
  private websocket: WebSocket | undefined;

  constructor(options: TLavaNodeOptions) {
    super();
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
      const message: WebSocketMessage = JSON.parse(messageJson);

      switch (message.op) {
        case WebSocketOp.READY:
          const readyMessage = message as WebSocketReadyMessage;
          this.sessionId = readyMessage.sessionId;
          break;

        case WebSocketOp.EVENT:
          const eventMessage = message as WebSocketEventMessage;
          this.handleEvent(eventMessage);
          break;

        case WebSocketOp.STATS:
          break;

        case WebSocketOp.PLAYER_UPDATE:
          const playerUpdateMessage = message as WebSocketPlayerUpdateEvent;
          this.emit('playerUpdate', playerUpdateMessage);
          break;

        default:
          logDebug('WebSocket unhandled message', message);
      }
    } catch (err) {
      logError('WebSocket message handle error', err);
    }
  }

  private handleEvent(event: WebSocketEventMessage) {
    switch (event.type) {
      case WebSocketEventType.TRACK_START:
        this.emit('trackStart', event as WebSocketTrackStartEvent);
        break;

      case WebSocketEventType.TRACK_END:
        this.emit('trackEnd', event as WebSocketTrackEndEvent);
        break;

      case WebSocketEventType.TRACK_STUCK:
        this.emit('trackStuck', event as WebSocketTrackStuckEvent);
        break;
    }
  }
}

export { LavaNode };
