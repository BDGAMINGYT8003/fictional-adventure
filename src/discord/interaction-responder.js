import { InteractionResponseType } from './constants.js';

export class InteractionResponder {
  constructor({ interaction, rest }) {
    this.interaction = interaction;
    this.rest = rest;
    this.acknowledged = false;
  }

  async pong() {
    return this.#callback(InteractionResponseType.PONG);
  }

  async reply(data) {
    return this.#callback(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE, data);
  }

  async defer({ ephemeral = false } = {}) {
    const data = ephemeral ? { flags: 64 } : undefined;
    return this.#callback(InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE, data);
  }

  async deferUpdate() {
    return this.#callback(InteractionResponseType.DEFERRED_UPDATE_MESSAGE);
  }

  async update(data) {
    return this.#callback(InteractionResponseType.UPDATE_MESSAGE, data);
  }

  async autocomplete(choices) {
    return this.#callback(InteractionResponseType.APPLICATION_COMMAND_AUTOCOMPLETE_RESULT, { choices });
  }

  async modal(data) {
    return this.#callback(InteractionResponseType.MODAL, data);
  }

  async editOriginal(data, files = []) {
    if (!this.acknowledged) throw new Error('Cannot edit an interaction response before acknowledging it.');
    return this.rest.patch(
      `/webhooks/${this.interaction.application_id}/${this.interaction.token}/messages/@original`,
      { body: data, files, auth: false },
    );
  }

  async followup(data, files = []) {
    if (!this.acknowledged) throw new Error('Cannot send a followup before acknowledging the interaction.');
    return this.rest.post(
      `/webhooks/${this.interaction.application_id}/${this.interaction.token}`,
      { body: data, files, auth: false, query: { wait: true } },
    );
  }

  async #callback(type, data) {
    if (this.acknowledged) throw new Error('Discord interactions can only be acknowledged once.');
    const body = data === undefined ? { type } : { type, data };
    const result = await this.rest.post(
      `/interactions/${this.interaction.id}/${this.interaction.token}/callback`,
      { body, auth: false, query: { with_response: false } },
    );
    this.acknowledged = true;
    return result;
  }
}
