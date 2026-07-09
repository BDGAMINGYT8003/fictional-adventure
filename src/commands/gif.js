const { SlashCommandBuilder } = require('discord.js');
const { fetchWithFallback } = require('../services/mediaProviders');
const { mediaEmbed, mediaRow, attachment } = require('../utils/discord');
const categories = ['Amateur','Anal','Asian','Big Tits','Blonde','Blowjob','Brunette','Creampie','Cumshot','Hardcore','Latina','Lesbian','MILF','Masturbation','Threesome','Ass','BBW','BDSM','Double Penetration','Ebony','Female Ejaculation','Fisting','Footjob','Gangbang','Hairy','Handjob','Hentai','Lingerie','Public Sex','Pussy','Toys'];
module.exports = {
  data: new SlashCommandBuilder().setName('gif').setDescription('Delivers a random NSFW GIF').setIntegrationTypes(0, 1).setContexts(0, 1, 2).setNSFW(true),
  category: 'media',
  async execute(interaction, context = {}) {
    if (context.component) await interaction.deferUpdate(); else await interaction.deferReply();
    const category = categories[Math.floor(Math.random() * categories.length)];
    const media = await fetchWithFallback([{ provider: 'porngifsTv' }, { provider: 'nekobot', type: 'pgif' }, { provider: 'sexcom', category }, { provider: 'porngifs' }]);
    if (!media || media.error) return interaction.editReply({ content: '❌ Failed to fetch a GIF. Please try again later.', embeds: [], components: [], files: [] });
    const file = attachment(media);
    return interaction.editReply({ embeds: [mediaEmbed({ title: 'NSFW GIF', media, user: interaction.user })], components: [mediaRow('gif', media.url)], files: file ? [file] : [] });
  }
};
