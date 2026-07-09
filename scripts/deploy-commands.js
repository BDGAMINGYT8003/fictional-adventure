const { REST, Routes } = require('discord.js');
const { validateEnv } = require('../src/config/env');
const { commandPayloads } = require('../src/commands');
(async () => {
  validateEnv();
  const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
  const body = commandPayloads();
  await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body });
  console.log(`Deployed ${body.length} global application commands.`);
})().catch((error) => { console.error(error); process.exit(1); });
