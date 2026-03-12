const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { fetchSexcom } = require('../utils/api');
const { logInfo } = require('../utils/logger');

const NICHES = [
    'Amateur', 'Anal', 'Asian', 'Big Tits', 'Blonde', 'Blowjob', 'Brunette', 'Creampie', 'Cumshot', 'Hardcore', 'Latina', 'Lesbian', 'MILF', 'Masturbation', 'Threesome',
    'Ass', 'BBW', 'BDSM', 'Double Penetration', 'Ebony', 'Female Ejaculation', 'Fisting', 'Footjob', 'Gangbang', 'Hairy', 'Handjob', 'Hentai', 'Lingerie', 'Public Sex', 'Pussy', 'Toys'
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gif')
        .setDescription('Delivers a random NSFW GIF')
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2)
        .setNSFW(true),
    async execute(interaction, isButton = false) {
        if (!isButton) {
            await interaction.deferReply();
        } else {
            await interaction.deferUpdate();
        }

        const niche = NICHES[Math.floor(Math.random() * NICHES.length)];

        const imageData = await fetchSexcom(niche);

        if (imageData && imageData.id) {
            logInfo(`[/gif] Fetched GIF - Pin ID: ${imageData.id}`);
        }

        if (!imageData || imageData.error) {
            let errorMsg = 'Failed to fetch image.';
            if (imageData && imageData.error === 'TIMEOUT') {
                errorMsg = 'API Timeout: The request took longer than 15 seconds to fulfill. Please try again later.';
            }
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ ▸ Error')
                .setDescription(errorMsg)
                .setColor('Red');

            return await interaction.editReply({ embeds: [errorEmbed], components: [] });
        }

        const randomColor = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');

        const embed = new EmbedBuilder()
            .setTitle(`🔞 ▸ NSFW GIF`)
            .setImage(imageData.url)
            .setColor(`#${randomColor}`)
            .setFooter({
                text: `${interaction.user.username} | Today at ${new Date().toLocaleTimeString()}`,
                iconURL: interaction.user.displayAvatarURL()
            });

        const watchUrl = `https://www.sex.com/pin/${imageData.id}/`;

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`refresh_gif`)
                    .setLabel('🔄 ▸ Refresh')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setLabel('📎 ▸ Link')
                    .setURL(watchUrl)
                    .setStyle(ButtonStyle.Link)
            );

        await interaction.editReply({ embeds: [embed], components: [row] });
    },
};
