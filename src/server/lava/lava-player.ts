import EventEmitter from 'events';
import type TypedEmitter from 'typed-emitter';
import { logDebug, logError } from '../server';
import { VoiceConnection } from '../voice/voice-connection';
import type { LavaNode } from './lava-node';
import type { LavaRestClient } from './lava-rest-client';
import type { Track } from './types';
import {
  TrackEndReason,
  type WebSocketTrackEndEvent,
  type WebSocketTrackStartEvent
} from './websocket-events';

type LavaPlayerEvents = {
  close: () => void;
  trackStart: (track: Track) => void;
  queueEmpty: () => void;
};

class LavaPlayer extends (EventEmitter as new () => TypedEmitter<LavaPlayerEvents>) {
  private static MaxRetryAttempts = 3;

  public queue: Track[] = [];
  public currentTrack: Track | undefined;
  public volume: number = 100;

  private node: LavaNode;
  private restClient: LavaRestClient;
  private voiceConnection: VoiceConnection;
  private retryAttempts = 0;

  constructor(
    lavaNode: LavaNode,
    restClient: LavaRestClient,
    voiceConnection: VoiceConnection
  ) {
    super();
    this.node = lavaNode;
    this.restClient = restClient;
    this.voiceConnection = voiceConnection;

    this.node.on('trackStart', this.onTrackStart);
    this.node.on('trackEnd', this.onTrackEnd);
  }

  public async play(replace: boolean = false) {
    if (!this.voiceConnection.isOpened) {
      logDebug(
        `Voice connection ${this.voiceConnection.voiceChannelId} closed`
      );
      await this.destroy();
      return;
    }

    if (!this.currentTrack) {
      this.currentTrack = this.queue.shift();
    }

    logDebug(
      `Playing in voice channel ${this.voiceConnection.voiceChannelId} (queue length = ${this.queue.length})`,
      this.currentTrack
    );

    if (!this.currentTrack) {
      this.emit('queueEmpty');
      return;
    }

    await this.restClient.updatePlayer(
      this.node.sessionId!,
      this.voiceConnection.voiceChannelId,
      this.currentTrack.encoded,
      this.volume,
      replace,
      this.voiceConnection.rtpOptions
    );
  }

  public async next() {
    this.retryAttempts = 0;
    this.currentTrack = this.queue.shift();

    await this.play(true);
  }

  public async destroy() {
    logDebug(`Destroying player ${this.voiceConnection.voiceChannelId}`);

    this.node.off('trackStart', this.onTrackStart);
    this.node.off('trackEnd', this.onTrackEnd);

    try {
      await this.restClient.destroyPlayer(
        this.node.sessionId!,
        this.voiceConnection.voiceChannelId
      );
    } catch (err) {
      logError('Failed to destoy player', err);
    }

    this.currentTrack = undefined;
    this.queue = [];

    this.emit('close');
  }

  private onTrackStart = async (ev: WebSocketTrackStartEvent) => {
    if (ev.guildId !== this.voiceConnection.voiceChannelId.toString()) {
      return;
    }

    this.emit('trackStart', ev.track);
  };

  private onTrackEnd = async (ev: WebSocketTrackEndEvent) => {
    if (ev.guildId !== this.voiceConnection.voiceChannelId.toString()) {
      return;
    }

    if (ev.reason === TrackEndReason.FINISHED) {
      await this.next();
    }

    if (ev.reason === TrackEndReason.LOAD_FAILED) {
      this.retryAttempts++;
      if (this.retryAttempts >= LavaPlayer.MaxRetryAttempts) {
        await this.next();
        return;
      }

      await this.play(true);
    }
  };
}

export { LavaPlayer };
