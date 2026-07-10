import assert from 'node:assert/strict';
import test from 'node:test';
import {
  decodeState,
  encodeState,
  focusedOption,
  mediaCustomId,
  modalValue,
  optionValue,
  parseMediaCustomId,
} from '../src/discord/interaction-data.js';

test('interaction options are read recursively', () => {
  const interaction = { data: { options: [{ name: 'group', options: [{ name: 'style', value: 'Anime' }] }] } };
  assert.equal(optionValue(interaction, 'style'), 'Anime');
});

test('focused autocomplete option is found recursively', () => {
  const interaction = { data: { options: [{ name: 'command', value: 'he', focused: true }] } };
  assert.deepEqual(focusedOption(interaction), { name: 'command', value: 'he', focused: true });
});

test('modal values are extracted from action rows', () => {
  const interaction = { data: { components: [{ components: [{ custom_id: 'search_query', value: 'ping' }] }] } };
  assert.equal(modalValue(interaction, 'search_query'), 'ping');
});

test('component state round trips safely', () => {
  const state = { style: 'Anime', phrase: 'two words' };
  assert.deepEqual(decodeState(encodeState(state)), state);
  assert.deepEqual(parseMediaCustomId(mediaCustomId('anal', state)), { commandName: 'anal', state });
});
