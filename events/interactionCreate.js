const { Events, EmbedBuilder } = require('discord.js');
const { logCommand, logError } = require('../utils/logger');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        if (!interaction.isChatInputCommand() && !interaction.isButton()) return;

        // Shared NSFW verification check logic
        const checkNSFW = (interact) => {
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

        if (interaction.isChatInputCommand()) {
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
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                }
            }
        } else if (interaction.isButton()) {
            if (!checkNSFW(interaction)) return;

            const customId = interaction.customId;

            try {
                if (customId.startsWith('refresh_')) {
                    const commandName = customId.split('_')[1];
                    const command = client.commands.get(commandName);
                    if (command) await command.execute(interaction, true);
                }
            } catch (error) {
                logError(`Error executing button action ${customId}: ${error}`);
            }
        }
    },
};
