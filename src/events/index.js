const interactionCreate = require('./interactionCreate');
const ready = require('./ready');
function registerEvents(client) { for (const event of [interactionCreate, ready]) { if (event.once) client.once(event.name, (...args) => event.execute(...args)); else client.on(event.name, (...args) => event.execute(...args)); } }
module.exports = { registerEvents };
