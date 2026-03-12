import type {
  PlainTransport,
  Producer,
  TExternalStreamHandle
} from '@sharkord/plugin-sdk';
import EventEmitter from 'events';
import type TypedEmitter from 'typed-emitter';
import type { TRtpOptions } from '../lava/types';
import type { LavaPluginContext } from '../server';

type VoiceConnectionEvents = {
  close: () => void;
};

class VoiceConnection extends (EventEmitter as new () => TypedEmitter<VoiceConnectionEvents>) {
  private static connections = new Map<number, VoiceConnection>();

  public voiceChannelId: number;
  public isOpened = false;
  public rtpOptions: TRtpOptions | undefined;
  public stream: TExternalStreamHandle | undefined;

  private transport: PlainTransport | undefined;
  private audioProducer: Producer | undefined;
  private rtpSsrc = Math.floor(Math.random() * 1e9);
  private rtpPacketType = 111;

  constructor(voiceChannelId: number) {
    super();
    this.voiceChannelId = voiceChannelId;
  }

  public static get(voiceChannelId: number): VoiceConnection | undefined {
    const voiceConnection = VoiceConnection.connections.get(voiceChannelId);
    if (voiceConnection?.isOpened) return voiceConnection;
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

  public async open(context: LavaPluginContext) {
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
    this.transport.on('@close', this.close);

    this.audioProducer = await this.transport.produce({
      kind: 'audio',
      rtpParameters: {
        codecs: [
          {
            mimeType: 'audio/opus',
            payloadType: this.rtpPacketType,
            clockRate: 48000,
            channels: 2,
            parameters: {},
            rtcpFeedback: []
          }
        ],
        encodings: [{ ssrc: this.rtpSsrc }]
      }
    });
    this.audioProducer.on('@close', this.close);

    this.stream = context.actions.voice.createStream({
      key: `lavalink-${this.voiceChannelId}`,
      channelId: this.voiceChannelId,
      title: 'Lavalink',
      producers: {
        audio: this.audioProducer
      }
    });

    this.isOpened = true;
    this.rtpOptions = {
      host: this.transport.tuple.localIp,
      port: this.transport.tuple.localPort,
      ssrc: this.rtpSsrc,
      payloadType: this.rtpPacketType
    };
  }

  public close = () => {
    this.audioProducer?.off('@close', this.close);
    this.transport?.off('@close', this.close);

    try {
      this.stream?.remove();
    } catch {}

    try {
      this.audioProducer?.close();
    } catch {}

    try {
      this.transport?.close();
    } catch {}

    this.stream = undefined;
    this.audioProducer = undefined;
    this.transport = undefined;
    this.rtpOptions = undefined;
    this.isOpened = false;

    VoiceConnection.connections.delete(this.voiceChannelId);

    this.emit('close');
  };
}

export { VoiceConnection };
