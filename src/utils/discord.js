const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, AttachmentBuilder, MessageFlags } = require('discord.js');
function color() { return Math.floor(Math.random() * 0xffffff); }
function footer(user) { return { text: `${user.username} | ${new Date().toLocaleString()}`, iconURL: user.displayAvatarURL() }; }
function mediaEmbed({ title, media, user }) {
  const embed = new EmbedBuilder().setTitle(`🔞 ▸ ${title}`).setColor(color()).setFooter(footer(user));
  if (media.buffer) embed.setImage(`attachment://${media.filename || 'media.bin'}`); else embed.setImage(media.url);
  return embed;
}
function mediaRow(commandName, url, suffix = null) {
  const id = suffix ? `refresh:${commandName}:${suffix}` : `refresh:${commandName}`;
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(id).setLabel('🔄 Refresh').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setLabel('📎 Link').setURL(url).setStyle(ButtonStyle.Link)
  );
}
function attachment(media) { return media.buffer ? new AttachmentBuilder(media.buffer, { name: media.filename || 'media.bin' }) : null; }
function ephemeral() { return { flags: MessageFlags.Ephemeral }; }
module.exports = { color, footer, mediaEmbed, mediaRow, attachment, ephemeral };
