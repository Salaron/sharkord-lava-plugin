import EventEmitter from 'events';
import type TypedEmitter from 'typed-emitter';
import { logDebug } from '../server';
import { VoiceConnection } from '../voice/voice-connection';
import type { LavaNode } from './lava-node';
import type { LavaRestClient } from './lava-rest-client';
import type { LavaPlayerEvents, Track, TRtpOptions } from './types';
import { TrackEndReason } from './websocket-events';

class LavaPlayer extends (EventEmitter as new () => TypedEmitter<LavaPlayerEvents>) {
  public queue: Track[] = [];
  public currentTrack: Track | undefined;
  public volume: number = 100;

  private node: LavaNode;
  private restClient: LavaRestClient;
  private rtpParams: TRtpOptions | undefined;
  private voiceChannelId: number;
  private retryCounter = 0;

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
      this.emit('trackStart', ev.track);
    });

    this.node.on('trackStuck', async (ev) => {
      this.retryCounter++;
      if (this.retryCounter >= 3) {
        await this.next();
      } else {
        await this.play(true);
      }
    });

    this.node.on('trackEnd', async (ev) => {
      if (ev.reason === TrackEndReason.FINISHED) {
        await this.next();
      }

      if (this.retryCounter >= 3) {
        await this.next();
      }

      if (ev.reason === TrackEndReason.LOAD_FAILED) {
        this.retryCounter++;
        await this.play(true);
      }
    });
  }

  public attachToVoiceConnection(voiceConnection: VoiceConnection) {
    if (!voiceConnection.transport)
      throw new Error('Cannot attach player to closed voice connection');

    this.rtpParams = {
      host: voiceConnection.transport.tuple.localIp,
      port: voiceConnection.transport.tuple.localPort,
      ssrc: voiceConnection.rtpSsrc,
      payloadType: voiceConnection.rtpPacketType
    };
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
      this.rtpParams
    );
  }

  public async next() {
    this.retryCounter = 0;
    this.currentTrack = this.queue.shift();

    await this.play(true);
  }

  public async destroy() {
    await this.restClient.destroyPlayer(
      this.node.sessionId!,
      this.voiceChannelId
    );
  }
}

export { LavaPlayer };
