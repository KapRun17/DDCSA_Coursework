const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');

const app = require('../app');

let server;
let baseUrl;

before(async () => {
  // Тестовый сервер запускается на свободном локальном порту.
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const { port } = server.address();
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

after(async () => {
  // Корректное закрытие HTTP-сервера после тестов.
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
});

test('GET / возвращает описание API', async () => {
  const response = await fetch(`${baseUrl}/`);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.message, 'DDCSA Coursework API');
});

test('GET /api/health возвращает статус ok', async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.status, 'ok');
  assert.match(payload.timestamp, /^\d{4}-\d{2}-\d{2}T/);
});
