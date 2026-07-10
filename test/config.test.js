import assert from 'node:assert/strict';
import test from 'node:test';
import { loadConfig } from '../src/config.js';

const required = {
  BOT_TOKEN: 'bot-token',
  CLIENT_ID: '12345678901234567',
};

test('configuration uses documented secure defaults', () => {
  const config = loadConfig(required);
  assert.equal(config.registrationMode, 'global');
  assert.equal(config.waifuPicsEnabled, false);
  assert.equal(config.allowInsecureMediaTls, false);
  assert.equal(config.mediaTimeoutMs, 15_000);
  assert.equal(config.maxMediaBytes, 10 * 1024 * 1024);
  assert.equal(config.gatewayIntents, 4_609);
});

test('guild registration requires a valid testing guild snowflake', () => {
  assert.throws(
    () => loadConfig({ ...required, COMMAND_REGISTRATION_MODE: 'guild' }),
    /requires TESTING_GUILD_ID/,
  );
  assert.throws(
    () => loadConfig({ ...required, COMMAND_REGISTRATION_MODE: 'guild', TESTING_GUILD_ID: 'not-an-id' }),
    /must be a Discord snowflake/,
  );
});

test('required Discord credentials fail fast', () => {
  assert.throws(() => loadConfig({}), /BOT_TOKEN/);
  assert.throws(() => loadConfig({ BOT_TOKEN: 'token' }), /CLIENT_ID/);
});
