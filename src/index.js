'use strict';
const WebSocket = require('ws');
const { request, callback, CALLBACK, FLAGS } = require('./discord');
const commands = require('./commands');
const log = require('./logger');
const INTENTS = 1; // GUILDS, enough for INTERACTION_CREATE over Gateway.
let ws, seq = null, sessionId = null, resumeGatewayUrl = null, heartbeatTimer = null;
function send(op, d) { if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ op, d })); }
function identify() { send(2, { token: process.env.BOT_TOKEN, intents: INTENTS, properties: { os: process.platform, browser: 'raw-discord-api', device: 'raw-discord-api' } }); }
function heartbeat() { send(1, seq); }
function connect(url) {
  ws = new WebSocket(`${url}?v=10&encoding=json`);
  ws.on('open', () => log.info('Gateway socket opened.'));
  ws.on('message', async raw => {
    const packet = JSON.parse(raw.toString());
    if (packet.s !== null && packet.s !== undefined) seq = packet.s;
    if (packet.op === 10) { clearInterval(heartbeatTimer); heartbeatTimer = setInterval(heartbeat, packet.d.heartbeat_interval); heartbeat(); identify(); return; }
    if (packet.op === 11) return;
    if (packet.op === 7) { ws.close(4000, 'Discord requested reconnect'); return; }
    if (packet.op === 9) { sessionId = null; seq = null; ws.close(4001, 'Invalid session'); return; }
    if (packet.op !== 0) return;
    if (packet.t === 'READY') { sessionId = packet.d.session_id; resumeGatewayUrl = packet.d.resume_gateway_url; log.info(`Ready as ${packet.d.user.username}#${packet.d.user.discriminator || '0'}.`); }
    if (packet.t === 'RESUMED') log.info('Gateway session resumed.');
    if (packet.t === 'INTERACTION_CREATE') await handleInteraction(packet.d);
  });
  ws.on('close', (code, reason) => { clearInterval(heartbeatTimer); log.warn(`Gateway closed (${code}) ${reason}`); setTimeout(start, 5000); });
  ws.on('error', err => log.error(`Gateway error: ${err.message}`));
}
async function handleInteraction(interaction) {
  try {
    if (interaction.type === 1) return callback(interaction, CALLBACK.PONG);
    const user = interaction.member?.user || interaction.user;
    const name = interaction.data?.name || interaction.data?.custom_id;
    log.command(name, user, interaction.guild_id || 'DM');
    if (interaction.guild_id && interaction.channel && interaction.channel.nsfw === false && !['help','invite','ping'].includes(interaction.data?.name)) {
      return callback(interaction, CALLBACK.CHANNEL_MESSAGE_WITH_SOURCE, { flags: FLAGS.EPHEMERAL, embeds: [{ title: '❌ ▸ Not NSFW channel', description: 'This command can only be used in NSFW channels. Please use this command in a channel marked as NSFW.', color: 0xff0000 }] });
    }
    if (interaction.type === 2) return commands.execute(interaction);
    if (interaction.type === 3 && interaction.data?.custom_id?.startsWith('refresh_')) return commands.refresh(interaction);
  } catch (err) {
    log.error(`Interaction failed: ${err.stack || err.message}`);
    try { await callback(interaction, CALLBACK.CHANNEL_MESSAGE_WITH_SOURCE, { flags: FLAGS.EPHEMERAL, content: 'There was an error while executing this interaction.' }); } catch (_) {}
  }
}
async function start() {
  if (!process.env.BOT_TOKEN || !process.env.CLIENT_ID) throw new Error('Missing BOT_TOKEN or CLIENT_ID environment variables.');
  if (sessionId && resumeGatewayUrl) {
    ws = new WebSocket(`${resumeGatewayUrl}?v=10&encoding=json`);
    ws.on('open', () => send(6, { token: process.env.BOT_TOKEN, session_id: sessionId, seq }));
    ws.on('message', raw => { const p = JSON.parse(raw.toString()); if (p.s !== null && p.s !== undefined) seq = p.s; if (p.op === 10) { clearInterval(heartbeatTimer); heartbeatTimer = setInterval(heartbeat, p.d.heartbeat_interval); heartbeat(); } if (p.op === 0 && p.t === 'INTERACTION_CREATE') handleInteraction(p.d); });
    ws.on('close', () => { sessionId = null; setTimeout(start, 5000); });
    return;
  }
  const gateway = await request('/gateway/bot');
  connect(gateway.url);
}
start().catch(err => { log.error(err.stack || err.message); process.exit(1); });
