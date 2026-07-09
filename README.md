# Discord NSFW Media Bot

A Discord.js v14 bot that serves age-restricted media commands with individually declared command modules, provider handling, modern interaction contexts, and a separate command deployment workflow.

## Important Discord Notes

- Adult media commands are created with `nsfw: true`, matching Discord's age-restricted command guidance in `llms-full.txt`.
- Commands are written as individual modules and use modern `integration_types` and `contexts` instead of deprecated `dm_permission`.
- Slash commands are deployed with `npm run deploy:commands`; startup no longer mutates global command state.

## Setup

Required environment variables:

- `BOT_TOKEN` - Discord bot token.
- `CLIENT_ID` - Discord application ID.

Optional environment variables:

- `WAIFU_IM_KEY` - Enables Waifu.im provider calls.
- `WAIFU_PICS=false` - Disables Waifu.pics provider calls.
- `NEKOBOT_AUTH` - Optional NekoBot authorization header, kept out of source control.
- `API_TIMEOUT_MS` - Provider request timeout, default `15000`.
- `MAX_ATTACHMENT_BYTES` - Attachment buffer limit, default `8388608`.

## Commands

Run checks:

```bash
npm run check
npm test
```

Deploy slash commands:

```bash
npm run deploy:commands
```

Start the bot:

```bash
npm start
```

## Archive

The pre-rewrite repository was moved into `archive/original/`. `llms-full.txt` remains at the repository root as the active Discord documentation reference.
