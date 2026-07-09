const { Collection } = require('discord.js');
const { MEDIA_COMMANDS } = require('../config/mediaCatalog');
const { createMediaCommand } = require('./mediaFactory');
const gif = require('./gif');
const help = require('./help');
const invite = require('./invite');
const ping = require('./ping');
const solo = require('./solo');
const threesome = require('./threesome');
function loadCommands() {
  const commands = new Collection();
  for (const definition of MEDIA_COMMANDS) {
    const command = createMediaCommand(definition);
    commands.set(command.data.name, command);
  }
  for (const command of [gif, help, invite, ping, solo, threesome]) commands.set(command.data.name, command);
  return commands;
}
function commandPayloads() { return [...loadCommands().values()].map((command) => command.data.toJSON()); }
module.exports = { loadCommands, commandPayloads };
