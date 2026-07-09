'use strict';
const fs = require('fs');
const path = require('path');
function loadCommands() { const dir = path.join(__dirname, '..', 'commands'); const map = new Map(); for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.js') && f !== 'mediaDefinitions.js')) { const cmd = require(path.join(dir, file)); if (cmd?.data?.name && typeof cmd.execute === 'function') map.set(cmd.data.name, cmd); } return map; }
module.exports = { loadCommands };
