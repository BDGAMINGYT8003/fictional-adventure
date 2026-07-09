const { SlashCommandBuilder } = require('discord.js');
const { fetchWithFallback } = require('../services/mediaProviders');
const { attachment, mediaEmbed, mediaRow } = require('../utils/discord');
const logger = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('blowjob')
        .setDescription('Delivers a random NSFW blowjob image/GIF')
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
                    "path": "blowjob/gif"
            },
            {
                    "provider": "waifuPics",
                    "category": "blowjob"
            },
            {
                    "provider": "abd",
                    "tag": "blowjob"
            },
            {
                    "provider": "waifuIm",
                    "tag": "oral"
            },
            {
                    "provider": "nekobot",
                    "type": "hentai"
            }
    ];
        const realSources = [
            {
                    "provider": "nekobot",
                    "type": "blowjob"
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

        logger.info('/blowjob selected ' + sources.length + ' eligible source(s)');
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
            embeds: [mediaEmbed({ title: 'NSFW Blowjob Image', media, user: interaction.user })],
            components: [mediaRow('blowjob', media.url, suffix)],
            files: file ? [file] : [],
        });
    },
};
