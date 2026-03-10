import type { LavaPluginContext } from '../server';
import { registerInsertCommand } from './insert';
import { registerPlayCommand } from './play';
import { registerQueueCommand } from './queue';
import { registerShuffleCommand } from './shuffle';
import { registerSkipCommand } from './skip';
import { registerStopCommand } from './stop';

const registerCommands = (context: LavaPluginContext) => {
  registerPlayCommand(context);
  registerStopCommand(context);
  registerSkipCommand(context);
  registerInsertCommand(context);
  registerQueueCommand(context);
  registerShuffleCommand(context);
};

export { registerCommands };
