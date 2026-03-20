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

let pluginContext: LavaPluginContext | undefined;

const onLoad = async (context: LavaPluginContext) => {
  const settings = await context.settings.register([
    {
      key: 'lavalink-host',
      name: 'Lavalink Address',
      description:
        'The hostname or IP address that Lavalink is listening on. A plugin reload is required for changes to take effect.',
      type: 'string',
      defaultValue: '127.0.0.1'
    },
    {
      key: 'lavalink-port',
      name: 'Lavalink Port',
      description:
        'The port that Lavalink is listening on. A plugin reload is required for changes to take effect.',
      type: 'number',
      defaultValue: 2333
    },
    {
      key: 'lavalink-password',
      name: 'Lavalink Password',
      description:
        'The password used to authenticate with Lavalink. A plugin reload is required for changes to take effect.',
      type: 'string',
      defaultValue: 'youshallnotpass'
    },
    {
      key: 'lavalink-secure',
      name: 'Lavalink Secure Connection',
      description:
        'Whether an SSL/TLS connection to Lavalink should be used. A plugin reload is required for changes to take effect.',
      type: 'boolean',
      defaultValue: false
    },
    {
      key: 'announced-address',
      name: 'Announced address',
      description:
        'The address sent to Lavalink so it can stream audio to Sharkord.',
      type: 'string',
      defaultValue: '127.0.0.1'
    },
    {
      key: 'rtp-min-port',
      name: 'RTP min port',
      description: 'The start of the UDP port range for audio streaming.',
      type: 'number',
      defaultValue: 20000
    },
    {
      key: 'rtp-max-port',
      name: 'RTP max port',
      description: 'The end of the UDP port range for audio streaming.',
      type: 'number',
      defaultValue: 20010
    },
    {
      key: 'volume',
      name: 'Volume',
      description: 'The music volume level (0–100).',
      type: 'number',
      defaultValue: 50
    },
    {
      key: 'command-prefix',
      name: 'Command prefix',
      description:
        'A custom prefix added to all commands. A plugin reload is required for changes to take effect.',
      type: 'string',
      defaultValue: ''
    },
    {
      key: 'debug-logging',
      name: 'Debug',
      description:
        'Whether debug (verbose) logging is enabled. A plugin reload is required for changes to take effect.',
      type: 'boolean',
      defaultValue: false
    }
  ]);

  context.settings.getRtpMinPort = () => +settings.get('rtp-min-port');
  context.settings.getRtpMaxPort = () => +settings.get('rtp-max-port');
  context.settings.getAnnouncedAddress = () =>
    settings.get('announced-address');
  context.settings.getVolume = () => +settings.get('volume');

  const enableDebugLogging = settings.get('debug-logging');
  if (!enableDebugLogging) {
    context.debug = () => {};
  }

  context.lavaNode = new LavaNode({
    host: settings.get('lavalink-host'),
    port: +settings.get('lavalink-port'),
    password: settings.get('lavalink-password'),
    secure: !!settings.get('lavalink-secure')
  });

  context.lavaNode.on('idle', () => {
    context.log('No players left, disconnecting from Lavalink');
    void context.lavaNode.disconnect();
  });

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
  pluginContext?.lavaNode.disconnect();
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
