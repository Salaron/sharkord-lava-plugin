import type { LavaPluginContext } from './server';

const registerSettings = async (context: LavaPluginContext) => {
  return await context.settings.register([
    {
      key: 'lavalink-host',
      name: 'Lavalink Address',
      description: 'The hostname or IP address that Lavalink is listening on.',
      type: 'string',
      defaultValue: '127.0.0.1'
    },
    {
      key: 'lavalink-port',
      name: 'Lavalink Port',
      description: 'The port that Lavalink is listening on.',
      type: 'number',
      defaultValue: 2333
    },
    {
      key: 'lavalink-password',
      name: 'Lavalink Password',
      description: 'The password used to authenticate with Lavalink.',
      type: 'string',
      defaultValue: 'youshallnotpass'
    },
    {
      key: 'lavalink-secure',
      name: 'Lavalink Secure Connection',
      description: 'Whether an SSL/TLS connection to Lavalink should be used.',
      type: 'boolean',
      defaultValue: false
    },
    {
      key: 'announced-address',
      name: 'Announced address',
      description:
        'The address sent to Lavalink so it can stream audio to Sharkord.',
      type: 'string',
      defaultValue: '127.0.0.1'
    },
    {
      key: 'rtp-min-port',
      name: 'RTP min port',
      description: 'The start of the UDP port range for audio streaming.',
      type: 'number',
      defaultValue: 20000
    },
    {
      key: 'rtp-max-port',
      name: 'RTP max port',
      description: 'The end of the UDP port range for audio streaming.',
      type: 'number',
      defaultValue: 20010
    },
    {
      key: 'volume',
      name: 'Volume',
      description: 'The music volume level (0–100).',
      type: 'number',
      defaultValue: 50
    },
    {
      key: 'search-prefix',
      name: 'Search prefix',
      description:
        'A search prefix applied to search queries when no prefix specified (e.g. scsearch:).',
      type: 'string',
      defaultValue: ''
    },
    {
      key: 'command-prefix',
      name: 'Command prefix',
      description:
        'A custom prefix added to all plugin commands. A plugin reload is required for changes to take effect.',
      type: 'string',
      defaultValue: ''
    },
    {
      key: 'debug-logging',
      name: 'Debug',
      description: 'Whether debug (verbose) logging is enabled.',
      type: 'boolean',
      defaultValue: false
    }
  ]);
};

export { registerSettings };
