import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCommands } from './brain/command-loader.js';
import { registerCommands } from './brain/command-registration.js';
import { InteractionRouter } from './brain/interaction-router.js';
import { MessageRouter } from './brain/message-router.js';
import { MediaHttpClient } from './brain/providers/http.js';
import { DiscordGatewayClient } from './discord/gateway-client.js';
import { DiscordRestClient } from './discord/rest-client.js';

const sourceDirectory = path.dirname(fileURLToPath(import.meta.url));

export class BotApplication {
  constructor({ config, logger }) {
    this.config = config;
    this.logger = logger;
    this.rest = new DiscordRestClient({
      token: config.botToken,
      logger,
    });
    this.gateway = new DiscordGatewayClient({
      token: config.botToken,
      intents: config.gatewayIntents,
      rest: this.rest,
      logger,
    });
    this.commands = null;
    this.interactionRouter = null;
    this.messageRouter = null;
    this.stopping = false;
  }

  async start() {
    this.commands = await loadCommands(path.join(sourceDirectory, 'commands'), this.logger);
    await registerCommands({
      rest: this.rest,
      clientId: this.config.clientId,
      guildId: this.config.testingGuildId,
      mode: this.config.registrationMode,
      commands: this.commands,
      logger: this.logger,
    });

    const mediaHttp = new MediaHttpClient({
      timeoutMs: this.config.mediaTimeoutMs,
      maximumBytes: this.config.maxMediaBytes,
      logger: this.logger,
    });
    this.interactionRouter = new InteractionRouter({
      commands: this.commands,
      rest: this.rest,
      gateway: this.gateway,
      config: this.config,
      mediaHttp,
      logger: this.logger,
    });
    this.messageRouter = new MessageRouter({
      rest: this.rest,
      gateway: this.gateway,
      logger: this.logger,
    });

    this.gateway.on('INTERACTION_CREATE', (interaction) => {
      void this.interactionRouter.handle(interaction);
    });
    this.gateway.on('MESSAGE_CREATE', (message) => {
      void this.messageRouter.handle(message).catch((error) => {
        this.logger.error('Unhandled message router error.', error);
      });
    });
    this.gateway.on('ready', (ready) => {
      if (ready.user?.id !== this.config.clientId) {
        this.logger.warn('CLIENT_ID does not match the authenticated bot user ID.', {
          configuredClientId: this.config.clientId,
          authenticatedUserId: ready.user?.id,
        });
      }
    });
    this.gateway.on('fatal', (error) => {
      this.logger.error('Discord Gateway reported a fatal session error.', error);
      this.stop();
      process.exitCode = 1;
    });

    await this.gateway.connect();
    this.logger.info('Bot startup completed; awaiting Discord Gateway READY.', {
      commands: [...this.commands.values()].filter((command) => !command.hidden).length,
      registrationMode: this.config.registrationMode,
    });
  }

  stop() {
    if (this.stopping) return;
    this.stopping = true;
    this.gateway.stop();
    this.logger.info('Bot stopped.');
  }
}
