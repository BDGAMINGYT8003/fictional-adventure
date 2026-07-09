'use strict';
const WebSocket = require('ws');
const { DISCORD_GATEWAY_URL } = require('../config/discord');
const { logInfo, logWarn, logError } = require('./logger');
class GatewayClient {
  constructor(token, onDispatch) { this.token = token; this.onDispatch = onDispatch; this.seq = null; this.sessionId = null; this.heartbeatMs = null; this.lastHeartbeatAck = Date.now(); this.lastHeartbeatSent = null; this.latency = null; }
  connect() { this.ws = new WebSocket(DISCORD_GATEWAY_URL); this.ws.on('message', raw => this.handle(JSON.parse(raw))); this.ws.on('close', () => { logWarn('Gateway closed; reconnecting in 5s'); clearInterval(this.heartbeatTimer); setTimeout(() => this.connect(), 5000); }); this.ws.on('error', e => logError(`Gateway error: ${e.message}`)); }
  send(op, d) { this.ws.send(JSON.stringify({ op, d })); }
  identify() { this.send(2, { token: this.token, intents: 513, properties: { os: process.platform, browser: 'raw-discord-api', device: 'raw-discord-api' } }); }
  heartbeat() { this.lastHeartbeatSent = Date.now(); this.send(1, this.seq); }
  handle(packet) { if (packet.s) this.seq = packet.s; if (packet.op === 10) { this.heartbeatMs = packet.d.heartbeat_interval; this.heartbeat(); this.heartbeatTimer = setInterval(() => this.heartbeat(), this.heartbeatMs); this.identify(); return; } if (packet.op === 11) { this.lastHeartbeatAck = Date.now(); this.latency = this.lastHeartbeatSent ? this.lastHeartbeatAck - this.lastHeartbeatSent : null; return; } if (packet.op === 0) { if (packet.t === 'READY') { this.sessionId = packet.d.session_id; logInfo(`Gateway ready as ${packet.d.user.username}`); } this.onDispatch(packet.t, packet.d, this.latency); } }
}
module.exports = { GatewayClient };
