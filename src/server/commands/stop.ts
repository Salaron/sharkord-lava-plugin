import type { TInvokerContext } from '@sharkord/plugin-sdk';
import type { LavaPluginContext } from '..';
import { VoiceConnection } from '../voice/voice-connection';

const execute = async (
  context: LavaPluginContext,
  invoker: TInvokerContext,
  args: void
) => {
  const voiceChannelId = invoker.currentVoiceChannelId;
  if (!voiceChannelId)
    throw new Error('You must be in a voice channel to use this command.');

  VoiceConnection.remove(voiceChannelId);
  await context.lavaNode.destroyPlayer(voiceChannelId);
};

const registerStopCommand = (context: LavaPluginContext) => {
  context.commands.register({
    name: 'stop',
    description: 'Stop music.',
    args: [],
    executes: (invoker, args) => execute(context, invoker, args)
  });
};

export { registerStopCommand };
