# Sharkord Lava Plugin

A plugin to bring a Discord-like music bot to
[Sharkord](https://github.com/Sharkord/sharkord), powered by
[Lavalink](https://github.com/lavalink-devs/Lavalink) with the
[RTP plugin](https://github.com/Salaron/lavalink-rtp-plugin).

> [!WARNING]
> This plugin is not compatible with Lavalink instances without RTP
> support!

## Features

- Play music in voice channels from various sources supported by Lavalink
  (YouTube, Spotify, SoundCloud, and more)
- Support for remote Lavalink nodes
- Queue management

## Supported commands

- `/play`: Add a track or playlist to the queue by URL or
  [search term](https://lavalink.dev/api/rest.html#track-loading)
- `/insert`: Add a track/playlist to beginning of the queue
- `/skip`: Skip the currently playing track
- `/stop`: Stop music in current voice channel
- `/queue`: Show queue
- `/shuffle`: Shuffle queue

## Installation

0. Set up [Lavalink](https://lavalink.dev/getting-started) and install the
   [RTP plugin](https://github.com/Salaron/lavalink-rtp-plugin)
1. Download the latest release from the
   [Releases](https://github.com/Salaron/sharkord-lava-plugin/releases) page
2. Extract archive to Sharkord plugins directory (`data/plugins`)
3. Enable and configure the plugin in Sharkord settings

## Configuration

### Lavalink address

The hostname or IP address that Lavalink is listening on. Defaults to
`127.0.0.1`.

A plugin reload is required for changes to take effect.

### Lavalink port

The port Lavalink is listening on. Defaults to `2333`.

A plugin reload is required for changes to take effect.

### Lavalink password

The Lavalink password. Defaults to `youshallnotpass`.

A plugin reload is required for changes to take effect.

### Lavalink secure connection

Whether an SSL/TLS connection to Lavalink should be used. By default, a
non-secure connection is used.

A plugin reload is required for changes to take effect.

### Announced address

The announced address is sent to Lavalink so it can stream audio to Sharkord.

If your Lavalink instance is running on another machine or network, use the
public address of the server where Sharkord is hosted.

### RTP ports

RTP min port and RTP max port determine UDP port range used for listening to
incoming audio streams from Lavalink. This range defaults to `20000–20010` (11
players).

Increase this range if you want more concurrent players in Sharkord server. Make
sure to open these ports in your firewall or Docker configuration.

### Volume

The music volume level. Defaults to `50`.

### Search prefix

By default, adding a track via search requires specifying a search prefix (e.g.
`scsearch:` for SoundCloud).

You can configure a default search prefix to automatically apply to search
queries when none is specified.

### Command prefix

If you use plugins that conflict with this plugin commands, you can add a custom
prefix. So, with prefix `l` command `/play` becomes `/lplay`, the same applies
to other commands.

A plugin reload is required for changes to take effect.

### Debug

Whether debug (verbose) logging is enabled.

A plugin reload is required for changes to take effect.

## Troubleshooting

**Q: The plugin joins the voice channel, but no music is playing.**  
A: Make sure the RTP UDP port range is open in your firewall or Docker
configuration on the Sharkord server.

**Q: The search query in the `/play` command is truncated (e.g.
`/play Imagine Dragons` is recognized as `/play Imagine`).**  
A: Sharkord treats words as separate arguments. Wrap the query in quotes:
`/play "Imagine Dragons"`.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file
for details.
