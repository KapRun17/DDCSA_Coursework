import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildQuery } from './requestApi.js';

test('request filters are converted to query string', () => {
  const query = buildQuery({
    game: 'Counter-Strike 2',
    role: 'AWPer',
    status: 'OPEN'
  });

  assert.equal(query, '?game=Counter-Strike+2&role=AWPer&status=OPEN');
});

test('empty request filters are skipped', () => {
  const query = buildQuery({
    game: 'Dota 2',
    role: '',
    status: null
  });

  assert.equal(query, '?game=Dota+2');
});

test('empty filter object returns empty query string', () => {
  assert.equal(buildQuery({}), '');
});
