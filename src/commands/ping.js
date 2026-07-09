const os = require('os');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { color } = require('../utils/discord');
module.exports = {
  data: new SlashCommandBuilder().setName('ping').setDescription('Show bot latency and process diagnostics.').setIntegrationTypes(0, 1).setContexts(0, 1, 2),
  category: 'utility',
  async execute(interaction) {
    await interaction.deferReply();
    const sent = await interaction.editReply({ content: 'Pinging...' });
    const heap = process.memoryUsage().heapUsed / 1024 / 1024;
    const embed = new EmbedBuilder().setTitle('🏓 Pong').setColor(color()).addFields(
      { name: 'WebSocket', value: `${interaction.client.ws.ping}ms`, inline: true },
      { name: 'Round trip', value: `${sent.createdTimestamp - interaction.createdTimestamp}ms`, inline: true },
      { name: 'Memory', value: `${heap.toFixed(1)} MB`, inline: true },
      { name: 'Host', value: `${os.platform()} ${os.release()}`, inline: false }
    );
    await interaction.editReply({ content: '', embeds: [embed] });
  }
};
