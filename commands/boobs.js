const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { fetchBoobs, fetchWaifuIm } = require('../utils/api');
const { logInfo } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('boobs')
        .setDescription('Fetches a random or specific NSFW Boobs image')
        .addIntegerOption(option =>
            option.setName('id')
                .setDescription('The specific ID of the image to fetch (only for oboobs)')
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('style')
                .setDescription('Choose between Real or Anime content')
                .setRequired(false)
                .addChoices(
                    { name: 'Real', value: 'real' },
                    { name: 'Anime', value: 'anime' }
                )
        ),
    async execute(interaction, isButton = false) {
        let id = null;
        let style = null;

        if (!isButton) {
            id = interaction.options?.getInteger('id');
            style = interaction.options?.getString('style');

            if (id !== null && style === 'anime') {
                const validationEmbed = new EmbedBuilder()
                    .setTitle('❌ ▸ Invalid Parameter Combination')
                    .setColor('Red')
                    .setDescription("The `id` parameter is strictly linked to **Real-life** databases (Oboobs/Obutts). You cannot search for a specific ID while the Style is set to **Anime**.\n\n**Please choose one:**\n- Remove the `id` to browse Anime content.\n- Set Style to `Real` (or leave empty) to use a specific ID.");

                return await interaction.reply({ embeds: [validationEmbed], ephemeral: true });
            }

            if (id !== null && !style) {
                style = 'real';
            }
        } else {
            // customId format: refresh_boobs_{style|random}
            const parts = interaction.customId.split('_');
            if (parts.length === 3 && parts[2] !== 'random') {
                style = parts[2];
            }
        }

        // Defer reply for both slash commands and button interactions
        if (!isButton) {
            await interaction.deferReply();
        } else {
            await interaction.deferUpdate();
        }

        const useOboobsOnly = id !== null || style === 'real';

        let source = 'oboobs';
        if (!useOboobsOnly) {
            if (style === 'anime') {
                source = 'waifuim';
            } else {
                const sources = ['oboobs', 'waifuim'];
                source = sources[Math.floor(Math.random() * sources.length)];
            }
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

        let displayStyle = 'Random';
        if (style === 'real') displayStyle = 'Real';
        if (style === 'anime') displayStyle = 'Anime';

        const embed = new EmbedBuilder()
            .setTitle(`🔞 ▸ NSFW Boobs Image (${displayStyle})`)
            .setImage(imageData.url)
            .setColor(`#${randomColor}`)
            .setFooter({
                text: `${interaction.user.username} | Today at ${new Date().toLocaleTimeString()}`,
                iconURL: interaction.user.displayAvatarURL()
            });

        const refreshId = `refresh_boobs_${style || 'random'}`;

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(refreshId)
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
