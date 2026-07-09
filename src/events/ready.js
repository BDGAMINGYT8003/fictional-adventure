const { Events, ActivityType } = require('discord.js');
const logger = require('../utils/logger');
module.exports = { name: Events.ClientReady, once: true, execute(client) { client.user.setActivity('/help', { type: ActivityType.Watching }); logger.success(`Ready as ${client.user.tag}; ${client.commands.size} commands loaded.`); } };
