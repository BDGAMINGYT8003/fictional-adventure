import { InteractionType } from '../discord/constants.js';
import { InteractionResponder } from '../discord/interaction-responder.js';
import { commandNameForInteraction, parseMediaCustomId } from '../discord/interaction-data.js';
import { isNsfwContext, nsfwErrorPayload } from './nsfw-guard.js';

function componentTarget(customId) {
  if (customId.startsWith('m:')) return parseMediaCustomId(customId);
  if (customId.startsWith('help:')) return { commandName: 'help', state: { customId } };
  if (customId.startsWith('ping:')) return { commandName: 'ping', state: { customId } };
  if (customId.startsWith('intro:')) return { commandName: 'intro', state: { customId } };
  return null;
}

export class InteractionRouter {
  constructor({ commands, rest, gateway, config, mediaHttp, logger }) {
    this.commands = commands;
    this.rest = rest;
    this.gateway = gateway;
    this.config = config;
    this.mediaHttp = mediaHttp;
    this.logger = logger.child({ subsystem: 'interaction-router' });
  }

  async handle(interaction) {
    const responder = new InteractionResponder({ interaction, rest: this.rest });
    if (interaction.type === InteractionType.PING) {
      await responder.pong();
      return;
    }

    let commandName;
    let state = {};
    let source;
    if (interaction.type === InteractionType.APPLICATION_COMMAND || interaction.type === InteractionType.APPLICATION_COMMAND_AUTOCOMPLETE) {
      commandName = commandNameForInteraction(interaction);
      source = interaction.type === InteractionType.APPLICATION_COMMAND_AUTOCOMPLETE ? 'autocomplete' : 'command';
    } else if (interaction.type === InteractionType.MESSAGE_COMPONENT) {
      const target = componentTarget(interaction.data?.custom_id ?? '');
      commandName = target?.commandName;
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

    try {
      if (source === 'autocomplete') {
        if (typeof command.autocomplete === 'function') await command.autocomplete(context);
        else await responder.autocomplete([]);
      } else {
        await command.execute(context, state);
      }
    } catch (error) {
      this.logger.error('Unhandled interaction command error.', {
        command: commandName,
        interactionId: interaction.id,
        error,
      });
      try {
        const data = {
          embeds: [{
            title: '❌ ▸ Error',
            description: 'An unexpected error occurred while executing this interaction.',
            color: 0xed4245,
          }],
          components: [],
        };
        if (source === 'autocomplete' && !responder.acknowledged) await responder.autocomplete([]);
        else if (responder.acknowledged) await responder.editOriginal({ ...data, attachments: [] });
        else await responder.reply({ ...data, flags: 64 });
      } catch (responseError) {
        this.logger.error('Failed to report an interaction error to Discord.', responseError);
      }
    }
  }
}
