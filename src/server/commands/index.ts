import type { LavaPluginContext } from '../server';
import { registerInsertCommand } from './insert';
import { registerPlayCommand } from './play';
import { registerQueueCommand } from './queue';
import { registerSkipCommand } from './skip';
import { registerStopCommand } from './stop';

const registerCommands = (context: LavaPluginContext) => {
  registerPlayCommand(context);
  registerStopCommand(context);
  registerSkipCommand(context);
  registerInsertCommand(context);
  registerQueueCommand(context);
};

export { registerCommands };
