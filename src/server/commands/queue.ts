import type { TInvokerContext } from '@sharkord/plugin-sdk';
import type { LavaPluginContext } from '../server';

const formatTrackLength = (milliseconds: number) => {
  const totalSeconds = Math.floor(milliseconds / 1000);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let timeParts = [hours, minutes, seconds];
  if (hours === 0) {
    timeParts = [minutes, seconds];
  }

  return timeParts.map((v) => String(v).padStart(2, '0')).join(':');
};

const execute = async (
  context: LavaPluginContext,
  invoker: TInvokerContext,
  args: void
) => {
  const voiceChannelId = invoker.currentVoiceChannelId;
  if (!voiceChannelId)
    throw new Error('You must be in a voice channel to use this command.');

  const player = context.lavaNode.getPlayer(voiceChannelId);
  if (!player || player.queue.length === 0) {
    return 'Queue is empty.';
  }

  const queueLengthMs = player.queue.reduce(
    (len, track) => (len += track.info.length),
    0
  );
  let message = `Tracks total: ${player.queue.length} [${formatTrackLength(queueLengthMs)}]\n\n`;

  let trackNumber = 1;
  for (const track of player.queue) {
    message += `${trackNumber}. ${track.info.title} [${formatTrackLength(track.info.length)}]\n`;
    trackNumber += 1;
  }

  // for some reason Sharkord cuts off message if it contains a quote
  return message.replace(/['"]/g, '`');
};

const registerQueueCommand = (context: LavaPluginContext) => {
  context.commands.register({
    name: 'queue',
    description: 'Show current queue.',
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

export { registerQueueCommand };
