const { SlashCommandBuilder } = require('discord.js');
const { fetchWithFallback } = require('../services/mediaProviders');
const { attachment, mediaEmbed, mediaRow } = require('../utils/discord');
const logger = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('anal')
        .setDescription('Delivers a random NSFW anal image/GIF')
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
                    "provider": "purrbot",
                    "path": "anal/gif"
            },
            {
                    "provider": "abd",
                    "tag": "anal"
            },
            {
                    "provider": "nekobot",
                    "type": "hentai_anal"
            },
            {
                    "provider": "nekosV4",
                    "tags": [
                            "anal"
                    ]
            }
    ];
        const realSources = [
            {
                    "provider": "nekobot",
                    "type": "anal"
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

        logger.info('/anal selected ' + sources.length + ' eligible source(s)');
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
            embeds: [mediaEmbed({ title: 'NSFW Anal Image', media, user: interaction.user })],
            components: [mediaRow('anal', media.url, suffix)],
            files: file ? [file] : [],
        });
    },
};
