import type { TInvokerContext } from '@sharkord/plugin-sdk';
import { LoadType } from '../lava/lava-rest-client';
import type { TTrack } from '../lava/types';
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

  const searchResult = await context.lavaNode.search(args.query);

  const tracks: TTrack[] = [];
  switch (searchResult.loadType) {
    case LoadType.PLAYLIST:
      tracks.push(...searchResult.data.tracks);
      break;
    case LoadType.SEARCH:
      tracks.push(searchResult.data[0]!);
      break;
    case LoadType.TRACK:
      tracks.push(searchResult.data);
      break;
    case LoadType.EMPTY:
      return 'No results found.';
    case LoadType.ERROR:
      throw new Error(`An error occured: ${searchResult.data.message}`);
  }

  player.queue.unshift(...tracks);

  if (tracks.length === 1) {
    return `Added ${tracks[0]!.info.author} — ${tracks[0]!.info.title} to queue.`;
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
    executes: async (invoker, args: TInsertCommandArgs) =>
      await execute(context, invoker, args)
  });
};

export { registerInsertCommand };
