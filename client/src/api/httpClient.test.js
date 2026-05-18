import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { TOKEN_KEY, httpClient } from './httpClient.js';

const storage = new Map();

globalThis.localStorage = {
  getItem(key) {
    return storage.get(key) ?? null;
  },
  setItem(key, value) {
    storage.set(key, value);
  },
  removeItem(key) {
    storage.delete(key);
  }
};

afterEach(() => {
  storage.clear();
  delete globalThis.fetch;
});

test('httpClient sends JSON headers and JWT token', async () => {
  localStorage.setItem(TOKEN_KEY, 'test-token');

  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/requests');
    assert.equal(options.headers['Content-Type'], 'application/json');
    assert.equal(options.headers.Authorization, 'Bearer test-token');

    return {
      ok: true,
      headers: {
        get() {
          return 'application/json';
        }
      },
      async json() {
        return [{ id: 'request-1' }];
      }
    };
  };

  const payload = await httpClient('/requests');

  assert.deepEqual(payload, [{ id: 'request-1' }]);
});

test('httpClient throws server error message', async () => {
  globalThis.fetch = async () => ({
    ok: false,
    headers: {
      get() {
        return 'application/json';
      }
    },
    async json() {
      return { message: 'Validation error' };
    }
  });

  await assert.rejects(
    () => httpClient('/templates'),
    /Validation error/
  );
});
