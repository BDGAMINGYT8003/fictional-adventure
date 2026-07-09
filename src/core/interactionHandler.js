'use strict';
const { InteractionResponseType } = require('../config/discord');
const { errorEmbed } = require('./messages');
const { logCommand, logError } = require('./logger');
function optionMap(data) { const out = {}; for (const opt of data?.options || []) out[opt.name] = opt.value; return out; }
function channelAllowsNsfw(interaction, command) { if (!command?.data?.nsfw) return true; if (!interaction.guild_id) return true; return interaction.channel?.nsfw === true; }
async function handleInteraction(rest, appId, commands, heartbeat, interaction) {
  if (interaction.type === 1) return rest.createInteractionResponse(interaction.id, interaction.token, { type: InteractionResponseType.PONG });
  const isCommand = interaction.type === 2; const isButton = interaction.type === 3;
  const name = isCommand ? interaction.data.name : isButton && interaction.data.custom_id?.startsWith('refresh_') ? interaction.data.custom_id.split('_')[1] : null;
  const command = commands.get(name); if (!command) return;
  if (!channelAllowsNsfw(interaction, command)) return rest.createInteractionResponse(interaction.id, interaction.token, { type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE, data: { flags: 64, embeds: [errorEmbed('This command can only be used in channels marked as NSFW.')] } });
  const deferType = isButton ? InteractionResponseType.DEFERRED_UPDATE_MESSAGE : InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE;
  await rest.createInteractionResponse(interaction.id, interaction.token, { type: deferType });
  const saved = isButton ? interaction.data.custom_id.split('_').slice(2).join('_').replaceAll('_',' ') : null;
  const ctx = { user: interaction.member?.user || interaction.user, options: optionMap(interaction.data), commands, heartbeat, edit: payload => rest.editOriginalInteractionResponse(appId, interaction.token, payload) };
  try { logCommand(name, ctx.user?.id, interaction.guild_id); await command.execute(ctx, saved); } catch (error) { logError(`/${name}: ${error.stack || error.message}`); await ctx.edit({ embeds: [errorEmbed('There was an error while executing this command.')], components: [] }); }
}
module.exports = { handleInteraction };
