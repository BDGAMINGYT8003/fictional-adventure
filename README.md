# Discord NSFW Bot

A modular Discord bot rebuilt to use the raw Discord HTTP API and Gateway directly. It does not use `discord.js` or any comprehensive Discord client wrapper.

## Run

```bash
npm install
BOT_TOKEN=... CLIENT_ID=... npm start
```

On startup, the bot connects to the Gateway and refreshes global slash commands automatically.
