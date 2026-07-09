'use strict';
const stamp = () => new Date().toISOString();
function line(level, message) { console.log(`[${stamp()}] [${level}] ${message}`); }
module.exports = {
  info: (m) => line('INFO', m),
  warn: (m) => line('WARN', m),
  error: (m) => line('ERROR', m),
  command: (name, user, guild) => line('COMMAND', `/${name} by ${user?.username || 'unknown'} (${user?.id || 'unknown'}) in ${guild || 'DM'}`)
};
