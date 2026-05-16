import { httpClient } from './httpClient.js';

// Регистрация пользователя.
function registerUser(payload) {
  return httpClient('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

// Авторизация пользователя.
function loginUser(credentials) {
  return httpClient('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  });
}

export { loginUser, registerUser };
