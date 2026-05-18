import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  GAME_OPTIONS,
  buildSelectOptions,
  getTemplateOptions,
  normalizeOptionalValue
} from './templateOptions.js';

test('game template options contain main supported games', () => {
  assert.ok(GAME_OPTIONS.includes('Counter-Strike 2'));
  assert.ok(GAME_OPTIONS.includes('Dota 2'));
  assert.ok(GAME_OPTIONS.includes('Valorant'));
});

test('Counter-Strike 2 template options provide game-specific roles and ranks', () => {
  const options = getTemplateOptions('Counter-Strike 2');

  assert.ok(options.roles.includes('AWPer'));
  assert.ok(options.roles.includes('IGL'));
  assert.ok(options.ranks.includes('Premier 15000+'));
});

test('unknown game receives default template options', () => {
  const options = getTemplateOptions('Unknown Game');

  assert.ok(options.roles.length > 0);
  assert.ok(options.ranks.length > 0);
});

test('optional placeholder value is normalized before sending form data', () => {
  const options = getTemplateOptions('Dota 2');

  assert.equal(normalizeOptionalValue(options.roles[0]), '');
  assert.equal(normalizeOptionalValue('Carry'), 'Carry');
});

test('custom saved value is preserved in select options', () => {
  const options = buildSelectOptions(['AWPer', 'IGL'], 'Coach');

  assert.deepEqual(options, ['AWPer', 'IGL', 'Coach']);
});
