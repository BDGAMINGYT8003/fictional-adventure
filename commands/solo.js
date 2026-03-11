const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { fetchPurrbot } = require('../utils/api');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('solo')
        .setDescription('Delivers a random solo masturbation GIF')
        .addStringOption(option =>
            option.setName('gender')
                .setDescription('The gender for the solo GIF')
                .setRequired(false)
                .addChoices(
                    { name: 'Female', value: 'female' },
                    { name: 'Male', value: 'male' }
                )
        ),
    async execute(interaction, isButton = false) {
        if (!isButton) {
            await interaction.deferReply();
        } else {
            await interaction.deferUpdate();
        }

        let originalGenderChoice = null;

        if (isButton) {
            // customId format: refresh_solo_{gender|random}
            const parts = interaction.customId.split('_');
            if (parts.length === 3 && parts[2] !== 'random') {
                originalGenderChoice = parts[2];
            }
        } else {
            originalGenderChoice = interaction.options?.getString('gender');
        }

        let fetchGender = originalGenderChoice;
        if (!fetchGender) {
            fetchGender = Math.random() < 0.5 ? 'female' : 'male';
        }

        const endpoint = fetchGender === 'female'
            ? 'https://purrbot.site/api/img/nsfw/solo/gif'
            : 'https://purrbot.site/api/img/nsfw/solo_male/gif';

        const imageData = await fetchPurrbot(endpoint);

        if (!imageData) {
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ ▸ Error')
                .setDescription('Failed to fetch image.')
                .setColor('Red');

            return await interaction.editReply({ embeds: [errorEmbed], components: [] });
        }

        const randomColor = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');

        const embedTitleGender = fetchGender === 'female' ? 'Female' : 'Male';
        const embed = new EmbedBuilder()
            .setTitle(`🔞 ▸ NSFW ${embedTitleGender} Solo Image`)
            .setImage(imageData.url)
            .setColor(`#${randomColor}`)
            .setFooter({
                text: `${interaction.user.username} | Today at ${new Date().toLocaleTimeString()}`,
                iconURL: interaction.user.displayAvatarURL()
            });

        const refreshId = `refresh_solo_${originalGenderChoice || 'random'}`;

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

        await interaction.editReply({ embeds: [embed], components: [row] });
    },
};
