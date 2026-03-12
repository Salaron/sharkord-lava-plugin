import {
  type PluginContext,
  type UnloadPluginContext
} from '@sharkord/plugin-sdk';
import { registerCommands } from './commands';
import { LavaNode } from './lava/lava-node';

export interface LavaPluginContext extends Omit<PluginContext, 'settings'> {
  lavaNode: LavaNode;
  settings: PluginContext['settings'] & {
    getRtpMinPort: () => number;
    getRtpMaxPort: () => number;
    getAnnouncedAddress: () => string;
    getVolume: () => number;
  };
}

let lavaNode: LavaNode | undefined;
let pluginContext: LavaPluginContext | undefined;

const onLoad = async (context: LavaPluginContext) => {
  const host = process.env.LAVALINK_HOST ?? 'localhost';
  const port = process.env.LAVALINK_PORT ?? 2333;
  const password = process.env.LAVALINK_PASSWORD ?? 'youshallnotpass';
  const secure = process.env.LAVALINK_SECURE === '1';

  try {
    context.lavaNode = lavaNode = new LavaNode({
      host: host,
      port: +port,
      password: password,
      secure: secure
    });
    await context.lavaNode.connect();
  } catch (err) {
    context.error(err);
  }

  const settings = await context.settings.register([
    {
      key: 'rtp-min-port',
      name: 'RTP min port',
      description: 'Start of UDP port range for audio streaming.',
      type: 'number',
      defaultValue: 20000
    },
    {
      key: 'rtp-max-port',
      name: 'RTP max port',
      description: 'End of UDP port range for audio streaming.',
      type: 'number',
      defaultValue: 20010
    },
    {
      key: 'announced-address',
      name: 'Announced address',
      description:
        'Address sent to Lavalink so it can stream audio to Sharkord. Use this if Lavalink is hosted on another machine or network.',
      type: 'string',
      defaultValue: '127.0.0.1'
    },
    {
      key: 'volume',
      name: 'Volume',
      description: 'Default volume level (0-100).',
      type: 'number',
      defaultValue: 50
    }
  ]);

  context.settings.getRtpMinPort = () =>
    settings.get('rtp-min-port') as unknown as number;
  context.settings.getRtpMaxPort = () =>
    settings.get('rtp-max-port') as unknown as number;
  context.settings.getAnnouncedAddress = () =>
    settings.get('announced-address');
  context.settings.getVolume = () =>
    settings.get('volume') as unknown as number;

  registerCommands(context);

  pluginContext = context;

  context.log('Lavalink plugin loaded');
};

const onUnload = (context: UnloadPluginContext) => {
  lavaNode?.disconnect();

  context.log('Lavalink plugin unloaded');
};

const logDebug = (...messages: unknown[]) => {
  pluginContext?.debug(...messages);
};

const logInfo = (...messages: unknown[]) => {
  pluginContext?.log(...messages);
};

const logError = (...messages: unknown[]) => {
  pluginContext?.error(...messages);
};

export { logDebug, logError, logInfo, onLoad, onUnload };
