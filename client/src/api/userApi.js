import { httpClient } from './httpClient.js';

// Обновление данных текущего пользователя.
function updateUser(id, payload) {
  return httpClient(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export { updateUser };
