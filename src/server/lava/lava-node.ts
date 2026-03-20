import EventEmitter from 'events';
import type TypedEmitter from 'typed-emitter';
import { LavalinkClientName, logDebug, logError, logInfo } from '../server';
import type { VoiceConnection } from '../voice/voice-connection';
import { LavaPlayer } from './lava-player';
import { LavaRestClient } from './lava-rest-client';
import type { TLavaNodeOptions, TLoadTracksResponse } from './types';
import {
  WebSocketOp,
  type WebSocketMessage,
  type WebSocketPlayerMessage,
  type WebSocketReadyMessage
} from './websocket-events';

type TLavaNodeEvents = {
  idle: () => void;
  disconnect: () => void;
};

class LavaNode extends (EventEmitter as new () => TypedEmitter<TLavaNodeEvents>) {
  private _sessionId: string | undefined;
  private _isConnected = false;
  private players = new Map<number, LavaPlayer>();
  private restClient: LavaRestClient;
  private options: TLavaNodeOptions;
  private websocket: WebSocket | undefined;
  private idleTimer: ReturnType<typeof setInterval> | undefined;

  constructor(options: TLavaNodeOptions) {
    super();
    this.options = options;
    this.restClient = new LavaRestClient(options);
  }

  public get sessionId(): string | undefined {
    return this._sessionId;
  }

  public get isConnected(): boolean | undefined {
    return this._isConnected;
  }

  public connect(): Promise<void> {
    if (this.isConnected) return Promise.resolve();

    logDebug(
      `Connecting to Lavalink ${this.options.host}:${this.options.port}`
    );

    const url = `${this.options.secure ? 'wss' : 'ws'}://${this.options.host}:${this.options.port}/v4/websocket`;

    return new Promise<void>((resolve, reject) => {
      const websocket = new WebSocket(url, {
        headers: {
          Authorization: this.options.password,
          'User-Id': '1',
          'Client-Name': LavalinkClientName
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
        logDebug('WebSocket message', ev.data);

        this.handleMessage(ev.data);

        if (!this.isConnected && this.sessionId) {
          this._isConnected = true;

          this.idleTimer = setInterval(() => {
            if (this.isConnected && this.players.size === 0) {
              this.emit('idle');
            }
          }, 60_000);

          logInfo('Connected to Lavalink');
          resolve();
        }
      };

      const onClose = () => {
        logInfo(`WebSocket closed`);
        cleanup();
        this.disconnect();
        if (!this._isConnected) {
          reject(new Error(`Unable to establish connection with Lavalink`));
        }
      };

      const onError = () => {
        logError(`WebSocket error`);
        cleanup();
        this.disconnect();
        if (!this._isConnected) {
          reject(new Error('WebSocket error while connecting to Lavalink'));
        }
      };

      websocket.addEventListener('open', onOpen);
      websocket.addEventListener('message', onMessage);
      websocket.addEventListener('close', onClose);
      websocket.addEventListener('error', onError);
    });
  }

  public async disconnect() {
    if (this.isConnected) {
      logInfo('Closing connection with Lavalink');

      this._isConnected = false;

      clearInterval(this.idleTimer);

      for (const [, player] of this.players) {
        await player.destroy();
      }

      this.players.clear();

      try {
        const websocket = this.websocket;
        this.websocket = undefined;
        websocket?.close();
      } catch (err) {
        logError('WebSocket close error', err);
      }

      this._sessionId = undefined;
      this.emit('disconnect');
    }
  }

  public getPlayer(voiceChannelId: number): LavaPlayer | undefined {
    const player = this.players.get(voiceChannelId);
    return player;
  }

  public createPlayer(voiceConnection: VoiceConnection): LavaPlayer {
    const voiceChannelId = voiceConnection.voiceChannelId;
    logDebug(`Creating player ${voiceChannelId}`);

    const player = new LavaPlayer(this, this.restClient, voiceConnection);
    player.once('destroy', () => this.players.delete(voiceChannelId));
    this.players.set(voiceChannelId, player);

    return player;
  }

  public async destroyPlayer(voiceChannelId: number) {
    const player = this.players.get(voiceChannelId);
    if (!player) {
      return;
    }

    logDebug(`Destroying player ${voiceChannelId}`);
    this.players.delete(voiceChannelId);
    await player.destroy();
  }

  public async search(query: string): Promise<TLoadTracksResponse> {
    return this.restClient.loadTracks(query);
  }

  private handleMessage(messageJson: string) {
    try {
      const message: WebSocketMessage = JSON.parse(messageJson);

      switch (message.op) {
        case WebSocketOp.READY:
          const readyMessage = message as WebSocketReadyMessage;
          this._sessionId = readyMessage.sessionId;
          break;

        case WebSocketOp.EVENT:
        case WebSocketOp.PLAYER_UPDATE:
          const playerMessage = message as WebSocketPlayerMessage;
          const player = this.players.get(+playerMessage.guildId);
          if (!player) {
            break;
          }

          player.handleMessage(playerMessage).catch(logError);
          break;
      }
    } catch (err) {
      logError('WebSocket message handle error', err);
    }
  }
}

export { LavaNode };
