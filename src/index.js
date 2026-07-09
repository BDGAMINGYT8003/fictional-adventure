const { Client, GatewayIntentBits } = require('discord.js');
const { validateEnv } = require('./config/env');
const { loadCommands } = require('./commands');
const { registerEvents } = require('./events');
const logger = require('./utils/logger');
async function main() {
  validateEnv();
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });
  client.commands = loadCommands();
  registerEvents(client);
  await client.login(process.env.BOT_TOKEN);
}
main().catch((error) => { logger.error(error.stack || error.message); process.exit(1); });
