import assert from 'node:assert/strict';
import path from 'node:path';
import { after, before, beforeEach, test } from 'node:test';

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const storage = new Map();

// Изолированное хранилище сессии для серверного отображения компонентов.
globalThis.localStorage = {
  clear() {
    storage.clear();
  },
  getItem(key) {
    return storage.get(key) ?? null;
  },
  removeItem(key) {
    storage.delete(key);
  },
  setItem(key, value) {
    storage.set(key, String(value));
  }
};

let vite;
let AdminPage;
let LoginPage;
let LogoutButton;
let MemoryRouter;
let NotFoundPage;

function renderWithRouter(Component) {
  return renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      null,
      React.createElement(Component)
    )
  );
}

function setSession(role) {
  localStorage.setItem('ddcsa_access_token', `${role.toLowerCase()}-token`);
  localStorage.setItem('ddcsa_current_user', JSON.stringify({
    id: `${role.toLowerCase()}-1`,
    name: role.toLowerCase(),
    role
  }));
}

before(async () => {
  // Vite преобразует JSX тем же способом, который используется при сборке клиента.
  vite = await createServer({
    appType: 'custom',
    logLevel: 'silent',
    resolve: {
      alias: [
        {
          find: /^react-router-dom$/,
          replacement: path.resolve('node_modules/react-router-dom/dist/index.mjs')
        },
        {
          find: /^react-router$/,
          replacement: path.resolve('node_modules/react-router/dist/development/index.mjs')
        }
      ]
    },
    server: { middlewareMode: true },
    ssr: { noExternal: ['react-router', 'react-router-dom'] }
  });

  ({ MemoryRouter } = await vite.ssrLoadModule('react-router-dom'));
  ({ default: AdminPage } = await vite.ssrLoadModule('/src/pages/AdminPage.jsx'));
  ({ default: LoginPage } = await vite.ssrLoadModule('/src/pages/LoginPage.jsx'));
  ({ default: LogoutButton } = await vite.ssrLoadModule('/src/components/LogoutButton.jsx'));
  ({ default: NotFoundPage } = await vite.ssrLoadModule('/src/pages/NotFoundPage.jsx'));
});

beforeEach(() => {
  localStorage.clear();
});

after(async () => {
  await vite?.close();
});

test('LoginPage renders authentication controls', () => {
  const html = renderWithRouter(LoginPage);

  assert.match(html, /class="card authCard"/);
  assert.match(html, /name="email"/);
  assert.match(html, /type="password"/);
  assert.match(html, /href="\/register"/);
});

test('AdminPage denies administrative UI to a regular user', () => {
  setSession('USER');
  const html = renderWithRouter(AdminPage);

  assert.match(html, /Недостаточно прав/);
  assert.doesNotMatch(html, /adminGrid/);
});

test('AdminPage renders the administrative workspace for an administrator', () => {
  setSession('ADMIN');
  const html = renderWithRouter(AdminPage);

  assert.match(html, /adminHero/);
  assert.match(html, /Загрузка данных панели администратора/);
  assert.doesNotMatch(html, /Недостаточно прав/);
});

test('NotFoundPage offers login only to an anonymous visitor', () => {
  const anonymousHtml = renderWithRouter(NotFoundPage);
  assert.match(anonymousHtml, /notFoundPage/);
  assert.match(anonymousHtml, /href="\/login"/);

  setSession('USER');
  const authenticatedHtml = renderWithRouter(NotFoundPage);
  assert.doesNotMatch(authenticatedHtml, /href="\/login"/);
});

test('LogoutButton renders the session termination control', () => {
  const html = renderWithRouter(LogoutButton);

  assert.match(html, /class="secondaryButton"/);
  assert.match(html, /type="button"/);
  assert.match(html, /Выйти/);
});
