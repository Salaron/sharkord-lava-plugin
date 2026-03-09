import { type PluginContext } from '@sharkord/plugin-sdk';
import { registerCommands } from './commands';
import { LavaNode } from './lava/lava-node';

export interface LavaPluginContext extends Omit<PluginContext, 'settings'> {
  lavaNode: LavaNode;
  settings: PluginContext['settings'] & {
    rtpMinPort: () => number;
    rtpMaxPort: () => number;
    announcedAddress: () => string;
  };
}

let lavaNode: LavaNode | undefined;
let pluginContext: LavaPluginContext | undefined;

const onLoad = async (context: LavaPluginContext) => {
  pluginContext = context;

  const host = process.env.LAVALINK_HOST ?? 'localhost';
  const port = process.env.LAVALINK_PORT ?? 2333;
  const password = process.env.LAVALINK_PASSWORD ?? 'youshallnotpass';
  const secure = process.env.LAVALINK_SECURE === '1';

  context.log(`Connecting to Lavalink ${host}:${port}...`);

  try {
    pluginContext.lavaNode = lavaNode = new LavaNode({
      host: host,
      port: +port,
      password: password,
      secure: secure
    });
    await pluginContext.lavaNode.connect();

    context.log('Connected to Lavalink.');
    context.debug(`Session Id = ${pluginContext.lavaNode.sessionId}`);
  } catch (err) {
    context.error('Failed to connect to Lavalink', err);
  }

  const settings = await context.settings.register([
    {
      key: 'rtp-min-port',
      name: 'RTP min port',
      description: '',
      type: 'number',
      defaultValue: 20000
    },
    {
      key: 'rtp-max-port',
      name: 'RTP max port',
      description: '',
      type: 'number',
      defaultValue: 20010
    },
    {
      key: 'announced-address',
      name: 'Public address',
      description:
        'Public address of the server. Required if Lavalink hosted on different machine.',
      type: 'string',
      defaultValue: '127.0.0.1'
    }
  ]);

  context.settings.rtpMaxPort = () =>
    settings.get('rtp-min-port') as unknown as number;
  context.settings.rtpMaxPort = () =>
    settings.get('rtp-max-port') as unknown as number;
  context.settings.announcedAddress = () => settings.get('announced-address');

  registerCommands(pluginContext);

  context.log('Lavalink plugin loaded');
};

const onUnload = (context: PluginContext) => {
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
