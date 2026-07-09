# Discord NSFW Raw API Bot

This rewrite removes `discord.js` and talks directly to Discord API v10 and the Gateway. The implementation keeps the archived project's NSFW providers and commands while using raw REST interaction callbacks, webhook edits, command registration payloads, and a hand-written Gateway client.

## Setup

Required environment variables:

- `BOT_TOKEN` - Discord bot token.
- `CLIENT_ID` - Discord application/client ID.
- `WAIFU_IM_KEY` - Optional Waifu.im API key.
- `WAIFU_PICS=false` - Optional flag to disable waifu.pics providers.

## Commands

```bash
npm install
npm run register
npm start
```

`llms-full.txt` remains in the repository as the Discord documentation reference. The previous implementation remains available through Git history; see `archive/README.md` for non-binary archive instructions.
