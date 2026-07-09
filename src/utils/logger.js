const chalk = require('chalk');
const stamp = () => new Date().toISOString();
const write = (level, color, message) => console.log(color(`[${stamp()}] [${level}] ${message}`));
module.exports = {
  info: (m) => write('INFO', chalk.cyan, m),
  success: (m) => write('OK', chalk.green, m),
  warn: (m) => write('WARN', chalk.yellow, m),
  error: (m) => write('ERROR', chalk.red, m),
  command: (name, user, guild) => write('COMMAND', chalk.magenta, `/${name} by ${user} in ${guild}`)
};
