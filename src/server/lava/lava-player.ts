import { VoiceConnection } from '../voice/voice-connection';
import type { LavaNode } from './lava-node';
import type { LavaRestClient, Track } from './lava-rest-client';
import type { TRtpOptions } from './types';

class LavaPlayer {
  public queue: Track[] = [];
  public currentTrack: Track | undefined;
  public volume: number = 100;

  private node: LavaNode;
  private restClient: LavaRestClient;
  private rtpParams: TRtpOptions | undefined;
  private voiceChannelId: number;

  constructor(
    lavaNode: LavaNode,
    restClient: LavaRestClient,
    voiceChannelId: number
  ) {
    this.node = lavaNode;
    this.restClient = restClient;
    this.voiceChannelId = voiceChannelId;
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

  public async play() {
    if (!this.currentTrack) {
      this.currentTrack = this.queue.shift();
    }

    if (this.currentTrack) {
      await this.restClient.updatePlayer(
        this.node.sessionId!,
        this.voiceChannelId,
        this.currentTrack.encoded,
        this.rtpParams
      );
    }
  }

  public async next() {
    this.currentTrack = this.queue.shift();

    await this.play();
  }

  public async destroy() {
    await this.restClient.destroyPlayer(
      this.node.sessionId!,
      this.voiceChannelId
    );
  }
}

export { LavaPlayer };
