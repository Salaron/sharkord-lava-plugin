import type {
  CommandDefinition,
  TInvokerContext,
} from "@sharkord/plugin-sdk";
import { VoiceConnection } from "../voice/voice-connection";
import type { LavaPluginContext } from "../server";
import { LoadType, type Track } from "../lava/lava-rest-client";

type PlayCommandArgs = {
  query: string;
};

const execute = async (
  context: LavaPluginContext,
  invoker: TInvokerContext,
  args: PlayCommandArgs,
) => {
  const voiceChannelId = invoker.currentVoiceChannelId;
  if (!voiceChannelId)
    throw new Error("You must be in a voice channel to use this command.");

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
      return "No results found.";
    case LoadType.ERROR:
      context.error(searchResult.data);
      return `An error occured during search: ${searchResult.data.message}`;
  }

  context.debug(`Found ${tracks.length} results for query '${args.query}'`);

  let voiceConnection = VoiceConnection.get(voiceChannelId);
  if (!voiceConnection) {
    voiceConnection = await VoiceConnection.create(context, voiceChannelId);
  }

  let player = context.lavaNode.getPlayer(voiceChannelId);
  if (!player) {
    player = context.lavaNode.createPlayer(voiceChannelId);
  }
  player.attachToVoiceConnection(voiceConnection);

  player.queue.enqueue(tracks);
  await player.play();
};

const registerPlayCommand = (context: LavaPluginContext) => {
  const playCommand: CommandDefinition<PlayCommandArgs> = {
    name: "play",
    description: "Add a track or playlist to queue from a URL or search term.",
    args: [
      {
        name: "query",
        description: "Playlist/track URL or search term.",
        type: "string",
        required: true,
      },
    ],
    executes: (invoker, args) => execute(context, invoker, args),
  };

  context.commands.register(playCommand);
};

export { registerPlayCommand };
