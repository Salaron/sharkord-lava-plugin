import {
  type PluginContext,
  type UnloadPluginContext
} from '@sharkord/plugin-sdk';
import pkg from '../../package.json';
import { registerCommands } from './commands';
import { LavaNode } from './lava/lava-node';

export const LavalinkClientName = `${pkg.name}/${pkg.version}`;

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
  const host = process.env.LAVALINK_HOST ?? '127.0.0.1';
  const port = process.env.LAVALINK_PORT ?? 2333;
  const password = process.env.LAVALINK_PASSWORD ?? 'youshallnotpass';
  const secure = process.env.LAVALINK_SECURE === '1';

  context.lavaNode = lavaNode = new LavaNode({
    host: host,
    port: +port,
    password: password,
    secure: secure
  });

  lavaNode.on('idle', () => {
    context.log('No players left, disconnecting from Lavalink');
    void lavaNode?.disconnect();
  });

  const settings = await context.settings.register([
    {
      key: 'announced-address',
      name: 'Announced address',
      description:
        'Address sent to Lavalink so it can stream audio to Sharkord. Use this if Lavalink is hosted on another machine or network.',
      type: 'string',
      defaultValue: '127.0.0.1'
    },
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
      key: 'volume',
      name: 'Volume',
      description: 'Default volume level (0-100).',
      type: 'number',
      defaultValue: 50
    },
    {
      key: 'command-prefix',
      name: 'Command prefix',
      description:
        'A custom prefix added to all commands. Use this if there are conflicts with other plugins (requires plugin reload).',
      type: 'string',
      defaultValue: ''
    },
    {
      key: 'debug',
      name: 'Debug',
      description: 'Enable debug logging (requires plugin reload).',
      type: 'boolean',
      defaultValue: false
    }
  ]);

  context.settings.getRtpMinPort = () => +settings.get('rtp-min-port');
  context.settings.getRtpMaxPort = () => +settings.get('rtp-max-port');
  context.settings.getAnnouncedAddress = () =>
    settings.get('announced-address');
  context.settings.getVolume = () => +settings.get('volume');

  const enableDebugLogging = settings.get('debug');
  if (!enableDebugLogging) {
    context.debug = () => {};
  }

  const prefix = settings.get('command-prefix');
  if (prefix.length !== 0) {
    const registerCommand = context.commands.register;
    context.commands.register = (command) => {
      command.name = prefix + command.name;
      return registerCommand(command);
    };
  }

  registerCommands(context);

  pluginContext = context;

  context.log('Lavalink plugin loaded');
};

const onUnload = (context: UnloadPluginContext) => {
  lavaNode?.disconnect();
  lavaNode = undefined;
  pluginContext = undefined;

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
