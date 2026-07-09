const test = require('node:test');
const assert = require('node:assert/strict');
const { commandPayloads } = require('../src/commands');

test('all command payloads serialize with unique names', () => {
  const payloads = commandPayloads();
  const names = payloads.map((payload) => payload.name);
  assert.equal(new Set(names).size, names.length);
  assert.ok(names.includes('help'));
  assert.ok(names.includes('gif'));
  assert.ok(names.includes('waifu'));
});
