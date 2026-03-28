import {
  type PluginContext,
  type PluginSettings,
  type UnloadPluginContext
} from '@sharkord/plugin-sdk';
import pkg from '../../package.json';
import { registerCommands } from './commands';
import { LavaNode } from './lava/lava-node';
import { registerSettings } from './settings';

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
let isDebugLogEnabled = false;

const onLoad = async (context: LavaPluginContext) => {
  const settings = await registerSettings(context);

  context.settings.getRtpMinPort = () => +settings.get('rtp-min-port');
  context.settings.getRtpMaxPort = () => +settings.get('rtp-max-port');
  context.settings.getAnnouncedAddress = () =>
    settings.get('announced-address');
  context.settings.getVolume = () => +settings.get('volume');

  isDebugLogEnabled = !!settings.get('debug-logging');

  context.events.on('setting:set', (setting) => {
    if (setting.key.startsWith('lavalink')) {
      context.lavaNode?.disconnect();
      context.lavaNode = createLavaNode(settings);
    }

    if (setting.key === 'debug-logging') {
      isDebugLogEnabled = !!setting.value;
    }
  });

  context.lavaNode = createLavaNode(settings);

  const commandPrefix = settings.get('command-prefix');
  if (commandPrefix.length !== 0) {
    const registerCommand = context.commands.register;
    context.commands.register = (command) => {
      command.name = commandPrefix + command.name;
      return registerCommand(command);
    };
  }

  registerCommands(context);

  pluginContext = context;

  context.log('Lavalink plugin loaded');
};

const createLavaNode = (settings: PluginSettings) => {
  const lavaNode = new LavaNode({
    host: settings.get('lavalink-host'),
    port: +settings.get('lavalink-port'),
    password: settings.get('lavalink-password'),
    secure: !!settings.get('lavalink-secure'),
    getSearchPrefix: () => settings.get('search-prefix')
  });

  lavaNode.on('idle', () => {
    logInfo('No players left, disconnecting from Lavalink');
    void lavaNode.disconnect();
  });

  return lavaNode;
};

const onUnload = (context: UnloadPluginContext) => {
  pluginContext?.lavaNode.disconnect();
  pluginContext = undefined;

  context.logger.debug('Lavalink plugin unloaded');
};

const logDebug = (...messages: unknown[]) => {
  if (!isDebugLogEnabled) {
    return;
  }

  pluginContext?.logger.debug(...messages);
};

const logInfo = (...messages: unknown[]) => {
  pluginContext?.logger.log(...messages);
};

const logError = (...messages: unknown[]) => {
  pluginContext?.logger.error(...messages);
};

export { logDebug, logError, logInfo, onLoad, onUnload };
