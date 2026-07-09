const test = require('node:test');
const assert = require('node:assert/strict');
const { COMMANDS, commandPayloads } = require('../src/commands');

test('all command payloads serialize with unique names', () => {
    const payloads = commandPayloads();
    const names = payloads.map((payload) => payload.name);

    assert.equal(payloads.length, 39);
    assert.equal(new Set(names).size, names.length);
    assert.ok(names.includes('help'));
    assert.ok(names.includes('gif'));
    assert.ok(names.includes('waifu'));
});

test('every command is individually declared', () => {
    for (const command of COMMANDS) {
        assert.equal(typeof command.execute, 'function');
        assert.ok(command.data.name);
    }
});
