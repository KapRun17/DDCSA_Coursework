import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  deleteAdminRequest,
  deleteAdminUser,
  getAdminRequests,
  getAdminUsers,
  moderateRequest
} from '../api/adminApi.js';
import { updateRequest } from '../api/requestApi.js';
import LogoutButton from '../components/LogoutButton.jsx';
import { readSession } from '../lib/session.js';

const requestStatusLabels = {
  OPEN: 'Открыта',
  CLOSED: 'Закрыта',
  MODERATION_BLOCKED: 'Заблокирована'
};

function AdminPage() {
  const session = readSession();
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [editingRequestId, setEditingRequestId] = useState(null);
  const [requestEditForm, setRequestEditForm] = useState({
    title: '',
    description: ''
  });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Загрузка данных для административной панели.
  useEffect(() => {
    async function loadAdminData() {
      try {
        setLoading(true);
        setErrorMessage('');

        const [loadedUsers, loadedRequests] = await Promise.all([
          getAdminUsers(),
          getAdminRequests()
        ]);

        setUsers(loadedUsers);
        setRequests(loadedRequests);
      } catch (error) {
        setErrorMessage(error.message);
      } finally {
        setLoading(false);
      }
    }

    if (session?.user.role === 'ADMIN') {
      loadAdminData();
    } else {
      setLoading(false);
    }
  }, [session?.user.role]);

  // Удаление профиля из административного списка.
  async function handleDeleteUser(userId) {
    if (!window.confirm('Удалить профиль пользователя?')) {
      return;
    }

    try {
      setErrorMessage('');
      setSuccessMessage('');
      await deleteAdminUser(userId);
      setUsers((currentUsers) => currentUsers.filter((user) => user.id !== userId));
      setSuccessMessage('Профиль пользователя удален');
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  // Выбор заявки для редактирования администратором.
  function handleEditRequest(request) {
    setEditingRequestId(request.id);
    setRequestEditForm({
      title: request.title,
      description: request.description
    });
    setSuccessMessage('');
  }

  // Обновление формы редактирования заявки.
  function handleRequestEditChange(event) {
    const { name, value } = event.target;

    setRequestEditForm((currentForm) => ({
      ...currentForm,
      [name]: value
    }));
  }

  // Сохранение изменений заявки администратором.
  async function handleRequestEditSubmit(event) {
    event.preventDefault();

    const currentRequest = requests.find((request) => request.id === editingRequestId);

    if (!currentRequest) {
      return;
    }

    try {
      setErrorMessage('');
      setSuccessMessage('');

      const updatedRequest = await updateRequest(editingRequestId, requestEditForm);

      setRequests((currentRequests) =>
        currentRequests.map((request) =>
          request.id === updatedRequest.id ? updatedRequest : request
        )
      );
      setEditingRequestId(null);
      setSuccessMessage('Заявка обновлена');
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  // Изменение статуса заявки в рамках модерации.
  async function handleModerateRequest(requestId, status) {
    try {
      setErrorMessage('');
      setSuccessMessage('');
      const updatedRequest = await moderateRequest(requestId, status);
      setRequests((currentRequests) =>
        currentRequests.map((request) =>
          request.id === updatedRequest.id ? updatedRequest : request
        )
      );
      setSuccessMessage('Статус заявки обновлен');
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  // Удаление заявки из административной панели.
  async function handleDeleteRequest(requestId) {
    if (!window.confirm('Удалить заявку?')) {
      return;
    }

    try {
      setErrorMessage('');
      setSuccessMessage('');
      await deleteAdminRequest(requestId);
      setRequests((currentRequests) =>
        currentRequests.filter((request) => request.id !== requestId)
      );
      setSuccessMessage('Заявка удалена');
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  if (!session) {
    return (
      <main className="page narrowPage">
        <section className="card authCard">
          <h1>Панель администратора</h1>
          <p className="muted">Для доступа к панели администратора необходимо войти в систему.</p>
          <Link className="primaryButton" to="/login">
            Войти
          </Link>
        </section>
      </main>
    );
  }

  if (session.user.role !== 'ADMIN') {
    return (
      <main className="page narrowPage">
        <section className="card authCard">
          <h1>Недостаточно прав</h1>
          <p className="muted">Административная панель доступна только пользователям с ролью ADMIN.</p>
          <Link className="primaryButton" to="/">
            На главную
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
          <span className="muted">{session.user.name}</span>
          <Link className="secondaryButton" to="/profile">
            Профиль
          </Link>
          <Link className="secondaryButton" to="/messages">
            Сообщения
          </Link>
          <LogoutButton />
        </nav>
      </header>

      <section className="adminHero">
        <p className="eyebrow">Администрирование</p>
        <h1>Модерация пользователей и заявок</h1>
        <p className="muted">
          Раздел объединяет действия администратора, связанные с проверкой заявок,
          блокировкой некорректного содержимого и удалением профилей.
        </p>
      </section>

      {loading && <div className="card">Загрузка данных панели администратора...</div>}
      {!loading && errorMessage && <div className="errorCard">{errorMessage}</div>}
      {!loading && successMessage && <div className="successCard">{successMessage}</div>}

      {!loading && (
        <section className="adminGrid">
          <article className="card adminPanel">
            <h2>Пользователи</h2>
            <div className="adminTable">
              <div className="adminTableHead">
                <span>Имя</span>
                <span>Email</span>
                <span>Роль</span>
                <span>Действие</span>
              </div>
              {users.map((user) => (
                <div className="adminTableRow" key={user.id}>
                  <span>{user.name}</span>
                  <span>{user.email}</span>
                  <span>{user.role}</span>
                  <span>
                    <button
                      className="secondaryButton dangerButton"
                      disabled={user.id === session.user.id}
                      onClick={() => handleDeleteUser(user.id)}
                      type="button"
                    >
                      Удалить
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </article>

          <article className="card adminPanel">
            <h2>Заявки</h2>
            <div className="moderationList">
              {requests.length === 0 && <p className="muted">Заявок пока нет.</p>}
              {requests.map((request) => (
                <section className="moderationItem" key={request.id}>
                  <div>
                    <div className="requestMeta">
                      <span className="requestGameTag">{request.template.gameName}</span>
                      <span className="requestTypeTag">
                        {request.template.templateType === 'PLAYER' ? 'Игрок' : 'Команда'}
                      </span>
                    </div>
                    <h3>{request.title}</h3>
                    <p className="muted">{request.description}</p>
                    {request.template.description && (
                      <p className="templateDescription">
                        Шаблон: {request.template.description}
                      </p>
                    )}
                    <p className="muted">
                      Автор: <strong>{request.user.name}</strong>, статус:{' '}
                      <strong>{requestStatusLabels[request.status]}</strong>
                    </p>
                  </div>
                  <div className="buttonRow">
                    <button
                      className="secondaryButton"
                      onClick={() => handleEditRequest(request)}
                      type="button"
                    >
                      Редактировать
                    </button>
                    <button
                      className="secondaryButton"
                      onClick={() => handleModerateRequest(request.id, 'OPEN')}
                      type="button"
                    >
                      Открыть
                    </button>
                    <button
                      className="secondaryButton"
                      onClick={() => handleModerateRequest(request.id, 'CLOSED')}
                      type="button"
                    >
                      Закрыть
                    </button>
                    <button
                      className="secondaryButton dangerButton"
                      onClick={() => handleModerateRequest(request.id, 'MODERATION_BLOCKED')}
                      type="button"
                    >
                      Заблокировать
                    </button>
                    <button
                      className="secondaryButton dangerButton"
                      onClick={() => handleDeleteRequest(request.id)}
                      type="button"
                    >
                      Удалить
                    </button>
                  </div>
                  {editingRequestId === request.id && (
                    <form className="requestEditForm" onSubmit={handleRequestEditSubmit}>
                      {/* Редактирование заявки администратором. */}
                      <label className="field">
                        <span>Заголовок</span>
                        <input
                          name="title"
                          value={requestEditForm.title}
                          onChange={handleRequestEditChange}
                        />
                      </label>
                      <label className="field">
                        <span>Описание заявки</span>
                        <textarea
                          name="description"
                          value={requestEditForm.description}
                          onChange={handleRequestEditChange}
                          rows="4"
                        />
                      </label>
                      <div className="buttonRow">
                        <button className="primaryButton" type="submit">
                          Сохранить
                        </button>
                        <button
                          className="secondaryButton"
                          onClick={() => setEditingRequestId(null)}
                          type="button"
                        >
                          Отмена
                        </button>
                      </div>
                    </form>
                  )}
                </section>
              ))}
            </div>
          </article>
        </section>
      )}
    </main>
  );
}

export default AdminPage;
