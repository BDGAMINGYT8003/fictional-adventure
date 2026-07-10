import { fetchMedia } from './providers/index.js';
import { commandData } from './command-schema.js';
import { actionRow, button } from '../discord/components.js';
import { ButtonStyle } from '../discord/constants.js';
import { mediaCustomId, optionValue, requester } from '../discord/interaction-data.js';
import { avatarUrl, displayName } from '../lib/discord-user.js';
import { randomColor, choose, shuffle } from '../lib/random.js';

function allGroupedSources(groups) {
  return Object.values(groups ?? {}).flat();
}

function sourcePool(specification, interaction, state) {
  if (specification.resolveSources) return specification.resolveSources({ interaction, state, optionValue, choose });
  if (specification.optionName && specification.groups) {
    const selected = state[specification.optionName] || optionValue(interaction, specification.optionName);
    if (selected && specification.groups[selected]) return specification.groups[selected];
    if (specification.randomGroups?.length) return specification.groups[choose(specification.randomGroups)] ?? [];
    return allGroupedSources(specification.groups);
  }
  return specification.sources ?? [];
}

function refreshState(specification, interaction, state) {
  if (!specification.optionName) return state;
  const selected = state[specification.optionName] || optionValue(interaction, specification.optionName);
  return selected ? { ...state, [specification.optionName]: selected } : state;
}

function validLink(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function errorDescription(errors) {
  if (errors.some((error) => error?.code === 'TIMEOUT')) {
    return 'Every available media source timed out. Please try again shortly.';
  }
  if (errors.length > 0 && errors.every((error) => error?.code === 'PROVIDER_DISABLED')) {
    return 'The required media provider is not configured. Check the provider environment variables.';
  }
  return 'No media source returned a usable result. Please try again.';
}

export function defineMediaCommand(specification) {
  const data = commandData({
    name: specification.name,
    description: specification.description,
    nsfw: true,
    options: specification.options ?? [],
  });

  return {
    data,
    kind: 'media',
    media: specification,
    async execute(context, state = {}) {
      if (context.source === 'component') await context.responder.deferUpdate();
      else await context.responder.defer();

      const pool = sourcePool(specification, context.interaction, state);
      const errors = [];
      let result = null;
      for (const source of shuffle(pool)) {
        try {
          context.logger.event('Requesting media from provider.', {
            command: specification.name,
            provider: source.provider,
          });
          result = await fetchMedia(source, context);
          if (result) {
            context.logger.success('Media provider returned a usable result.', {
              command: specification.name,
              provider: result.provider,
            });
            break;
          }
        } catch (error) {
          errors.push(error);
          context.logger.warn('Media source failed; trying the next configured source.', {
            command: specification.name,
            provider: source.provider,
            code: error.code,
            error,
          });
        }
      }

      if (!result) {
        await context.responder.editOriginal({
          embeds: [{
            title: '❌ ▸ Error',
            description: errorDescription(errors),
            color: 0xed4245,
          }],
          components: [],
          attachments: [],
        });
        return;
      }

      const user = requester(context.interaction);
      const imageReference = result.buffer ? `attachment://${result.fileName}` : result.url;
      const embed = {
        title: specification.title,
        color: randomColor(),
        image: { url: imageReference },
        footer: {
          text: displayName(user),
          icon_url: avatarUrl(user),
        },
        timestamp: new Date().toISOString(),
      };

      const buttons = [button({
        customId: mediaCustomId(specification.name, refreshState(specification, context.interaction, state)),
        label: '🔄 ▸ Refresh',
      })];
      const link = result.watchUrl || result.url;
      if (validLink(link)) {
        buttons.push(button({ label: '📎 ▸ Link', style: ButtonStyle.LINK, url: link }));
      }

      const body = {
        embeds: [embed],
        components: [actionRow(buttons)],
        attachments: result.buffer ? [{ id: 0, filename: result.fileName }] : [],
      };
      const files = result.buffer
        ? [{ data: result.buffer, name: result.fileName, contentType: result.contentType }]
        : [];
      await context.responder.editOriginal(body, files);
    },
  };
}
