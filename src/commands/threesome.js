const { SlashCommandBuilder } = require('discord.js');
const { fetchWithFallback } = require('../services/mediaProviders');
const { mediaEmbed, mediaRow, attachment } = require('../utils/discord');
const map = { MMF: [{ provider: 'purrbot', path: 'threesome_mmf/gif' }], FFM: [{ provider: 'purrbot', path: 'threesome_ffm/gif' }], FFF: [{ provider: 'purrbot', path: 'threesome_fff/gif' }, { provider: 'nekosV4', tags: ['threesome'] }] };
function pool(type) { return type && map[type] ? map[type] : Object.values(map).flat(); }
module.exports = {
  data: new SlashCommandBuilder().setName('threesome').setDescription('Delivers a random NSFW threesome image/GIF').setIntegrationTypes(0, 1).setContexts(0, 1, 2).setNSFW(true).addStringOption(o => o.setName('type').setDescription('Select threesome type').setRequired(false).addChoices({ name: 'MMF', value: 'MMF' }, { name: 'FFM', value: 'FFM' }, { name: 'FFF', value: 'FFF' })),
  category: 'media',
  async execute(interaction, context = {}) { const type = context.savedStyle || interaction.options?.getString?.('type') || null; if (context.component) await interaction.deferUpdate(); else await interaction.deferReply(); const media = await fetchWithFallback(pool(type)); if (!media || media.error) return interaction.editReply({ content: '❌ Failed to fetch media.', embeds: [], components: [], files: [] }); const file = attachment(media); return interaction.editReply({ embeds: [mediaEmbed({ title: `NSFW ${type || 'Random'} Threesome Image`, media, user: interaction.user })], components: [mediaRow('threesome', media.url, type)], files: file ? [file] : [] }); }
};
