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

export { createTemplate, getTemplates };
