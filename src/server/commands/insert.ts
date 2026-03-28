import type { TInvokerContext } from '@sharkord/plugin-sdk';
import type { LavaPluginContext } from '../server';

type TInsertCommandArgs = {
  query: string;
};

const execute = async (
  context: LavaPluginContext,
  invoker: TInvokerContext,
  args: TInsertCommandArgs
) => {
  const voiceChannelId = invoker.currentVoiceChannelId;
  if (!voiceChannelId) {
    throw new Error('You must be in a voice channel to use this command.');
  }

  const player = context.lavaNode.getPlayer(voiceChannelId);
  if (!player) {
    throw new Error('Nothing playing in current channel.');
  }

  const tracks = await context.lavaNode.search(args.query);
  if (tracks.length === 0) {
    return 'No results found';
  }

  player.queue.unshift(...tracks);

  if (tracks.length === 1) {
    const track = tracks[0]!;
    return `Added ${track.info.author} — ${track.info.title} to queue.`;
  }

  return `Added ${tracks.length} tracks to queue.`;
};

const registerInsertCommand = (context: LavaPluginContext) => {
  context.commands.register({
    name: 'insert',
    description:
      'Insert a track right after the one that is currently playing.',
    args: [
      {
        name: 'query',
        description: 'Playlist/track URL or search term.',
        type: 'string',
        required: true
      }
    ],
    execute: async (invoker, args: TInsertCommandArgs) =>
      await execute(context, invoker, args)
  });
};

export { registerInsertCommand };
