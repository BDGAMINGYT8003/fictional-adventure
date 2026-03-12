const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');
const { logSuccess, logError, logInfo } = require('../utils/logger');

module.exports = async (client) => {
    const commandsPath = path.join(__dirname, '..', 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    const commandsArray = [];

    for (const file of commandFiles) {
        try {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);

            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
                commandsArray.push(command.data.toJSON());
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

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commandsArray },
        );

        logSuccess('Successfully reloaded application (/) commands.');
    } catch (error) {
        logError(`Failed to reload application (/) commands: ${error.message}`);
    }
};
