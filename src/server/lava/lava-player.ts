import EventEmitter from 'events';
import type TypedEmitter from 'typed-emitter';
import { logDebug, logError } from '../server';
import { VoiceConnection } from '../voice/voice-connection';
import type { LavaNode } from './lava-node';
import type { LavaRestClient } from './lava-rest-client';
import type { Track, TRtpOptions } from './types';
import { TrackEndReason } from './websocket-events';

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
  private rtpOptions: TRtpOptions | undefined;
  private voiceChannelId: number;
  private retryAttempts = 0;

  constructor(
    lavaNode: LavaNode,
    restClient: LavaRestClient,
    voiceChannelId: number
  ) {
    super();
    this.node = lavaNode;
    this.restClient = restClient;
    this.voiceChannelId = voiceChannelId;

    this.node.on('trackStart', (ev) => {
      if (ev.guildId !== this.voiceChannelId.toString()) {
        return;
      }

      this.emit('trackStart', ev.track);
    });

    this.node.on('trackEnd', async (ev) => {
      if (ev.guildId !== this.voiceChannelId.toString()) {
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
    });
  }

  public attachToVoiceConnection(voiceConnection: VoiceConnection) {
    if (!voiceConnection.isOpened)
      throw new Error('Cannot attach player to closed voice connection');

    this.rtpOptions = voiceConnection.rtpOptions;
  }

  public async play(replace: boolean = false) {
    if (!this.currentTrack) {
      this.currentTrack = this.queue.shift();
    }

    logDebug(
      `Playing in voice channel ${this.voiceChannelId} (queue length = ${this.queue.length})`,
      this.currentTrack
    );

    if (!this.currentTrack) {
      this.emit('queueEmpty');
      return;
    }

    await this.restClient.updatePlayer(
      this.node.sessionId!,
      this.voiceChannelId,
      this.currentTrack.encoded,
      this.volume,
      replace,
      this.rtpOptions
    );
  }

  public async next() {
    this.retryAttempts = 0;
    this.currentTrack = this.queue.shift();

    await this.play(true);
  }

  public async destroy() {
    logDebug(`Destroying player ${this.voiceChannelId}`);

    try {
      await this.restClient.destroyPlayer(
        this.node.sessionId!,
        this.voiceChannelId
      );
    } catch (err) {
      logError('Failed to destoy player', err);
    }
    this.emit('close');
  }
}

export { LavaPlayer };
