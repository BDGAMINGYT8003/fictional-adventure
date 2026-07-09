const { SlashCommandBuilder } = require('discord.js');
const { fetchWithFallback } = require('../services/mediaProviders');
const { attachment, mediaEmbed, mediaRow } = require('../utils/discord');
const logger = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('solo')
        .setDescription('Delivers a random NSFW solo image/GIF')
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2)
        .setNSFW(true)
        .addStringOption((option) =>
            option
                .setName('gender')
                .setDescription('Select the solo category')
                .setRequired(false)
                .addChoices(
                    { name: 'Female', value: 'Female' },
                    { name: 'Male', value: 'Male' },
                ),
        ),

    category: 'media',

    async execute(interaction, context = {}) {
        if (context.component) {
            await interaction.deferUpdate();
        } else {
            await interaction.deferReply();
        }

        const gender = context.savedStyle || interaction.options?.getString?.('gender') || null;
        const femaleSources = [
            { provider: 'purrbot', path: 'solo/gif' },
            { provider: 'abd', tag: 'masturbation' },
            { provider: 'nekosV4', tags: ['masturbating'] },
        ];
        const maleSources = [
            { provider: 'purrbot', path: 'solo_male/gif' },
        ];
        let sources;

        if (gender === 'Female') {
            sources = femaleSources;
        } else if (gender === 'Male') {
            sources = maleSources;
        } else {
            sources = [...femaleSources, ...maleSources];
        }

        logger.info('/solo selected ' + sources.length + ' eligible source(s)');
        const media = await fetchWithFallback(sources);

        if (!media || media.error) {
            return interaction.editReply({
                content: '❌ Failed to fetch media.',
                embeds: [],
                components: [],
                files: [],
            });
        }

        const file = attachment(media);
        const title = 'NSFW ' + (gender || 'Random') + ' Solo Image';

        return interaction.editReply({
            embeds: [mediaEmbed({ title, media, user: interaction.user })],
            components: [mediaRow('solo', media.url, gender)],
            files: file ? [file] : [],
        });
    },
};
