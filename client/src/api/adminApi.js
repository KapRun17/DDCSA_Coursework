import { httpClient } from './httpClient.js';

// Список пользователей для панели администратора.
function getAdminUsers() {
  return httpClient('/users');
}

// Удаление профиля администратором.
function deleteAdminUser(id) {
  return httpClient(`/users/${id}`, {
    method: 'DELETE'
  });
}

// Список заявок для модерации.
function getAdminRequests() {
  return httpClient('/requests');
}

// Изменение модерационного статуса заявки.
function moderateRequest(id, status) {
  return httpClient(`/requests/${id}/moderation`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
}

// Удаление заявки администратором.
function deleteAdminRequest(id) {
  return httpClient(`/requests/${id}`, {
    method: 'DELETE'
  });
}

export {
  deleteAdminRequest,
  deleteAdminUser,
  getAdminRequests,
  getAdminUsers,
  moderateRequest
};
