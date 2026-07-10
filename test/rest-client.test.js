import assert from 'node:assert/strict';
import test from 'node:test';
import { DiscordRestClient, DiscordRestError } from '../src/discord/rest-client.js';
import { Logger } from '../src/lib/logger.js';

function client(fetchImpl, overrides = {}) {
  return new DiscordRestClient({
    token: 'secret-token',
    logger: new Logger('error'),
    fetchImpl,
    ...overrides,
  });
}

test('REST requests use API v10 and bot authorization', async () => {
  let request;
  const rest = client(async (url, options) => {
    request = { url, options };
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  });
  const result = await rest.get('/gateway/bot');
  assert.deepEqual(result, { ok: true });
  assert.equal(request.url.toString(), 'https://discord.com/api/v10/gateway/bot');
  assert.equal(request.options.headers.get('Authorization'), 'Bot secret-token');
});

test('unauthenticated interaction callbacks omit bot authorization', async () => {
  let authorization;
  const rest = client(async (_url, options) => {
    authorization = options.headers.get('Authorization');
    return new Response(null, { status: 204 });
  });
  await rest.post('/interactions/123/token/callback', { auth: false, body: { type: 1 } });
  assert.equal(authorization, null);
});

test('429 responses honor retry_after and retry once', async () => {
  let calls = 0;
  let clock = 0;
  const waits = [];
  const rest = client(async () => {
    calls += 1;
    if (calls === 1) {
      return new Response(JSON.stringify({ message: 'rate limited', retry_after: 0.01, global: false }), {
        status: 429,
        headers: { 'content-type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }, {
    now: () => clock,
    sleep: async (milliseconds) => {
      waits.push(milliseconds);
      clock += milliseconds;
    },
  });
  assert.deepEqual(await rest.get('/gateway/bot'), { success: true });
  assert.equal(calls, 2);
  assert.ok(waits.some((milliseconds) => milliseconds >= 10));
});

test('Discord API errors expose status and JSON code without retries', async () => {
  let calls = 0;
  const rest = client(async () => {
    calls += 1;
    return new Response(JSON.stringify({ message: '401: Unauthorized', code: 0 }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
  });
  await assert.rejects(
    rest.get('/users/@me'),
    (error) => error instanceof DiscordRestError && error.status === 401 && error.code === 0,
  );
  assert.equal(calls, 1);
});
