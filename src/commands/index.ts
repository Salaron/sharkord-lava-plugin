import type { PluginSettings } from '@sharkord/plugin-sdk';
import type { LavaPluginContext } from '../server';
import { registerPlayCommand } from './play';
import { registerQueueCommand } from './queue';
import { registerSearchCommand } from './search';
import { registerSkipCommand } from './skip';
import { registerStopCommand } from './stop';

const registerCommands = (
  context: LavaPluginContext,
  settings: PluginSettings
) => {
  registerPlayCommand(context);
  registerStopCommand(context);
  registerSkipCommand(context);
  registerQueueCommand(context);
  registerSearchCommand(context);
};

export { registerCommands };
