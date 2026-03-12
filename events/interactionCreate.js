const { Events, EmbedBuilder } = require('discord.js');
const { logCommand, logError } = require('../utils/logger');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        if (!interaction.isChatInputCommand() && !interaction.isButton() && !interaction.isAutocomplete() && !interaction.isModalSubmit()) return;

        // Shared NSFW verification check logic
        const checkNSFW = (interact) => {
            if (!interact.guild) return true; // Bypass NSFW checks in DMs

            if (!interact.channel.nsfw) {
                const nsfwEmbed = new EmbedBuilder()
                    .setTitle('❌ ▸ Not NSFW channel')
                    .setDescription('This command can only be used in NSFW channels. Please use this command in a channel marked as NSFW.')
                    .setColor('Red')
                    .setFooter({
                        text: `${interact.user.username} | Today at ${new Date().toLocaleTimeString()}`,
                        iconURL: interact.user.displayAvatarURL()
                    });

                interact.reply({ embeds: [nsfwEmbed], ephemeral: true });
                return false;
            }
            return true;
        };

        if (interaction.isAutocomplete()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                if (command.autocomplete) {
                    await command.autocomplete(interaction);
                }
            } catch (error) {
                logError(`Error executing autocomplete for ${interaction.commandName}: ${error}`);
            }
        } else if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);

            if (!command) {
                logError(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            // Log command execution
            logCommand(
                interaction.commandName,
                interaction.user.username,
                interaction.user.id,
                interaction.guild?.name || 'DM',
                interaction.guild?.id || 'DM'
            );

            if (!checkNSFW(interaction)) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                logError(`Error executing command ${interaction.commandName}: ${error}`);
                try {
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
                    } else {
                        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                    }
                } catch (innerError) {
                    logError(`Failed to send error message to Discord: ${innerError.message}`);
                }
            }
        } else if (interaction.isButton()) {
            if (!checkNSFW(interaction)) return;

            const customId = interaction.customId;

            try {
                if (customId.startsWith('refresh_')) {
                    const parts = customId.split('_');
                    const commandName = parts[1];
                    const filterOption = parts.slice(2).join('_').replace(/_/g, ' ');

                    const command = client.commands.get(commandName);
                    if (command) await command.execute(interaction, true, filterOption);
                } else if (customId.startsWith('help_page_') || customId.startsWith('help_command_') || customId === 'help_search_modal_btn') {
                    const command = client.commands.get('help');
                    if (command) await command.execute(interaction, true);
                }
            } catch (error) {
                logError(`Error executing button action ${customId}: ${error}`);
                try {
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp({ content: 'There was an error executing this interaction!', ephemeral: true });
                    } else {
                        await interaction.reply({ content: 'There was an error executing this interaction!', ephemeral: true });
                    }
                } catch (innerError) {
                    logError(`Failed to send error message to Discord for button: ${innerError.message}`);
                }
            }
        } else if (interaction.isModalSubmit()) {
            if (!checkNSFW(interaction)) return;
            const customId = interaction.customId;
            try {
                if (customId === 'help_search_modal') {
                    const command = client.commands.get('help');
                    if (command) await command.execute(interaction, false, true);
                }
            } catch (error) {
                logError(`Error executing modal submit ${customId}: ${error}`);
                try {
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp({ content: 'There was an error executing this interaction!', ephemeral: true });
                    } else {
                        await interaction.reply({ content: 'There was an error executing this interaction!', ephemeral: true });
                    }
                } catch (innerError) {
                    logError(`Failed to send error message to Discord for modal: ${innerError.message}`);
                }
            }
        }
    },
};
