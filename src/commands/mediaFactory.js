const { SlashCommandBuilder } = require('discord.js');
const { fetchWithFallback } = require('../services/mediaProviders');
const { mediaEmbed, mediaRow, attachment } = require('../utils/discord');
const logger = require('../utils/logger');

function sourcesFor(definition, style) {
  if (!definition.style) return definition.sources || [];
  if (style === 'Anime') return definition.anime || [];
  if (style === 'Real') return definition.real || [];
  return [...(definition.anime || []), ...(definition.real || [])];
}
function createMediaCommand(definition) {
  const builder = new SlashCommandBuilder()
    .setName(definition.name)
    .setDescription(definition.description)
    .setIntegrationTypes(0, 1)
    .setContexts(0, 1, 2)
    .setNSFW(true);
  if (definition.style) {
    builder.addStringOption((option) => option.setName('style').setDescription('Select the style').setRequired(false).addChoices({ name: 'Anime', value: 'Anime' }, { name: 'Real', value: 'Real' }));
  }
  return {
    data: builder,
    category: 'media',
    async execute(interaction, context = {}) {
      const style = context.savedStyle || interaction.options?.getString?.('style') || null;
      if (context.component) await interaction.deferUpdate(); else await interaction.deferReply();
      const sources = sourcesFor(definition, style);
      logger.info(`/${definition.name} using ${sources.length} eligible source(s)${style ? ` for ${style}` : ''}`);
      const media = await fetchWithFallback(sources);
      if (!media || media.error) {
        const message = media?.error === 'TIMEOUT' ? 'All eligible providers timed out. Please try again later.' : 'No media could be fetched from the eligible providers.';
        return interaction.editReply({ content: `❌ ${message}`, embeds: [], components: [], files: [] });
      }
      const file = attachment(media);
      const suffix = style || null;
      return interaction.editReply({ embeds: [mediaEmbed({ title: definition.title, media, user: interaction.user })], components: [mediaRow(definition.name, media.url, suffix)], files: file ? [file] : [] });
    }
  };
}
module.exports = { createMediaCommand, sourcesFor };
