'use strict';
const { ComponentType, ButtonStyle } = require('../config/discord');
function randomColor() { return Math.floor(Math.random() * 0xffffff); }
function embed(title, url, user, source) { return { title, image: { url }, color: randomColor(), footer: { text: `${user?.username || 'User'} | Today at ${new Date().toLocaleTimeString()}${source ? ` | ${source}` : ''}`, icon_url: user?.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : undefined } }; }
function errorEmbed(description) { return { title: '❌ ▸ Error', description, color: 0xff0000 }; }
function components(refreshId, link) { return [{ type: ComponentType.ACTION_ROW, components: [{ type: ComponentType.BUTTON, custom_id: refreshId, label: '🔄 ▸ Refresh', style: ButtonStyle.PRIMARY }, { type: ComponentType.BUTTON, label: '📎 ▸ Link', url: link, style: ButtonStyle.LINK }] }]; }
module.exports = { embed, errorEmbed, components };
