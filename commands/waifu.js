const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { fetchWaifu } = require('../utils/api');
const { logInfo } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('waifu')
        .setDescription('Delivers a random Waifu image'),
    async execute(interaction, isButton = false) {
        if (!isButton) {
            await interaction.deferReply();
        } else {
            await interaction.deferUpdate();
        }

        const endpoint = 'https://api.waifu.pics/nsfw/waifu';
        logInfo(`[/waifu] Selected API Source: Waifu.pics (${endpoint})`);
        const imageData = await fetchWaifu(endpoint);

        if (!imageData) {
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ ▸ Error')
                .setDescription('Failed to fetch image.')
                .setColor('Red');

            return await interaction.editReply({ embeds: [errorEmbed], components: [] });
        }

        const randomColor = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');

        const embed = new EmbedBuilder()
            .setTitle('🔞 ▸ NSFW Waifu Image')
            .setImage(imageData.url)
            .setColor(`#${randomColor}`)
            .setFooter({
                text: `${interaction.user.username} | Today at ${new Date().toLocaleTimeString()}`,
                iconURL: interaction.user.displayAvatarURL()
            });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('refresh_waifu')
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
