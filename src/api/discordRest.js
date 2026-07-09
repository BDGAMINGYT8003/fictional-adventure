'use strict';

const { DISCORD_API_BASE } = require('../config/discord');

class DiscordRest {
  constructor(token) { this.token = token; }
  async request(method, path, body) {
    const response = await fetch(`${DISCORD_API_BASE}${path}`, { method, headers: { Authorization: `Bot ${this.token}`, 'Content-Type': 'application/json', 'User-Agent': 'Discord-NSFW-Bot (raw-api, 2.0.0)' }, body: body === undefined ? undefined : JSON.stringify(body) });
    const text = await response.text(); const data = text ? JSON.parse(text) : null;
    if (!response.ok) throw new Error(`${method} ${path} failed (${response.status}): ${text}`);
    return data;
  }
  registerGlobalCommands(applicationId, commands) { return this.request('PUT', `/applications/${applicationId}/commands`, commands); }
  createInteractionResponse(interactionId, token, payload) { return this.request('POST', `/interactions/${interactionId}/${token}/callback`, payload); }
  async editOriginalInteractionResponse(applicationId, token, payload) {
    if (!payload.attachments) return this.request('PATCH', `/webhooks/${applicationId}/${token}/messages/@original`, payload);
    const form = new FormData();
    const files = payload.attachments || [];
    const publicPayload = { ...payload, attachments: files.map(file => ({ id: file.id, filename: file.filename })) };
    form.append('payload_json', JSON.stringify(publicPayload));
    for (const file of files) form.append(`files[${file.id}]`, new Blob([file.data]), file.filename);
    const response = await fetch(`${DISCORD_API_BASE}/webhooks/${applicationId}/${token}/messages/@original`, { method: 'PATCH', headers: { Authorization: `Bot ${this.token}`, 'User-Agent': 'Discord-NSFW-Bot (raw-api, 2.0.0)' }, body: form });
    const text = await response.text(); const data = text ? JSON.parse(text) : null;
    if (!response.ok) throw new Error(`PATCH webhook failed (${response.status}): ${text}`);
    return data;
  }
}
module.exports = { DiscordRest };
