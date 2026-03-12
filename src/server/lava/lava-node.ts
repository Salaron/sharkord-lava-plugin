import EventEmitter from 'events';
import type TypedEmitter from 'typed-emitter';
import { logDebug, logError, logInfo } from '../server';
import { LavaPlayer } from './lava-player';
import { LavaRestClient } from './lava-rest-client';
import type { LoadTracksResponse, TLavaNodeOptions } from './types';
import {
  WebSocketEventType,
  WebSocketOp,
  type WebSocketEventMessage,
  type WebSocketMessage,
  type WebSocketPlayerUpdateEvent,
  type WebSocketReadyMessage,
  type WebSocketTrackEndEvent,
  type WebSocketTrackStartEvent
} from './websocket-events';

type LavaNodeEvents = {
  trackStart: (ev: WebSocketTrackStartEvent) => void;
  trackEnd: (ev: WebSocketTrackEndEvent) => void;
  playerUpdate: (ev: WebSocketPlayerUpdateEvent) => void;
};

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

    logInfo(`Connecting to Lavalink ${this.options.host}:${this.options.port}`);

    const url = `${this.options.secure ? 'wss' : 'ws'}://${this.options.host}:${this.options.port}/v4/websocket`;

    return new Promise<void>((resolve, reject) => {
      const websocket = new WebSocket(url, {
        headers: {
          Authorization: this.options.password,
          'User-Id': '1',
          'Client-Name': 'Sharkord-Lava-Plugin/0.0.1'
        }
      });

      const cleanup = () => {
        websocket.removeEventListener('open', onOpen);
        websocket.removeEventListener('message', onMessage);
        websocket.removeEventListener('close', onClose);
        websocket.removeEventListener('error', onError);
      };

      const onOpen = () => {
        this.websocket = websocket;
      };

      const onMessage = (ev: MessageEvent) => {
        this.handleMessage(ev.data);

        if (!this.isConnected && this.sessionId) {
          this.isConnected = true;

          logInfo('Connected to Lavalink');
          logDebug(`Session Id = ${this.sessionId}`);

          resolve();
        }
      };

      const onClose = () => {
        cleanup();
        this.disconnect();
        if (!this.isConnected) {
          reject(new Error(`Unable to establish connection with Lavalink`));
        }
      };

      const onError = () => {
        cleanup();
        this.disconnect();
        if (!this.isConnected) {
          reject(new Error('WebSocket error while connecting to Lavalink'));
        }
      };

      websocket.addEventListener('open', onOpen);
      websocket.addEventListener('message', onMessage);
      websocket.addEventListener('close', onClose);
      websocket.addEventListener('error', onError);
    });
  }

  public disconnect = async () => {
    if (this.websocket) {
      logInfo('Closing connection with Lavalink');

      for (const player of this.players.values()) {
        try {
          await player.destroy();
        } catch {}
      }

      try {
        this.websocket.close();
      } catch {}

      this.players.clear();
      this.websocket = undefined;
      this.isConnected = false;
      this.sessionId = undefined;
    }
  };

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
    return this.restClient.loadTracks(query);
  }

  private handleMessage(messageJson: string) {
    try {
      const message: WebSocketMessage = JSON.parse(messageJson);
      logDebug('WebSocket message', message);

      switch (message.op) {
        case WebSocketOp.READY:
          const readyMessage = message as WebSocketReadyMessage;
          this.sessionId = readyMessage.sessionId;
          break;

        case WebSocketOp.EVENT:
          this.handleEvent(message as WebSocketEventMessage);
          break;

        case WebSocketOp.STATS:
          break;

        case WebSocketOp.PLAYER_UPDATE:
          this.emit('playerUpdate', message as WebSocketPlayerUpdateEvent);
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
        logError('Track stuck');
        break;

      case WebSocketEventType.TRACK_EXCEPTION:
        logError('Track exception');
        break;
    }
  }
}

export { LavaNode };
