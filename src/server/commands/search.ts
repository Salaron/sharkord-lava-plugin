import type { CommandDefinition, TInvokerContext } from '@sharkord/plugin-sdk';
import type { LavaPluginContext } from '..';

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
    executes: (invoker, args) => execute(context, invoker, args)
  });
};

export { registerSearchCommand };
