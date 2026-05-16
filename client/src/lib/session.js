import { TOKEN_KEY } from '../api/httpClient.js';

const USER_KEY = 'ddcsa_current_user';

// Сохранение данных активной сессии.
function saveSession(session) {
  localStorage.setItem(TOKEN_KEY, session.token);
  localStorage.setItem(USER_KEY, JSON.stringify(session.user));
}

// Чтение данных активной сессии.
function readSession() {
  const token = localStorage.getItem(TOKEN_KEY);
  const user = localStorage.getItem(USER_KEY);

  if (!token || !user) {
    return null;
  }

  return {
    token,
    user: JSON.parse(user)
  };
}

// Очистка локальной сессии.
function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export { clearSession, readSession, saveSession };
