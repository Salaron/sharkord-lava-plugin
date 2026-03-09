import type { TInvokerContext } from '@sharkord/plugin-sdk';
import type { LavaPluginContext } from '../server';

const execute = async (
  context: LavaPluginContext,
  invoker: TInvokerContext,
  args: void
) => {
  const voiceChannelId = invoker.currentVoiceChannelId;
  if (!voiceChannelId)
    return 'You must be in a voice channel to use this command.';

  const player = context.lavaNode.getPlayer(voiceChannelId);
  if (!player || player.queue.length === 0) {
    return 'There is no tracks in queue';
  }

  let message = `Total tracks: ${player.queue.length}\n\n`;

  for (const track of player.queue) {
    message += `${track.info.title} - ${track.info.author}\n`;
  }

  return message;
};

const registerQueueCommand = (context: LavaPluginContext) => {
  context.commands.register({
    name: 'queue',
    description: 'Show tracks in queue.',
    args: [],
    executes: async (invoker, args) => {
      try {
        await execute(context, invoker, args);
      } catch (err) {
        context.error(err);
        throw err;
      }
    }
  });
};

export { registerQueueCommand };
