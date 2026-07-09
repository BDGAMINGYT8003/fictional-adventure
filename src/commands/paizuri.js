const { SlashCommandBuilder } = require('discord.js');
const { fetchWithFallback } = require('../services/mediaProviders');
const { attachment, mediaEmbed, mediaRow } = require('../utils/discord');
const logger = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('paizuri')
        .setDescription('Delivers a random NSFW paizuri image')
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2)
        .setNSFW(true),

    category: 'media',

    async execute(interaction, context = {}) {
        if (context.component) {
            await interaction.deferUpdate();
        } else {
            await interaction.deferReply();
        }

        const style = null;
        const sources = [
            {
                    "provider": "abd",
                    "tag": "paizuri"
            },
            {
                    "provider": "waifuIm",
                    "tag": "paizuri"
            },
            {
                    "provider": "nekobot",
                    "type": "paizuri"
            }
    ];

        logger.info('/paizuri selected ' + sources.length + ' eligible source(s)');
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
            embeds: [mediaEmbed({ title: 'NSFW Paizuri Image', media, user: interaction.user })],
            components: [mediaRow('paizuri', media.url, suffix)],
            files: file ? [file] : [],
        });
    },
};
