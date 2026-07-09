'use strict';

const API_VERSION = 10;
const DISCORD_API_BASE = `https://discord.com/api/v${API_VERSION}`;
const DISCORD_GATEWAY_URL = `wss://gateway.discord.gg/?v=${API_VERSION}&encoding=json`;

const InteractionResponseType = Object.freeze({
  PONG: 1,
  CHANNEL_MESSAGE_WITH_SOURCE: 4,
  DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE: 5,
  DEFERRED_UPDATE_MESSAGE: 6,
  UPDATE_MESSAGE: 7,
  MODAL: 9,
});

const ApplicationCommandOptionType = Object.freeze({ STRING: 3 });
const ComponentType = Object.freeze({ ACTION_ROW: 1, BUTTON: 2 });
const ButtonStyle = Object.freeze({ PRIMARY: 1, LINK: 5 });

module.exports = { API_VERSION, DISCORD_API_BASE, DISCORD_GATEWAY_URL, InteractionResponseType, ApplicationCommandOptionType, ComponentType, ButtonStyle };
