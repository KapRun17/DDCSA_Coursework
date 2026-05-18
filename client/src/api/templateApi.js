import { httpClient } from './httpClient.js';

// Список шаблонов текущего пользователя.
function getTemplates(filters = {}) {
  const searchParams = new URLSearchParams(filters);
  const query = searchParams.toString();

  return httpClient(`/templates${query ? `?${query}` : ''}`);
}

// Создание игрового шаблона.
function createTemplate(payload) {
  return httpClient('/templates', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

// Обновление игрового шаблона.
function updateTemplate(id, payload) {
  return httpClient(`/templates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

// Удаление игрового шаблона.
function deleteTemplate(id) {
  return httpClient(`/templates/${id}`, {
    method: 'DELETE'
  });
}

export { createTemplate, deleteTemplate, getTemplates, updateTemplate };
