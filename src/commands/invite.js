const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, OAuth2Scopes, PermissionFlagsBits } = require('discord.js');
const { color } = require('../utils/discord');
module.exports = {
  data: new SlashCommandBuilder().setName('invite').setDescription('Get an invite link for this bot.').setIntegrationTypes(0, 1).setContexts(0, 1, 2),
  category: 'utility',
  async execute(interaction) {
    await interaction.deferReply();
    const inviteUrl = interaction.client.generateInvite({ scopes: [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands], permissions: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.UseExternalEmojis, PermissionFlagsBits.ReadMessageHistory] });
    const embed = new EmbedBuilder().setTitle('✨ Invite Me').setDescription('Use the button below to authorize the bot with the required permissions.').setColor(color());
    const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel('Invite Bot').setURL(inviteUrl).setStyle(ButtonStyle.Link));
    await interaction.editReply({ embeds: [embed], components: [row] });
  }
};
