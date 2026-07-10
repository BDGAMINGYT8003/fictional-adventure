import assert from 'node:assert/strict';
import test from 'node:test';
import { InteractionRouter } from '../src/brain/interaction-router.js';
import { Logger } from '../src/lib/logger.js';

function fixture(commands) {
  const requests = [];
  const rest = {
    async post(route, options) { requests.push({ method: 'POST', route, options }); return null; },
    async patch(route, options) { requests.push({ method: 'PATCH', route, options }); return null; },
  };
  const router = new InteractionRouter({
    commands,
    rest,
    gateway: {},
    config: { maxMediaBytes: 10 * 1024 * 1024 },
    mediaHttp: { withMaximumBytes: () => ({}) },
    logger: new Logger('error'),
  });
  return { requests, router };
}

function interaction(type, data, overrides = {}) {
  return {
    id: '123456789012345678',
    application_id: '234567890123456789',
    token: 'interaction-token',
    type,
    data,
    user: { id: '345678901234567890', username: 'tester' },
    attachment_size_limit: 10 * 1024 * 1024,
    ...overrides,
  };
}

test('router rejects media commands outside guild NSFW channels before execution', async () => {
  let executed = false;
  const commands = new Map([['media', {
    data: { name: 'media', nsfw: true },
    async execute() { executed = true; },
  }]]);
  const { requests, router } = fixture(commands);
  await router.handle(interaction(2, { name: 'media' }, {
    guild_id: '456789012345678901',
    channel: { type: 0, nsfw: false },
  }));
  assert.equal(executed, false);
  assert.equal(requests[0].options.body.type, 4);
  assert.equal(requests[0].options.body.data.flags, 64);
});

test('router decodes media component state and executes the target command', async () => {
  let captured;
  const commands = new Map([['anal', {
    data: { name: 'anal', nsfw: true },
    async execute(context, state) {
      captured = { source: context.source, state };
      await context.responder.reply({ content: 'ok', flags: 64 });
    },
  }]]);
  const { requests, router } = fixture(commands);
  await router.handle(interaction(3, { custom_id: 'm:anal:style=Anime' }, {
    channel: { type: 1 },
  }));
  assert.deepEqual(captured, { source: 'component', state: { style: 'Anime' } });
  assert.equal(requests[0].options.body.data.content, 'ok');
});

test('stale autocomplete interactions receive an empty autocomplete result', async () => {
  const { requests, router } = fixture(new Map());
  await router.handle(interaction(4, {
    name: 'missing',
    options: [{ name: 'query', value: 'a', focused: true }],
  }));
  assert.equal(requests[0].options.body.type, 8);
  assert.deepEqual(requests[0].options.body.data.choices, []);
});
