import type { TInvokerContext } from '@sharkord/plugin-sdk';
import type { LavaPluginContext } from '../server';

const execute = async (
  context: LavaPluginContext,
  invoker: TInvokerContext,
  args: void
) => {
  const voiceChannelId = invoker.currentVoiceChannelId;
  if (!voiceChannelId)
    throw new Error('You must be in a voice channel to use this command.');

  const player = context.lavaNode.getPlayer(voiceChannelId);
  if (!player || !player.queue.peak()) {
    return 'There is no tracks in queue';
  }

  const tracks = player.queue.items();
  let message = `Total tracks: ${tracks.length}\n\n`;

  for (const track of tracks) {
    message += `${track.info.title} - ${track.info.author}\n`;
  }

  return message;
};

const registerQueueCommand = (context: LavaPluginContext) => {
  context.commands.register({
    name: 'queue',
    description: 'Show tracks in queue.',
    args: [],
    executes: (invoker, args) => execute(context, invoker, args)
  });
};

export { registerQueueCommand };
