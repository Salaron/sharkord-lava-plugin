import type {
  PlainTransport,
  Producer,
  TExternalStreamHandle
} from '@sharkord/plugin-sdk';
import type { LavaPluginContext } from '../server';

class VoiceConnection {
  public static rtpPacketType = 111;
  private static connections = new Map<number, VoiceConnection>();

  public voiceChannelId: number;
  public transport: PlainTransport | undefined;
  public audioProducer: Producer | undefined;
  public stream: TExternalStreamHandle | undefined;
  public rtpSsrc = Math.floor(Math.random() * 1e9);

  constructor(voiceChannelId: number) {
    this.voiceChannelId = voiceChannelId;
  }

  public static get(voiceChannelId: number): VoiceConnection | undefined {
    return VoiceConnection.connections.get(voiceChannelId);
  }

  public static async create(
    context: LavaPluginContext,
    voiceChannelId: number
  ) {
    const voiceConnection = new VoiceConnection(voiceChannelId);
    await voiceConnection.open(context);
    VoiceConnection.connections.set(voiceChannelId, voiceConnection);

    return voiceConnection;
  }

  public static remove(voiceChannelId: number) {
    if (VoiceConnection.connections.has(voiceChannelId)) {
      const voiceConnection = VoiceConnection.connections.get(voiceChannelId)!;
      voiceConnection.close();

      VoiceConnection.connections.delete(voiceChannelId);
    }
  }

  private async open(context: LavaPluginContext) {
    const router = context.actions.voice.getRouter(this.voiceChannelId);

    this.transport = await router.createPlainTransport({
      listenInfo: {
        ip: '0.0.0.0',
        announcedAddress: context.settings.getAnnouncedAddress(),
        portRange: {
          min: context.settings.getRtpMinPort(),
          max: context.settings.getRtpMaxPort()
        },
        protocol: 'udp'
      },
      rtcpMux: true,
      comedia: true,
      enableSrtp: false
    });

    this.audioProducer = await this.transport.produce({
      kind: 'audio',
      rtpParameters: {
        codecs: [
          {
            mimeType: 'audio/opus',
            payloadType: VoiceConnection.rtpPacketType,
            clockRate: 48000,
            channels: 2,
            parameters: {},
            rtcpFeedback: []
          }
        ],
        encodings: [{ ssrc: this.rtpSsrc }]
      }
    });

    this.stream = context.actions.voice.createStream({
      key: 'music',
      channelId: this.voiceChannelId,
      title: 'Music',
      producers: {
        audio: this.audioProducer
      }
    });
  }

  private close() {
    this.stream?.remove();

    try {
      this.audioProducer?.close();
    } catch {}

    try {
      this.transport?.close();
    } catch {}

    this.stream = undefined;
    this.audioProducer = undefined;
    this.transport = undefined;
  }
}

export { VoiceConnection };
