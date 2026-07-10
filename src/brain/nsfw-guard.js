import { ChannelType } from '../discord/constants.js';

const DM_TYPES = new Set([ChannelType.DM, ChannelType.GROUP_DM]);

export function isNsfwContext(interaction) {
  if (!interaction.guild_id) return true;
  if (DM_TYPES.has(interaction.channel?.type)) return true;
  return interaction.channel?.nsfw === true;
}

export function nsfwErrorPayload() {
  return {
    embeds: [{
      title: '❌ ▸ Not an age-restricted channel',
      description: 'This command can only be used in a Discord channel marked age-restricted (NSFW).',
      color: 0xed4245,
    }],
    flags: 64,
  };
}
