import { BotApplication } from './src/application.js';
import { loadConfig } from './src/config.js';
import { Logger } from './src/lib/logger.js';

let application;

async function main() {
  const config = loadConfig();
  const logger = new Logger(config.logLevel, { application: 'discord-nsfw-bot' });
  application = new BotApplication({ config, logger });

  process.on('unhandledRejection', (error) => logger.error('Unhandled promise rejection.', error));
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception.', error);
    application?.stop();
    process.exitCode = 1;
  });
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, () => {
      logger.event('Received shutdown signal.', { signal });
      application.stop();
    });
  }

  logger.boot('Starting Discord NSFW Media Bot.', {
    node: process.version,
    pid: process.pid,
  });
  await application.start();
}

main().catch((error) => {
  const logger = new Logger('error', { application: 'discord-nsfw-bot' });
  logger.error('Bot startup failed.', error);
  application?.stop();
  process.exitCode = 1;
});
