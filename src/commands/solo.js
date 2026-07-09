const { SlashCommandBuilder } = require('discord.js');
const { fetchWithFallback } = require('../services/mediaProviders');
const { mediaEmbed, mediaRow, attachment } = require('../utils/discord');
function pool(gender) { if (gender === 'Male') return [{ provider: 'purrbot', path: 'solo_male/gif' }]; if (gender === 'Female') return [{ provider: 'purrbot', path: 'solo/gif' }, { provider: 'abd', tag: 'masturbation' }, { provider: 'nekosV4', tags: ['masturbating'] }]; return [...pool('Female'), ...pool('Male')]; }
module.exports = {
  data: new SlashCommandBuilder().setName('solo').setDescription('Delivers a random NSFW solo image/GIF').setIntegrationTypes(0, 1).setContexts(0, 1, 2).setNSFW(true).addStringOption(o => o.setName('gender').setDescription('Select the solo category').setRequired(false).addChoices({ name: 'Female', value: 'Female' }, { name: 'Male', value: 'Male' })),
  category: 'media',
  async execute(interaction, context = {}) { const gender = context.savedStyle || interaction.options?.getString?.('gender') || null; if (context.component) await interaction.deferUpdate(); else await interaction.deferReply(); const media = await fetchWithFallback(pool(gender)); if (!media || media.error) return interaction.editReply({ content: '❌ Failed to fetch media.', embeds: [], components: [], files: [] }); const file = attachment(media); return interaction.editReply({ embeds: [mediaEmbed({ title: `NSFW ${gender || 'Random'} Solo Image`, media, user: interaction.user })], components: [mediaRow('solo', media.url, gender)], files: file ? [file] : [] }); }
};
