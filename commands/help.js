const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Directory of all available commands and detailed information.')
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2)
        .addStringOption(option =>
            option.setName('command')
                .setDescription('Select a specific command for detailed information.')
                .setRequired(false)
                .setAutocomplete(true)
        ),

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        const choices = Array.from(interaction.client.commands.keys());

        const filtered = choices.filter(choice => choice.startsWith(focusedValue)).slice(0, 25);
        await interaction.respond(
            filtered.map(choice => ({ name: choice, value: choice }))
        );
    },

    async execute(interaction, isButton = false) {
        if (!isButton) {
            await interaction.deferReply();
        } else {
            await interaction.deferUpdate();
        }

        const client = interaction.client;
        const commands = Array.from(client.commands.values());

        let targetCommandName = null;
        let page = 1;

        if (isButton) {
            // customId format: help_page_X or help_command_NAME
            const parts = interaction.customId.split('_');
            if (parts[1] === 'page') {
                page = parseInt(parts[2], 10);
            } else if (parts[1] === 'command') {
                targetCommandName = parts.slice(2).join('_');
            }
        } else {
            targetCommandName = interaction.options.getString('command');
        }

        // Mode B: Specific Command Detail
        if (targetCommandName) {
            const command = client.commands.get(targetCommandName);

            if (!command) {
                const errorEmbed = new EmbedBuilder()
                    .setTitle('❌ ▸ Error')
                    .setDescription(`Could not find information for command \`${targetCommandName}\`.`)
                    .setColor('Red');
                return await interaction.editReply({ embeds: [errorEmbed], components: [] });
            }

            const randomColor = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
            const embed = new EmbedBuilder()
                .setTitle(`🔞 ▸ Command Details: /${command.data.name}`)
                .setDescription(`**Description:**\n${command.data.description}`)
                .setColor(`#${randomColor}`)
                .setFooter({
                    text: `${interaction.user.username} | Today at ${new Date().toLocaleTimeString()}`,
                    iconURL: interaction.user.displayAvatarURL()
                });

            let paramsText = '';
            if (command.data.options && command.data.options.length > 0) {
                for (const option of command.data.options) {
                    paramsText += `• **\`${option.name}\`** ${option.required ? '(Required)' : '(Optional)'}\n  *${option.description}*\n`;
                }
            } else {
                paramsText = '*No parameters available for this command.*';
            }

            embed.addFields({ name: 'Parameters', value: paramsText });

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('help_page_1') // Go back to directory
                        .setLabel('🔙 ▸ Back to Directory')
                        .setStyle(ButtonStyle.Secondary)
                );

            return await interaction.editReply({ embeds: [embed], components: [row] });
        }

        // Mode A: General Directory
        const ITEMS_PER_PAGE = 8;
        const totalPages = Math.ceil(commands.length / ITEMS_PER_PAGE);

        if (page < 1) page = 1;
        if (page > totalPages) page = totalPages;

        const startIndex = (page - 1) * ITEMS_PER_PAGE;
        const currentCommands = commands.slice(startIndex, startIndex + ITEMS_PER_PAGE);

        const randomColor = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
        const embed = new EmbedBuilder()
            .setTitle('🔞 ▸ Command Directory')
            .setColor(`#${randomColor}`)
            .setFooter({
                text: `Page ${page} of ${totalPages} • ${interaction.user.username} | Today at ${new Date().toLocaleTimeString()}`,
                iconURL: interaction.user.displayAvatarURL()
            });

        let description = 'Here is a list of all available commands:\n\n';
        for (const cmd of currentCommands) {
            description += `**\`/${cmd.data.name}\`**\n*${cmd.data.description}*\n\n`;
        }
        embed.setDescription(description);

        const row = new ActionRowBuilder();

        row.addComponents(
            new ButtonBuilder()
                .setCustomId(`help_page_${page - 1}`)
                .setLabel('◀ Previous')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(page === 1),
            new ButtonBuilder()
                .setCustomId(`help_page_${page + 1}`)
                .setLabel('Next ▶')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(page === totalPages)
        );

        await interaction.editReply({ embeds: [embed], components: [row] });
    },
};
