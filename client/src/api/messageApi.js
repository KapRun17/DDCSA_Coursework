import { httpClient } from './httpClient.js';

// Список диалогов текущего пользователя.
function getConversations() {
  return httpClient('/messages/conversations');
}

// Диалог с историей сообщений.
function getConversationById(id) {
  return httpClient(`/messages/conversations/${id}`);
}

// Отправка сообщения в диалог.
function createMessage(conversationId, payload) {
  return httpClient(`/messages/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export { createMessage, getConversationById, getConversations };
