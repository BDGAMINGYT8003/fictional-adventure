const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { fetchBoobs, fetchWaifuIm } = require('../utils/api');
const { logInfo } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('boobs')
        .setDescription('Fetches a random or specific NSFW Boobs image')
        .addIntegerOption(option =>
            option.setName('id')
                .setDescription('The specific ID of the image to fetch')
                .setRequired(false)
        ),
    async execute(interaction, isButton = false) {
        // Defer reply for both slash commands and button interactions
        if (!isButton) {
            await interaction.deferReply();
        } else {
            await interaction.deferUpdate();
        }

        const id = isButton ? null : interaction.options?.getInteger('id');
        const useOboobsOnly = id !== null;

        let source = 'oboobs';
        if (!useOboobsOnly) {
            const sources = ['oboobs', 'waifuim'];
            source = sources[Math.floor(Math.random() * sources.length)];
        }

        let imageData = null;

        if (source === 'oboobs') {
            logInfo(`[/boobs] Selected API Source: oboobs.ru (ID: ${id || 'random'})`);
            imageData = await fetchBoobs(id);
        } else if (source === 'waifuim') {
            logInfo(`[/boobs] Selected API Source: Waifu.im (tag: oppai)`);
            imageData = await fetchWaifuIm('oppai');
        }

        if (!imageData || imageData.error) {
            let errorMsg = 'Failed to fetch image or no image found with that ID.';
            if (imageData && imageData.error === 'TIMEOUT') {
                errorMsg = 'API Timeout: The request took longer than 15 seconds to fulfill. Please try again later.';
            }
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ ▸ Error')
                .setDescription(errorMsg)
                .setColor('Red');

            return await interaction.editReply({ embeds: [errorEmbed], components: [] });
        }

        // Random Hex Color
        const randomColor = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');

        const embed = new EmbedBuilder()
            .setTitle('🔞 ▸ NSFW Boobs Image')
            .setImage(imageData.url)
            .setColor(`#${randomColor}`)
            .setFooter({
                text: `${interaction.user.username} | Today at ${new Date().toLocaleTimeString()}`,
                iconURL: interaction.user.displayAvatarURL()
            });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('refresh_boobs')
                    .setLabel('🔄 ▸ Refresh')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setLabel('📎 ▸ Link')
                    .setURL(imageData.url)
                    .setStyle(ButtonStyle.Link)
            );

        if (!isButton) {
            await interaction.editReply({ embeds: [embed], components: [row] });
        } else {
            await interaction.editReply({ embeds: [embed], components: [row] });
        }
    },
};
