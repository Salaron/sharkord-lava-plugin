import { type PluginContext } from '@sharkord/plugin-sdk';
import { registerCommands } from './commands';
import { LavaNode } from './lava/lava-node';

export interface LavaPluginContext extends PluginContext {
  lavaNode: LavaNode;
}

let lavaNode: LavaNode | undefined;

const onLoad = async (context: LavaPluginContext) => {
  const host = process.env.LAVALINK_HOST;
  const port = process.env.LAVALINK_PORT;
  const password = process.env.LAVALINK_PASSWORD;
  const secure = process.env.LAVALINK_SECURE;

  context.log('Connecting to Lavalink node...');

  context.lavaNode = lavaNode = new LavaNode({
    host: 'localhost',
    port: 2333,
    password: 'youshallnotpass',
    secure: false
  });
  await context.lavaNode.connect();

  context.log('Connected to Lavalink node.');
  context.debug(`Session Id = ${context.lavaNode.sessionId}`);

  const pluginSettings = await context.settings.register([
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
    }
  ]);

  registerCommands(context, pluginSettings);

  context.log('Lavalink plugin loaded');
};

const onUnload = (context: PluginContext) => {
  lavaNode?.disconnect();

  context.log('Lavalink plugin unloaded');
};

export { onLoad, onUnload };
