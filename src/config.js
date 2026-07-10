import { BOT_GATEWAY_INTENTS } from './discord/constants.js';

const SNOWFLAKE_PATTERN = /^\d{17,20}$/;
const REGISTRATION_MODES = new Set(['global', 'guild', 'both']);
const LOG_LEVELS = new Set(['debug', 'info', 'warn', 'error']);

function booleanValue(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

function integerValue(value, fallback, { minimum, maximum }) {
  const parsed = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(maximum, Math.max(minimum, parsed));
}

function required(env, name, allowMissing) {
  const value = env[name]?.trim();
  if (!value && !allowMissing) throw new Error(`Missing required environment variable: ${name}`);
  return value ?? '';
}

function optionalSnowflake(value, name) {
  const normalized = value?.trim() ?? '';
  if (normalized && !SNOWFLAKE_PATTERN.test(normalized)) {
    throw new Error(`${name} must be a Discord snowflake.`);
  }
  return normalized || null;
}

export function loadConfig(env = process.env, { allowMissing = false } = {}) {
  const botToken = required(env, 'BOT_TOKEN', allowMissing);
  const clientId = required(env, 'CLIENT_ID', allowMissing);

  if (clientId && !SNOWFLAKE_PATTERN.test(clientId)) {
    throw new Error('CLIENT_ID must be a Discord application snowflake.');
  }

  const registrationMode = env.COMMAND_REGISTRATION_MODE?.trim().toLowerCase() || 'global';
  if (!REGISTRATION_MODES.has(registrationMode)) {
    throw new Error('COMMAND_REGISTRATION_MODE must be global, guild, or both.');
  }

  const testingGuildId = optionalSnowflake(env.TESTING_GUILD_ID, 'TESTING_GUILD_ID');
  if ((registrationMode === 'guild' || registrationMode === 'both') && !testingGuildId) {
    throw new Error(`${registrationMode} command registration requires TESTING_GUILD_ID.`);
  }

  const logLevel = env.LOG_LEVEL?.trim().toLowerCase() || 'info';
  if (!LOG_LEVELS.has(logLevel)) throw new Error('LOG_LEVEL must be debug, info, warn, or error.');

  return Object.freeze({
    botToken,
    clientId,
    testingGuildId,
    registrationMode,
    gatewayIntents: BOT_GATEWAY_INTENTS,
    mediaTimeoutMs: integerValue(env.MEDIA_TIMEOUT_MS, 15_000, { minimum: 1_000, maximum: 60_000 }),
    maxMediaBytes: integerValue(env.MAX_MEDIA_BYTES, 10 * 1024 * 1024, { minimum: 64 * 1024, maximum: 25 * 1024 * 1024 }),
    waifuImKey: env.WAIFU_IM_KEY?.trim() || null,
    nekoBotAuthorization: env.NEKOBOT_AUTHORIZATION?.trim() || null,
    waifuPicsEnabled: booleanValue(env.WAIFU_PICS, false),
    allowInsecureMediaTls: booleanValue(env.ALLOW_INSECURE_MEDIA_TLS, false),
    logLevel,
  });
}
