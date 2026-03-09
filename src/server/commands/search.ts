import type { CommandDefinition, TInvokerContext } from '@sharkord/plugin-sdk';
import type { LavaPluginContext } from '../server';

type SearchCommandArgs = {
  query: string;
};

const execute = async (
  context: LavaPluginContext,
  invoker: TInvokerContext,
  args: SearchCommandArgs
) => {
  const searchResult = context.lavaNode.search(args.query);
};

const registerSearchCommand = (context: LavaPluginContext) => {
  context.commands.register(<CommandDefinition<SearchCommandArgs>>{
    name: 'search',
    description: 'Search tracks.',
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
        await execute(context, invoker, args);
      } catch (err) {
        context.error(err);
        throw err;
      }
    }
  });
};

export { registerSearchCommand };
