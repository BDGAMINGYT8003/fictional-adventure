const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { fetchPurrbot, fetchABD } = require('../utils/api');
const { logInfo } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('anal')
        .setDescription('Delivers a random anal sex Image/GIF'),
    async execute(interaction, isButton = false) {
        if (!isButton) {
            await interaction.deferReply();
        } else {
            await interaction.deferUpdate();
        }

        const sources = ['purrbot', 'abd'];
        const source = sources[Math.floor(Math.random() * sources.length)];

        let imageData = null;

        if (source === 'purrbot') {
            const endpoint = 'https://purrbot.site/api/img/nsfw/anal/gif';
            logInfo(`[/anal] Selected API Source: Purrbot (${endpoint})`);
            imageData = await fetchPurrbot(endpoint);
        } else if (source === 'abd') {
            const endpoint = 'https://api.n-sfw.com/nsfw/anal';
            logInfo(`[/anal] Selected API Source: ABD (${endpoint})`);
            imageData = await fetchABD(endpoint);
        }

        if (!imageData) {
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ ▸ Error')
                .setDescription('Failed to fetch image.')
                .setColor('Red');

            return await interaction.editReply({ embeds: [errorEmbed], components: [] });
        }

        const randomColor = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');

        const embed = new EmbedBuilder()
            .setTitle('🔞 ▸ NSFW Anal Image')
            .setImage(imageData.url)
            .setColor(`#${randomColor}`)
            .setFooter({
                text: `${interaction.user.username} | Today at ${new Date().toLocaleTimeString()}`,
                iconURL: interaction.user.displayAvatarURL()
            });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('refresh_anal')
                    .setLabel('🔄 ▸ Refresh')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setLabel('📎 ▸ Link')
                    .setURL(imageData.url)
                    .setStyle(ButtonStyle.Link)
            );

        await interaction.editReply({ embeds: [embed], components: [row] });
    },
};
