import { httpClient } from './httpClient.js';

// Построение строки запроса для фильтров.
function buildQuery(params) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

// Получение списка заявок.
function getRequests(filters = {}) {
  return httpClient(`/requests${buildQuery(filters)}`);
}

// Получение детальной информации по заявке.
function getRequestById(id) {
  return httpClient(`/requests/${id}`);
}

// Создание заявки на основе шаблона.
function createRequest(payload) {
  return httpClient('/requests', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

// Отклик на заявку.
function respondToRequest(id, payload) {
  return httpClient(`/requests/${id}/responses`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export { createRequest, getRequestById, getRequests, respondToRequest };
