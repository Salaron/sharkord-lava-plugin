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

  await player.next();
};

const registerSkipCommand = (context: LavaPluginContext) => {
  context.commands.register({
    name: 'skip',
    description: 'Skip the currently playing track.',
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

export { registerSkipCommand };
