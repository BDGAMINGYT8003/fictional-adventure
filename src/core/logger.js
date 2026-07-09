'use strict';

function stamp() { return new Date().toISOString(); }
function logInfo(message) { console.log(`[${stamp()}] [INFO] ${message}`); }
function logWarn(message) { console.warn(`[${stamp()}] [WARN] ${message}`); }
function logError(message) { console.error(`[${stamp()}] [ERROR] ${message}`); }
function logCommand(name, userId, guildId) { logInfo(`/${name} by ${userId} in ${guildId || 'DM'}`); }

module.exports = { logInfo, logWarn, logError, logCommand };
