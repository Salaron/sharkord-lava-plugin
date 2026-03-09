import type { CommandDefinition, TInvokerContext } from '@sharkord/plugin-sdk';
import { LoadType } from '../lava/lava-rest-client';
import type { Track } from '../lava/types';
import type { LavaPluginContext } from '../server';
import { VoiceConnection } from '../voice/voice-connection';

type PlayCommandArgs = {
  query: string;
};

const execute = async (
  context: LavaPluginContext,
  invoker: TInvokerContext,
  args: PlayCommandArgs
) => {
  const voiceChannelId = invoker.currentVoiceChannelId;
  if (!voiceChannelId)
    return 'You must be in a voice channel to use this command.';

  if (!context.lavaNode.isConnected) {
    await context.lavaNode.connect();
  }

  const searchResult = await context.lavaNode.search(args.query);

  const tracks: Track[] = [];
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

  context.debug(`Found ${tracks.length} results for query '${args.query}'`);

  let voiceConnection = VoiceConnection.get(voiceChannelId);
  if (!voiceConnection) {
    voiceConnection = await VoiceConnection.create(context, voiceChannelId);
  }

  let player = context.lavaNode.getPlayer(voiceChannelId);
  if (!player) {
    player = context.lavaNode.createPlayer(voiceChannelId);
    player.volume = Math.min(Math.max(context.settings.getVolume(), 0), 100);
  }
  player.attachToVoiceConnection(voiceConnection);

  player.queue.push(...tracks);
  await player.play();

  voiceConnection.stream?.update({
    title: player.currentTrack?.info.title ?? 'Unknown track',
    avatarUrl: player.currentTrack?.info.artworkUrl
  });

  if (player.queue.length === 0)
    return `Playing: ${player.currentTrack?.info.author} — ${player.currentTrack?.info.title}`;

  if (tracks.length === 1) {
    return `Added ${tracks[0]!.info.author} — ${tracks[0]!.info.title} to queue.`;
  }

  return `Added ${tracks.length} tracks to queue.`;
};

const registerPlayCommand = (context: LavaPluginContext) => {
  const playCommand: CommandDefinition<PlayCommandArgs> = {
    name: 'play',
    description: 'Add a track or playlist to queue from a URL or search term.',
    args: [
      {
        name: 'query',
        description: 'Playlist/track URL or search term.',
        type: 'string',
        required: true
      }
    ],
    executes: async (invoker, args) => {
      try {
        return await execute(context, invoker, args);
      } catch (err) {
        context.error(err);
        throw err;
      }
    }
  };

  context.commands.register(playCommand);
};

export { registerPlayCommand };
