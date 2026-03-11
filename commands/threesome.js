const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { fetchPurrbot } = require('../utils/api');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('threesome')
        .setDescription('Delivers a random threesome GIF')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('The type of threesome')
                .setRequired(false)
                .addChoices(
                    { name: '3 Females', value: '3 Females' },
                    { name: '2 Females 1 Male', value: '2 Females 1 Male' },
                    { name: '2 Males 1 Female', value: '2 Males 1 Female' }
                )
        ),
    async execute(interaction, isButton = false) {
        if (!isButton) {
            await interaction.deferReply();
        } else {
            await interaction.deferUpdate();
        }

        let type = isButton ? null : interaction.options?.getString('type');
        if (!type) {
            const types = ['3 Females', '2 Females 1 Male', '2 Males 1 Female'];
            type = types[Math.floor(Math.random() * types.length)];
        }

        let endpoint;
        switch (type) {
            case '3 Females':
                endpoint = 'https://purrbot.site/api/img/nsfw/threesome_fff/gif';
                break;
            case '2 Females 1 Male':
                endpoint = 'https://purrbot.site/api/img/nsfw/threesome_ffm/gif';
                break;
            case '2 Males 1 Female':
                endpoint = 'https://purrbot.site/api/img/nsfw/threesome_mmf/gif';
                break;
        }

        const imageData = await fetchPurrbot(endpoint);

        if (!imageData) {
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ ▸ Error')
                .setDescription('Failed to fetch image.')
                .setColor('Red');

            return await interaction.editReply({ embeds: [errorEmbed], components: [] });
        }

        const randomColor = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');

        const embed = new EmbedBuilder()
            .setTitle(`🔞 ▸ NSFW Threesome Image (${type})`)
            .setImage(imageData.url)
            .setColor(`#${randomColor}`)
            .setFooter({
                text: `${interaction.user.username} | Today at ${new Date().toLocaleTimeString()}`,
                iconURL: interaction.user.displayAvatarURL()
            });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('refresh_threesome')
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
