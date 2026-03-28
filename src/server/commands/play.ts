import type { TInvokerContext } from '@sharkord/plugin-sdk';
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

  const tracks = await context.lavaNode.search(args.query);
  if (tracks.length === 0) {
    return 'No results found';
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

  try {
    await player.play();
  } catch (err) {
    void player.destroy();
    throw err;
  }

  if (player.queue.length === 0) {
    const track = player.currentTrack!;
    return `Playing: ${track.info.author} — ${track.info.title}`;
  }

  if (tracks.length === 1) {
    const track = tracks[0]!;
    return `Added ${track.info.author} — ${track.info.title} to queue.`;
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
    execute: async (invoker, args: TPlayCommandArgs) =>
      await execute(context, invoker, args)
  });
};

export { registerPlayCommand };
