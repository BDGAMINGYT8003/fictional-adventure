import assert from 'node:assert/strict';
import test from 'node:test';
import { InteractionResponder } from '../src/discord/interaction-responder.js';

function fixture() {
  const requests = [];
  const rest = {
    async post(route, options) { requests.push({ method: 'POST', route, options }); return null; },
    async patch(route, options) { requests.push({ method: 'PATCH', route, options }); return { id: 'message' }; },
  };
  const interaction = {
    id: '123456789012345678',
    application_id: '234567890123456789',
    token: 'interaction-token',
  };
  return { requests, responder: new InteractionResponder({ interaction, rest }) };
}

test('interaction replies use the raw callback endpoint exactly once', async () => {
  const { requests, responder } = fixture();
  await responder.reply({ content: 'hello', flags: 64 });
  assert.equal(responder.acknowledged, true);
  assert.deepEqual(requests[0], {
    method: 'POST',
    route: '/interactions/123456789012345678/interaction-token/callback',
    options: {
      body: { type: 4, data: { content: 'hello', flags: 64 } },
      auth: false,
      query: { with_response: false },
    },
  });
  await assert.rejects(responder.defer(), /only be acknowledged once/);
});

test('deferred interactions edit the original webhook response with files', async () => {
  const { requests, responder } = fixture();
  await responder.deferUpdate();
  const files = [{ name: 'media.gif', data: Buffer.from('gif') }];
  await responder.editOriginal({ attachments: [{ id: 0, filename: 'media.gif' }] }, files);
  assert.equal(requests[0].options.body.type, 6);
  assert.deepEqual(requests[1], {
    method: 'PATCH',
    route: '/webhooks/234567890123456789/interaction-token/messages/@original',
    options: {
      body: { attachments: [{ id: 0, filename: 'media.gif' }] },
      files,
      auth: false,
    },
  });
});
