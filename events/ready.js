const { Events } = require('discord.js');
const { logHeader } = require('../utils/logger');
const commandHandler = require('../handler/commands');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        logHeader(client.user.tag);

        // Register slash commands upon successful login
        await commandHandler(client);
    },
};
