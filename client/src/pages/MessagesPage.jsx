import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import {
  createMessage,
  getConversationById,
  getConversations
} from '../api/messageApi.js';
import LogoutButton from '../components/LogoutButton.jsx';
import { readSession } from '../lib/session.js';

function MessagesPage() {
  const { id } = useParams();
  const session = readSession();
  const userId = session?.user.id;
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Загрузка списка диалогов.
  useEffect(() => {
    async function loadConversations() {
      try {
        const data = await getConversations();
        setConversations(data);
      } catch (error) {
        setErrorMessage(error.message);
      }
    }

    if (userId) {
      loadConversations();
    }
  }, [userId]);

  // Загрузка выбранного диалога.
  useEffect(() => {
    async function loadConversation() {
      if (!id || !userId) {
        setActiveConversation(null);
        return;
      }

      try {
        setErrorMessage('');
        const data = await getConversationById(id);
        setActiveConversation(data);
      } catch (error) {
        setErrorMessage(error.message);
      }
    }

    loadConversation();
  }, [id, userId]);

  function getCompanion(conversation) {
    if (!session) {
      return null;
    }

    return conversation.firstUser.id === session.user.id
      ? conversation.secondUser
      : conversation.firstUser;
  }

  // Отправка сообщения в текущий диалог.
  async function handleSubmit(event) {
    event.preventDefault();

    if (!activeConversation) {
      return;
    }

    try {
      setErrorMessage('');
      const message = await createMessage(activeConversation.id, {
        text: messageText
      });

      setActiveConversation((conversation) => ({
        ...conversation,
        messages: [...conversation.messages, message]
      }));
      setConversations((currentConversations) =>
        currentConversations.map((conversation) =>
          conversation.id === activeConversation.id
            ? {
                ...conversation,
                messages: [message, ...conversation.messages.filter((item) => item.id !== message.id)]
              }
            : conversation
        )
      );
      setMessageText('');
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  if (!session) {
    return (
      <main className="page narrowPage">
        <section className="card authCard">
          <h1>Сообщения</h1>
          <p className="muted">Для просмотра диалогов необходимо войти в систему.</p>
          <Link className="primaryButton" to="/login">
            Войти
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="topBar">
        <Link className="brand" to="/">
          Team Finder
        </Link>
        <nav className="navActions">
          <Link className="secondaryButton" to="/profile">
            Профиль
          </Link>
          <Link className="primaryButton" to="/requests/new">
            Создать заявку
          </Link>
          <LogoutButton />
        </nav>
      </header>

      <section className="messagesLayout">
        <aside className="card conversationList">
          <h1>Диалоги</h1>
          {conversations.length === 0 && <p className="muted">Диалогов пока нет.</p>}
          {conversations.map((conversation) => {
            const companion = getCompanion(conversation);
            const lastMessage = conversation.messages[0];

            return (
              <Link className="conversationLink" key={conversation.id} to={`/messages/${conversation.id}`}>
                <strong>{companion?.name}</strong>
                <span>{lastMessage?.text || 'Сообщений пока нет'}</span>
              </Link>
            );
          })}
        </aside>

        <section className="card conversationPanel">
          {errorMessage && <div className="errorCard">{errorMessage}</div>}
          {!activeConversation && <p className="muted">Выберите диалог из списка.</p>}
          {activeConversation && (
            <>
              <h1>{getCompanion(activeConversation)?.name}</h1>
              <div className="messageList">
                {activeConversation.messages.map((message) => (
                  <article
                    className={
                      message.sender.id === session.user.id ? 'messageBubble ownMessage' : 'messageBubble'
                    }
                    key={message.id}
                  >
                    <strong>{message.sender.name}</strong>
                    <p>{message.text}</p>
                  </article>
                ))}
              </div>

              <form className="messageForm" onSubmit={handleSubmit}>
                {/* Отправка сообщения в выбранный диалог. */}
                <label className="field">
                  <span>Сообщение</span>
                  <textarea
                    value={messageText}
                    onChange={(event) => setMessageText(event.target.value)}
                    rows="3"
                  />
                </label>
                <button className="primaryButton" type="submit">
                  Отправить
                </button>
              </form>
            </>
          )}
        </section>
      </section>
    </main>
  );
}

export default MessagesPage;
