'use strict';
const { DiscordRest } = require('./api/discordRest');
const { requireEnv } = require('./core/env');
const { GatewayClient } = require('./core/gateway');
const { loadCommands } = require('./core/commandLoader');
const { handleInteraction } = require('./core/interactionHandler');
const { logInfo, logError } = require('./core/logger');
async function main() { const token = requireEnv('BOT_TOKEN'); const appId = requireEnv('CLIENT_ID'); const commands = loadCommands(); const rest = new DiscordRest(token); const commandPayloads = [...commands.values()].map(c => c.data); await rest.registerGlobalCommands(appId, commandPayloads); logInfo(`Registered ${commandPayloads.length} global application commands.`); const gateway = new GatewayClient(token, (event, data, latency) => { if (event === 'INTERACTION_CREATE') handleInteraction(rest, appId, commands, latency, data).catch(e => logError(e.stack || e.message)); }); gateway.connect(); }
main().catch(error => { logError(error.stack || error.message); process.exit(1); });
