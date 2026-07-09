const { Events, EmbedBuilder } = require('discord.js');
const { ephemeral, color } = require('../utils/discord');
const logger = require('../utils/logger');
const SAFE_COMMANDS = new Set(['help', 'invite', 'ping']);
function commandFromComponent(customId) { const [kind, name, savedStyle] = customId.split(':'); return kind === 'refresh' ? { name, savedStyle } : null; }
function assertNsfw(interaction, commandName) {
  if (SAFE_COMMANDS.has(commandName)) return true;
  if (!interaction.guild) return true;
  if (interaction.channel?.nsfw) return true;
  const embed = new EmbedBuilder().setTitle('❌ Not an NSFW channel').setDescription('This command can only be used in channels marked as NSFW.').setColor(color());
  interaction.reply({ embeds: [embed], ...ephemeral() }).catch((error) => logger.error(`Failed NSFW warning: ${error.message}`));
  return false;
}
module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    const component = interaction.isButton() ? commandFromComponent(interaction.customId) : null;
    const commandName = interaction.isChatInputCommand() ? interaction.commandName : component?.name;
    if (!commandName) return;
    const command = interaction.client.commands.get(commandName);
    if (!command) return;
    if (!assertNsfw(interaction, commandName)) return;
    try {
      logger.command(commandName, `${interaction.user.tag || interaction.user.username} (${interaction.user.id})`, interaction.guild?.name || 'DM');
      await command.execute(interaction, { component: Boolean(component), savedStyle: component?.savedStyle || null });
    } catch (error) {
      logger.error(`/${commandName} failed: ${error.stack || error.message}`);
      const payload = { content: '❌ There was an error while executing this interaction.', ...ephemeral() };
      if (interaction.deferred || interaction.replied) await interaction.followUp(payload).catch(() => {}); else await interaction.reply(payload).catch(() => {});
    }
  }
};
