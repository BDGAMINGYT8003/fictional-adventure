const { SlashCommandBuilder } = require('discord.js');
const { fetchWithFallback } = require('../services/mediaProviders');
const { attachment, mediaEmbed, mediaRow } = require('../utils/discord');
const logger = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('feet')
        .setDescription('Delivers a random NSFW feet image/GIF')
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2)
        .setNSFW(true)
        .addStringOption((option) =>
            option
                .setName('style')
                .setDescription('Select the style')
                .setRequired(false)
                .addChoices(
                    { name: 'Anime', value: 'Anime' },
                    { name: 'Real', value: 'Real' },
                ),
        ),

    category: 'media',

    async execute(interaction, context = {}) {
        if (context.component) {
            await interaction.deferUpdate();
        } else {
            await interaction.deferReply();
        }

        const style = context.savedStyle || interaction.options?.getString?.('style') || null;
        const animeSources = [
            {
                    "provider": "abd",
                    "tag": "feet"
            }
    ];
        const realSources = [
            {
                    "provider": "nekobot",
                    "type": "feet"
            }
    ];
        let sources;

        if (style === 'Anime') {
            sources = animeSources;
        } else if (style === 'Real') {
            sources = realSources;
        } else {
            sources = [...animeSources, ...realSources];
        }

        logger.info('/feet selected ' + sources.length + ' eligible source(s)');
        const media = await fetchWithFallback(sources);

        if (!media || media.error) {
            const message = media?.error === 'TIMEOUT'
                ? 'All eligible providers timed out. Please try again later.'
                : 'No media could be fetched from the eligible providers.';

            return interaction.editReply({
                content: '❌ ' + message,
                embeds: [],
                components: [],
                files: [],
            });
        }

        const file = attachment(media);
        const suffix = style || null;

        return interaction.editReply({
            embeds: [mediaEmbed({ title: 'NSFW Feet Image', media, user: interaction.user })],
            components: [mediaRow('feet', media.url, suffix)],
            files: file ? [file] : [],
        });
    },
};
