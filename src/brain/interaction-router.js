import { InteractionType } from '../discord/constants.js';
import {
  InteractionResponder,
  isInteractionUnavailableError,
} from '../discord/interaction-responder.js';
import { commandNameForInteraction, parseMediaCustomId } from '../discord/interaction-data.js';
import { isNsfwContext, nsfwErrorPayload } from './nsfw-guard.js';

const INTERACTION_CACHE_TTL_MS = 15 * 60 * 1_000;
const MAX_CACHED_INTERACTIONS = 10_000;

function legacyRefreshTarget(customId, commands) {
  const parts = customId.slice('refresh_'.length).split('_');
  const commandName = parts.shift();
  if (!commandName) return null;
  const optionName = commands.get(commandName)?.media?.optionName;
  const optionValue = parts.join(' ').trim();
  const state = optionName && optionValue ? { [optionName]: optionValue } : {};
  return { commandName, state };
}

function componentTarget(customId, commands) {
  if (customId.startsWith('m:')) return parseMediaCustomId(customId);
  if (customId.startsWith('refresh_')) return legacyRefreshTarget(customId, commands);
  if (customId.startsWith('help:')) return { commandName: 'help', state: { customId } };
  if (customId.startsWith('ping:')) return { commandName: 'ping', state: { customId } };
  if (customId.startsWith('intro:')) return { commandName: 'intro', state: { customId } };
  return null;
}

export class InteractionRouter {
  constructor({ commands, rest, gateway, config, mediaHttp, logger, now = Date.now }) {
    this.commands = commands;
    this.rest = rest;
    this.gateway = gateway;
    this.config = config;
    this.mediaHttp = mediaHttp;
    this.logger = logger.child({ subsystem: 'interaction-router' });
    this.now = now;
    this.seenInteractions = new Map();
  }

  async handle(interaction) {
    if (!this.#rememberInteraction(interaction?.id)) {
      this.logger.debug('Ignoring duplicate Gateway interaction dispatch.', {
        interactionId: interaction?.id,
      });
      return;
    }

    const responder = new InteractionResponder({ interaction, rest: this.rest });
    let commandName = null;
    let state = {};
    let source = null;

    try {
      if (interaction.type === InteractionType.PING) {
        await responder.pong();
        return;
      }

      if (interaction.type === InteractionType.APPLICATION_COMMAND || interaction.type === InteractionType.APPLICATION_COMMAND_AUTOCOMPLETE) {
        commandName = commandNameForInteraction(interaction);
        source = interaction.type === InteractionType.APPLICATION_COMMAND_AUTOCOMPLETE ? 'autocomplete' : 'command';
      } else if (interaction.type === InteractionType.MESSAGE_COMPONENT) {
        const target = componentTarget(interaction.data?.custom_id ?? '', this.commands);
        commandName = target?.commandName ?? null;
        state = target?.state ?? {};
        source = 'component';
      } else if (interaction.type === InteractionType.MODAL_SUBMIT) {
        commandName = interaction.data?.custom_id?.startsWith('help:modal:') ? 'help' : null;
        state = { customId: interaction.data?.custom_id };
        source = 'modal';
      } else {
        return;
      }

      const command = this.commands.get(commandName);
      if (!command) {
        if (source === 'autocomplete') await responder.autocomplete([]);
        else await responder.reply({ content: 'This interaction is no longer available.', flags: 64 });
        return;
      }
      if (source !== 'autocomplete' && command.data.nsfw && !isNsfwContext(interaction)) {
        await responder.reply(nsfwErrorPayload());
        return;
      }

      const advertisedAttachmentLimit = Number(interaction.attachment_size_limit);
      const maxMediaBytes = Number.isFinite(advertisedAttachmentLimit) && advertisedAttachmentLimit > 0
        ? Math.min(this.config.maxMediaBytes, advertisedAttachmentLimit)
        : this.config.maxMediaBytes;
      const context = {
        interaction,
        responder,
        source,
        rest: this.rest,
        gateway: this.gateway,
        config: this.config,
        http: this.mediaHttp.withMaximumBytes(maxMediaBytes),
        maxMediaBytes,
        commands: this.commands,
        logger: this.logger,
      };

      if (source === 'autocomplete') {
        if (typeof command.autocomplete === 'function') await command.autocomplete(context);
        else await responder.autocomplete([]);
      } else {
        await command.execute(context, state);
      }
    } catch (error) {
      const unavailable = isInteractionUnavailableError(error);
      const log = unavailable ? this.logger.warn.bind(this.logger) : this.logger.error.bind(this.logger);
      log(unavailable
        ? 'Ignoring an interaction that was already acknowledged or expired.'
        : 'Unhandled interaction command error.', {
        command: commandName,
        interactionId: interaction.id,
        responseState: responder.responseState,
        error,
      });

      if (unavailable || interaction.type === InteractionType.PING) return;
      try {
        const data = {
          embeds: [{
            title: '❌ ▸ Error',
            description: 'An unexpected error occurred while executing this interaction.',
            color: 0xed4245,
          }],
          components: [],
        };
        if (source === 'autocomplete') {
          if (responder.canAcknowledge) await responder.autocomplete([]);
        } else if (responder.acknowledged) {
          await responder.editOriginal({ ...data, attachments: [] });
        } else if (responder.canAcknowledge) {
          await responder.reply({ ...data, flags: 64 });
        }
      } catch (responseError) {
        const responseUnavailable = isInteractionUnavailableError(responseError);
        const responseLog = responseUnavailable
          ? this.logger.warn.bind(this.logger)
          : this.logger.error.bind(this.logger);
        responseLog(responseUnavailable
          ? 'Interaction expired before an error response could be sent.'
          : 'Failed to report an interaction error to Discord.', responseError);
      }
    }
  }

  #rememberInteraction(interactionId) {
    if (!interactionId) return true;
    const now = this.now();
    for (const [id, seenAt] of this.seenInteractions) {
      if (now - seenAt < INTERACTION_CACHE_TTL_MS) break;
      this.seenInteractions.delete(id);
    }
    if (this.seenInteractions.has(interactionId)) return false;
    this.seenInteractions.set(interactionId, now);
    while (this.seenInteractions.size > MAX_CACHED_INTERACTIONS) {
      this.seenInteractions.delete(this.seenInteractions.keys().next().value);
    }
    return true;
  }
}
