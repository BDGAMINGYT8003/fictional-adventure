const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { color } = require('../utils/discord');
module.exports = {
  data: new SlashCommandBuilder().setName('help').setDescription('Directory of all available commands.').setIntegrationTypes(0, 1).setContexts(0, 1, 2),
  category: 'utility',
  async execute(interaction) {
    await interaction.deferReply();
    const names = [...interaction.client.commands.keys()].sort();
    const embed = new EmbedBuilder().setTitle('📚 Command Directory').setDescription(names.map((n) => `\`/${n}\``).join('  ')).setColor(color()).setFooter({ text: `${names.length} commands loaded` });
    await interaction.editReply({ embeds: [embed] });
  }
};
