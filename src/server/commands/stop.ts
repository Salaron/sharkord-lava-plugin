import type { TInvokerContext } from '@sharkord/plugin-sdk';
import type { LavaPluginContext } from '../server';
import { VoiceConnection } from '../voice/voice-connection';

const execute = async (
  context: LavaPluginContext,
  invoker: TInvokerContext,
  args: void
) => {
  const voiceChannelId = invoker.currentVoiceChannelId;
  if (!voiceChannelId)
    return 'You must be in a voice channel to use this command.';

  try {
    await context.lavaNode.destroyPlayer(voiceChannelId);
  } catch (err) {
    context.error('Failed to destroy Lavalink player', err);
  }

  VoiceConnection.remove(voiceChannelId);
};

const registerStopCommand = (context: LavaPluginContext) => {
  context.commands.register({
    name: 'stop',
    description: 'Stop music.',
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

export { registerStopCommand };
