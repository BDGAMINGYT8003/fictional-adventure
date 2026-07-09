const assert = require('assert');
const { COMMANDS, commandPayloads } = require('../src/commands');
const { providers } = require('../src/services/mediaProviders');

const payloads = commandPayloads();
const names = payloads.map((payload) => payload.name);
const requiredProviders = [
    'abd',
    'nekobot',
    'nekosV4',
    'oboobs',
    'obutts',
    'porngifs',
    'porngifsTv',
    'purrbot',
    'sexcom',
    'waifuIm',
    'waifuPics',
];

assert.strictEqual(payloads.length, 39, 'expected exactly 39 commands');
assert.strictEqual(new Set(names).size, names.length, 'command names must be unique');

for (const command of COMMANDS) {
    assert(command.data.name, 'command must expose a data name');
    assert.strictEqual(typeof command.execute, 'function', command.data.name + ' must expose execute()');
}

for (const provider of requiredProviders) {
    assert(providers[provider], 'missing provider implementation: ' + provider);
}

console.log('Validated ' + payloads.length + ' individually declared commands.');
