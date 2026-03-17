import EventEmitter from 'events';
import type TypedEmitter from 'typed-emitter';
import { logDebug, logError } from '../server';
import { VoiceConnection } from '../voice/voice-connection';
import type { LavaNode } from './lava-node';
import type { LavaRestClient } from './lava-rest-client';
import type { TPlayerState, TTrack } from './types';
import {
  TrackEndReason,
  WebSocketEventType,
  WebSocketOp,
  type WebSocketPlayerEvent,
  type WebSocketPlayerMessage,
  type WebSocketPlayerUpdateMessage,
  type WebSocketTrackEndEvent
} from './websocket-events';

type TLavaPlayerEvents = {
  trackStart: (track: TTrack) => void;
  trackEnd: (track: TTrack) => void;
  queueEmpty: () => void;
  destroy: () => void;
  update: (state: TPlayerState) => void;
};

class LavaPlayer extends (EventEmitter as new () => TypedEmitter<TLavaPlayerEvents>) {
  public readonly queue: TTrack[] = [];
  public currentTrack: TTrack | undefined;
  public volume: number = 100;

  private restClient: LavaRestClient;
  private voiceConnection: VoiceConnection;
  private voiceChannelId: number;
  private sessionId: string;

  constructor(
    lavaNode: LavaNode,
    restClient: LavaRestClient,
    voiceConnection: VoiceConnection
  ) {
    if (!lavaNode.sessionId) throw new Error('Session id is missing.');

    super();
    this.restClient = restClient;
    this.voiceConnection = voiceConnection;
    this.voiceChannelId = this.voiceConnection.voiceChannelId;
    this.sessionId = lavaNode.sessionId;
  }

  public async play(replace: boolean = false) {
    const track = this.currentTrack ?? this.queue.shift();
    if (!track) {
      this.emit('queueEmpty');
      return;
    }

    logDebug(
      `Playing ${track.info.title} (channel id = ${this.voiceChannelId}, queue length = ${this.queue.length}, replace = ${replace})`
    );

    await this.restClient.updatePlayer(
      this.sessionId,
      this.voiceChannelId,
      track.encoded,
      this.volume,
      replace,
      this.voiceConnection.rtpOptions
    );

    this.currentTrack = track;
  }

  public async next() {
    this.currentTrack = this.queue.shift();

    await this.play(true);
  }

  public async destroy() {
    try {
      await this.restClient.destroyPlayer(this.sessionId, this.voiceChannelId);
    } catch (err) {
      logError('Failed to destoy player', err);
    }

    this.currentTrack = undefined;
    this.queue.length = 0;

    this.emit('destroy');
  }

  public async handleMessage(message: WebSocketPlayerMessage) {
    switch (message.op) {
      case WebSocketOp.EVENT:
        await this.handleEvent(message as WebSocketPlayerEvent);
        break;

      case WebSocketOp.PLAYER_UPDATE:
        const updateMessage = message as WebSocketPlayerUpdateMessage;
        this.emit('update', updateMessage.state);
        break;
    }
  }

  private async handleEvent(ev: WebSocketPlayerEvent) {
    switch (ev.type) {
      case WebSocketEventType.TRACK_START:
        this.emit('trackStart', ev.track);
        break;

      case WebSocketEventType.TRACK_END:
        const trackEndEvent = ev as WebSocketTrackEndEvent;
        switch (trackEndEvent.reason) {
          case TrackEndReason.FINISHED:
          case TrackEndReason.LOAD_FAILED:
            await this.next();
            break;
        }

        this.emit('trackEnd', ev.track);
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

export { LavaPlayer };
