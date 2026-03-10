import type { TInvokerContext } from '@sharkord/plugin-sdk';
import type { LavaPluginContext } from '../server';

const execute = async (
  context: LavaPluginContext,
  invoker: TInvokerContext,
  args: void
) => {
  const voiceChannelId = invoker.currentVoiceChannelId;
  if (!voiceChannelId) {
    throw new Error('You must be in a voice channel to use this command.');
  }

  const player = context.lavaNode.getPlayer(voiceChannelId);
  if (!player) {
    throw new Error('Nothing playing in current channel.');
  }

  const queue = player.queue;
  for (let i = queue.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [queue[i], queue[j]] = [queue[j]!, queue[i]!];
  }
};

const registerShuffleCommand = (context: LavaPluginContext) => {
  context.commands.register({
    name: 'shuffle',
    description: 'Shuffle queue.',
    args: [],
    executes: async (invoker, args) => {
      try {
        return await execute(context, invoker, args);
      } catch (err) {
        context.error(err);
        throw err;
      }
    }
  });
};

export { registerShuffleCommand };
