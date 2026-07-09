'use strict';
const API = 'https://discord.com/api/v10';
const CALLBACK = { PONG: 1, CHANNEL_MESSAGE_WITH_SOURCE: 4, DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE: 5, DEFERRED_UPDATE_MESSAGE: 6, UPDATE_MESSAGE: 7, MODAL: 9 };
const FLAGS = { EPHEMERAL: 1 << 6 };
const OPTION = { STRING: 3 };
const COMPONENT = { ACTION_ROW: 1, BUTTON: 2, TEXT_INPUT: 4 };
const BUTTON = { PRIMARY: 1, LINK: 5 };
const TEXT_STYLE = { SHORT: 1 };
function colorInt(hex) { return parseInt(hex.replace('#', ''), 16); }
function randomColor() { return Math.floor(Math.random() * 0xffffff); }
function avatarUrl(user) { return user?.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128` : undefined; }
function footer(user) { return { text: `${user?.username || 'User'} | Today at ${new Date().toLocaleTimeString()}`, icon_url: avatarUrl(user) }; }
async function request(path, { method = 'GET', token = process.env.BOT_TOKEN, body, headers = {} } = {}) {
  const res = await fetch(`${API}${path}`, { method, headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json', ...headers }, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(`${method} ${path} failed (${res.status}): ${text}`);
  return data;
}
async function callback(interaction, type, data) { return request(`/interactions/${interaction.id}/${interaction.token}/callback`, { method: 'POST', body: { type, data } }); }
async function defer(interaction, update = false, ephemeral = false) { return callback(interaction, update ? CALLBACK.DEFERRED_UPDATE_MESSAGE : CALLBACK.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE, ephemeral ? { flags: FLAGS.EPHEMERAL } : undefined); }
async function edit(interaction, payload) { return request(`/webhooks/${process.env.CLIENT_ID}/${interaction.token}/messages/@original`, { method: 'PATCH', headers: {}, body: payload }); }
function embed({ title, description, image, user, color = randomColor() }) { const e = { title, description, color, footer: footer(user) }; if (image) e.image = { url: image }; return e; }
function buttons(customId, url) { return [{ type: COMPONENT.ACTION_ROW, components: [{ type: COMPONENT.BUTTON, style: BUTTON.PRIMARY, custom_id: customId, label: '🔄 ▸ Refresh' }, { type: COMPONENT.BUTTON, style: BUTTON.LINK, url, label: '📎 ▸ Link' }] }]; }
function getOption(interaction, name) { return interaction.data?.options?.find(o => o.name === name)?.value || null; }
module.exports = { API, CALLBACK, FLAGS, OPTION, COMPONENT, BUTTON, TEXT_STYLE, colorInt, randomColor, avatarUrl, footer, request, callback, defer, edit, embed, buttons, getOption };
