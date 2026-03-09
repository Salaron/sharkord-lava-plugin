import type { PluginSettings } from "@sharkord/plugin-sdk";
import { registerPlayCommand } from "./play";
import type { LavaPluginContext } from "../server";
import { registerQueueCommand } from "./queue";
import { registerSkipCommand } from "./skip";
import { registerStopCommand } from "./stop";
import { registerSearchCommand } from "./search";

const registerCommands = (
  context: LavaPluginContext,
  settings: PluginSettings,
) => {
  registerPlayCommand(context);
  registerStopCommand(context);
  registerSkipCommand(context);
  registerQueueCommand(context);
  registerSearchCommand(context);
};

export { registerCommands };
