import type { TInvokerContext } from "@sharkord/plugin-sdk";
import type { LavaPluginContext } from "../server";

const execute = async (
  context: LavaPluginContext,
  invoker: TInvokerContext,
  args: void,
) => {
  const voiceChannelId = invoker.currentVoiceChannelId;
  if (!voiceChannelId)
    throw new Error("You must be in a voice channel to use this command.");

  const player = context.lavaNode.getPlayer(voiceChannelId);
  if (!player || !player.queue.peak()) {
    return "There is no tracks in queue";
  }

  await player.skip();
};

const registerSkipCommand = (context: LavaPluginContext) => {
  context.commands.register({
    name: "skip",
    description: "Skip current playing track.",
    args: [],
    executes: (invoker, args) => execute(context, invoker, args),
  });
};

export { registerSkipCommand };
