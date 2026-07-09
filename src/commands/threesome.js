const { SlashCommandBuilder } = require('discord.js');
const { fetchWithFallback } = require('../services/mediaProviders');
const { attachment, mediaEmbed, mediaRow } = require('../utils/discord');
const logger = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('threesome')
        .setDescription('Delivers a random NSFW threesome image/GIF')
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2)
        .setNSFW(true)
        .addStringOption((option) =>
            option
                .setName('type')
                .setDescription('Select threesome type')
                .setRequired(false)
                .addChoices(
                    { name: 'MMF', value: 'MMF' },
                    { name: 'FFM', value: 'FFM' },
                    { name: 'FFF', value: 'FFF' },
                ),
        ),

    category: 'media',

    async execute(interaction, context = {}) {
        if (context.component) {
            await interaction.deferUpdate();
        } else {
            await interaction.deferReply();
        }

        const type = context.savedStyle || interaction.options?.getString?.('type') || null;
        const mmfSources = [
            { provider: 'purrbot', path: 'threesome_mmf/gif' },
        ];
        const ffmSources = [
            { provider: 'purrbot', path: 'threesome_ffm/gif' },
        ];
        const fffSources = [
            { provider: 'purrbot', path: 'threesome_fff/gif' },
            { provider: 'nekosV4', tags: ['threesome'] },
        ];
        let sources;

        if (type === 'MMF') {
            sources = mmfSources;
        } else if (type === 'FFM') {
            sources = ffmSources;
        } else if (type === 'FFF') {
            sources = fffSources;
        } else {
            sources = [...mmfSources, ...ffmSources, ...fffSources];
        }

        logger.info('/threesome selected ' + sources.length + ' eligible source(s)');
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
        const title = 'NSFW ' + (type || 'Random') + ' Threesome Image';

        return interaction.editReply({
            embeds: [mediaEmbed({ title, media, user: interaction.user })],
            components: [mediaRow('threesome', media.url, type)],
            files: file ? [file] : [],
        });
    },
};
