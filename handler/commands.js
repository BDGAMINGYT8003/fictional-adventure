const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');
const { logSuccess, logError, logInfo } = require('../utils/logger');

module.exports = async (client) => {
    const commandsPath = path.join(__dirname, '..', 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    const globalCommandsArray = [];
    const guildCommandsArray = [];

    const experimentalCommands = ['paizuri', 'yuri'];
    const TEST_GUILD_ID = '1301072065880915991';

    for (const file of commandFiles) {
        try {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);

            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);

                if (experimentalCommands.includes(command.data.name)) {
                    guildCommandsArray.push(command.data.toJSON());
                } else {
                    globalCommandsArray.push(command.data.toJSON());
                }

                logSuccess(`Loaded Command: ${file}`);
            } else {
                logError(`The command at ${filePath} is missing a required "data" or "execute" property.`);
            }
        } catch (error) {
            logError(`Failed to load command ${file}: ${error.message}`);
        }
    }

    const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

    try {
        logInfo('Started refreshing application (/) commands.');

        // Register Global Commands
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: globalCommandsArray },
        );
        logSuccess(`Successfully reloaded ${globalCommandsArray.length} global application (/) commands.`);

        // Register Guild Commands (Experimental/Testing isolation)
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, TEST_GUILD_ID),
            { body: guildCommandsArray },
        );
        logSuccess(`Successfully reloaded ${guildCommandsArray.length} guild-specific application (/) commands.`);

    } catch (error) {
        logError(`Failed to reload application (/) commands: ${error.message}`);
    }
};
