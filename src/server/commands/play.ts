import type { TInvokerContext } from '@sharkord/plugin-sdk';
import { LoadType } from '../lava/lava-rest-client';
import type { TTrack } from '../lava/types';
import { logDebug, type LavaPluginContext } from '../server';
import { VoiceConnection } from '../voice/voice-connection';

type TPlayCommandArgs = {
  query: string;
};

const execute = async (
  context: LavaPluginContext,
  invoker: TInvokerContext,
  args: TPlayCommandArgs
) => {
  const voiceChannelId = invoker.currentVoiceChannelId;
  if (!voiceChannelId) {
    throw new Error('You must be in a voice channel to use this command.');
  }

  if (!context.lavaNode.isConnected) {
    await context.lavaNode.connect();
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

  let voiceConnection = VoiceConnection.get(voiceChannelId);
  if (!voiceConnection) {
    voiceConnection = await VoiceConnection.create(context, voiceChannelId);

    voiceConnection.once('close', () => {
      void context.lavaNode.destroyPlayer(voiceChannelId);
    });
  }

  let player = context.lavaNode.getPlayer(voiceChannelId);
  if (!player) {
    player = context.lavaNode.createPlayer(voiceConnection);
    player.volume = Math.min(Math.max(context.settings.getVolume(), 0), 100);
    player.on('trackStart', (track) => {
      const title = track.info.title ?? 'Unknown track';
      voiceConnection.stream?.update({
        title: title,
        avatarUrl: track.info.artworkUrl
      });
      logDebug(`Set title to ${title} (channel id = ${voiceChannelId})`);
    });

    player.once('destroy', () => {
      VoiceConnection.remove(voiceChannelId);
    });
    player.once('queueEmpty', () => {
      VoiceConnection.remove(voiceChannelId);
    });
  }

  player.queue.push(...tracks);
  await player.play();

  if (player.queue.length === 0)
    return `Playing: ${player.currentTrack?.info.author} — ${player.currentTrack?.info.title}`;

  if (tracks.length === 1) {
    return `Added ${tracks[0]!.info.author} — ${tracks[0]!.info.title} to queue.`;
  }

  return `Added ${tracks.length} tracks to queue.`;
};

const registerPlayCommand = (context: LavaPluginContext) => {
  context.commands.register({
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
    executes: async (invoker, args: TPlayCommandArgs) =>
      await execute(context, invoker, args)
  });
};

export { registerPlayCommand };
