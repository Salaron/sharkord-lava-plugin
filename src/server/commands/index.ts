import type { LavaPluginContext } from '../server';
import { registerPlayCommand } from './play';
import { registerQueueCommand } from './queue';
import { registerSkipCommand } from './skip';
import { registerStopCommand } from './stop';

const registerCommands = (context: LavaPluginContext) => {
  registerPlayCommand(context);
  registerStopCommand(context);
  registerSkipCommand(context);
  registerQueueCommand(context);
};

export { registerCommands };
