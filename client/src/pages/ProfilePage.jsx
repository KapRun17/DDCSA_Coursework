import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  deleteRequest,
  getRequests,
  updateRequest
} from '../api/requestApi.js';
import {
  createTemplate,
  deleteTemplate,
  getTemplates,
  updateTemplate
} from '../api/templateApi.js';
import { updateUser } from '../api/userApi.js';
import LogoutButton from '../components/LogoutButton.jsx';
import { readSession, saveSession } from '../lib/session.js';
import {
  GAME_OPTIONS,
  buildSelectOptions,
  getTemplateOptions,
  normalizeOptionalValue
} from '../lib/templateOptions.js';

const emptyTemplate = {
  templateType: 'PLAYER',
  gameName: GAME_OPTIONS[0],
  title: '',
  preferredRole: '',
  rank: '',
  schedule: '',
  description: ''
};

function ProfilePage() {
  const session = readSession();
  const userId = session?.user.id;
  const [templates, setTemplates] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [profileForm, setProfileForm] = useState({
    name: session?.user.name ?? '',
    email: session?.user.email ?? ''
  });
  const [formState, setFormState] = useState(emptyTemplate);
  const [requestEditForm, setRequestEditForm] = useState({
    title: '',
    description: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [editingRequestId, setEditingRequestId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const templateOptions = getTemplateOptions(formState.gameName);
  const roleOptions = buildSelectOptions(templateOptions.roles, formState.preferredRole);
  const rankOptions = buildSelectOptions(templateOptions.ranks, formState.rank);

  // Загрузка шаблонов и заявок профиля.
  useEffect(() => {
    async function loadProfileData() {
      try {
        const [loadedTemplates, loadedRequests] = await Promise.all([
          getTemplates(),
          getRequests()
        ]);

        setTemplates(loadedTemplates);
        setMyRequests(loadedRequests.filter((request) => request.user.id === userId));
      } catch (error) {
        setErrorMessage(error.message);
      }
    }

    if (userId) {
      loadProfileData();
    }
  }, [userId]);

  // Обновление формы шаблона.
  function handleChange(event) {
    const { name, value } = event.target;

    setFormState((currentState) => ({
      ...currentState,
      [name]: value,
      ...(name === 'gameName' ? { preferredRole: '', rank: '' } : {})
    }));
  }

  // Обновление формы профиля.
  function handleProfileChange(event) {
    const { name, value } = event.target;

    setProfileForm((currentForm) => ({
      ...currentForm,
      [name]: value
    }));
  }

  // Сохранение данных профиля пользователя.
  async function handleProfileSubmit(event) {
    event.preventDefault();

    try {
      setErrorMessage('');
      setSuccessMessage('');

      const updatedUser = await updateUser(userId, profileForm);
      saveSession({
        token: session.token,
        user: updatedUser
      });
      setSuccessMessage('Профиль обновлен');
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  // Выбор шаблона для редактирования.
  function handleEdit(template) {
    setEditingId(template.id);
    setFormState({
      templateType: template.templateType,
      gameName: template.gameName,
      title: template.title,
      preferredRole: template.preferredRole ?? '',
      rank: template.rank ?? '',
      schedule: template.schedule ?? '',
      description: template.description ?? ''
    });
    setSuccessMessage('');
  }

  // Сброс формы шаблона.
  function resetForm() {
    setEditingId(null);
    setFormState(emptyTemplate);
  }

  // Подготовка шаблона перед отправкой.
  function buildTemplatePayload() {
    return {
      ...formState,
      preferredRole: normalizeOptionalValue(formState.preferredRole),
      rank: normalizeOptionalValue(formState.rank)
    };
  }

  // Создание или обновление шаблона.
  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setErrorMessage('');
      setSuccessMessage('');

      if (editingId) {
        const template = await updateTemplate(editingId, buildTemplatePayload());
        setTemplates((currentTemplates) =>
          currentTemplates.map((item) => (item.id === template.id ? template : item))
        );
        setSuccessMessage('Шаблон обновлен');
      } else {
        const template = await createTemplate(buildTemplatePayload());
        setTemplates((currentTemplates) => [template, ...currentTemplates]);
        setSuccessMessage('Шаблон создан');
      }

      resetForm();
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  // Удаление шаблона пользователя.
  async function handleDelete(templateId) {
    if (!window.confirm('Удалить этот шаблон?')) {
      return;
    }

    try {
      setErrorMessage('');
      setSuccessMessage('');
      await deleteTemplate(templateId);
      setTemplates((currentTemplates) => currentTemplates.filter((item) => item.id !== templateId));
      setSuccessMessage('Шаблон удален');
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  // Выбор заявки для редактирования.
  function handleRequestEdit(request) {
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

  // Сохранение изменений собственной заявки.
  async function handleRequestEditSubmit(event) {
    event.preventDefault();

    const currentRequest = myRequests.find((request) => request.id === editingRequestId);

    if (!currentRequest) {
      return;
    }

    try {
      setErrorMessage('');
      setSuccessMessage('');

      const updatedRequest = await updateRequest(editingRequestId, {
        ...requestEditForm,
        status: currentRequest.status
      });

      setMyRequests((currentRequests) =>
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

  // Изменение статуса собственной заявки.
  async function handleRequestStatusChange(request, status) {
    try {
      setErrorMessage('');
      setSuccessMessage('');

      const updatedRequest = await updateRequest(request.id, {
        title: request.title,
        description: request.description,
        status
      });

      setMyRequests((currentRequests) =>
        currentRequests.map((item) => (item.id === updatedRequest.id ? updatedRequest : item))
      );
      setSuccessMessage('Статус заявки обновлен');
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  // Удаление собственной заявки.
  async function handleRequestDelete(requestId) {
    if (!window.confirm('Удалить эту заявку?')) {
      return;
    }

    try {
      setErrorMessage('');
      setSuccessMessage('');

      await deleteRequest(requestId);
      setMyRequests((currentRequests) => currentRequests.filter((request) => request.id !== requestId));
      setSuccessMessage('Заявка удалена');
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  if (!session) {
    return (
      <main className="page narrowPage">
        <section className="card authCard">
          <h1>Профиль</h1>
          <p className="muted">Для работы с профилем необходимо войти в систему.</p>
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
          <Link className="secondaryButton" to="/messages">
            Сообщения
          </Link>
          <Link className="primaryButton" to="/requests/new">
            Создать заявку
          </Link>
          <LogoutButton />
        </nav>
      </header>

      <section className="card profileSettings">
        <div className="sectionHeader compactHeader">
          <div>
            <p className="eyebrow">Профиль</p>
            <h1>Данные аккаунта</h1>
          </div>
        </div>
        <form className="formStack" onSubmit={handleProfileSubmit}>
          {/* Данные учетной записи пользователя. */}
          <div className="inlineFormGrid">
            <label className="field">
              <span>Имя пользователя</span>
              <input name="name" value={profileForm.name} onChange={handleProfileChange} />
            </label>
            <label className="field">
              <span>Email</span>
              <input name="email" value={profileForm.email} onChange={handleProfileChange} type="email" />
            </label>
          </div>
          <button className="secondaryButton" type="submit">
            Сохранить профиль
          </button>
        </form>
      </section>

      <section className="workspaceGrid">
        <form className="card formStack" onSubmit={handleSubmit}>
          <h1>{editingId ? 'Редактирование шаблона' : 'Новый шаблон'}</h1>
          {/* Поля игрового шаблона. */}
          <label className="field">
            <span>Тип</span>
            <select name="templateType" value={formState.templateType} onChange={handleChange}>
              <option value="PLAYER">Игрок</option>
              <option value="TEAM">Команда</option>
            </select>
          </label>

          <label className="field">
            <span>Игра</span>
            <select name="gameName" value={formState.gameName} onChange={handleChange}>
              {GAME_OPTIONS.map((game) => (
                <option key={game} value={game}>
                  {game}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Название</span>
            <input name="title" value={formState.title} onChange={handleChange} />
          </label>

          <label className="field">
            <span>Роль</span>
            <select name="preferredRole" value={formState.preferredRole} onChange={handleChange}>
              {roleOptions.map((role) => (
                <option key={role} value={role === 'Не указывать' ? '' : role}>
                  {role}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Ранг</span>
            <select name="rank" value={formState.rank} onChange={handleChange}>
              {rankOptions.map((rank) => (
                <option key={rank} value={rank === 'Не указывать' ? '' : rank}>
                  {rank}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Расписание</span>
            <input name="schedule" value={formState.schedule} onChange={handleChange} />
          </label>

          <label className="field">
            <span>Описание</span>
            <textarea
              name="description"
              value={formState.description}
              onChange={handleChange}
              rows="5"
            />
          </label>

          {errorMessage && <div className="errorCard">{errorMessage}</div>}
          {successMessage && <div className="successCard">{successMessage}</div>}

          <div className="buttonRow">
            <button className="primaryButton" type="submit">
              {editingId ? 'Сохранить' : 'Создать'}
            </button>
            {editingId && (
              <button className="secondaryButton" onClick={resetForm} type="button">
                Отмена
              </button>
            )}
          </div>
        </form>

        <section className="card">
          <h1>Мои шаблоны</h1>
          {templates.length === 0 && <p className="muted">Шаблоны пока не созданы.</p>}
          {templates.length > 0 && (
            <div className="templateList">
              {templates.map((template) => (
                <article className="templateItem" key={template.id}>
                  <div>
                    <div className="requestMeta">
                      <span className="requestTypeTag">
                        {template.templateType === 'PLAYER' ? 'Игрок' : 'Команда'}
                      </span>
                      <span className="requestGameTag">{template.gameName}</span>
                    </div>
                    <h2>{template.title}</h2>
                    <p className="muted">{template.description || 'Описание не указано'}</p>
                    <div className="templateLine">
                      <span>{template.preferredRole || 'Роль не указана'}</span>
                      <span>{template.rank || 'Ранг не указан'}</span>
                    </div>
                  </div>
                  <div className="buttonRow">
                    <button className="secondaryButton" onClick={() => handleEdit(template)} type="button">
                      Изменить
                    </button>
                    <button className="secondaryButton" onClick={() => handleDelete(template.id)} type="button">
                      Удалить
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>

      <section className="card profileRequests">
        <div className="sectionHeader compactHeader">
          <div>
            <p className="eyebrow">Заявки</p>
            <h1>Мои заявки</h1>
          </div>
          <Link className="primaryButton" to="/requests/new">
            Создать заявку
          </Link>
        </div>

        {myRequests.length === 0 && <p className="muted">Вы пока не оставляли заявки.</p>}
        {myRequests.length > 0 && (
          <div className="profileRequestList">
            {myRequests.map((request) => (
              <article className="profileRequestItem" key={request.id}>
                <div>
                  <div className="requestMeta">
                    <span className="requestGameTag">{request.template.gameName}</span>
                    <span className="requestTypeTag">
                      {request.template.templateType === 'PLAYER' ? 'Игрок' : 'Команда'}
                    </span>
                  </div>
                  <h2>{request.title}</h2>
                  <p className="muted">{request.description}</p>
                  {request.template.description && (
                    <p className="templateDescription">
                      Шаблон: {request.template.description}
                    </p>
                  )}
                  <div className="templateLine">
                    <span>{request.template.preferredRole || 'Роль не указана'}</span>
                    <span>{request.template.rank || 'Ранг не указан'}</span>
                    <span>Статус: {request.status}</span>
                  </div>
                </div>

                <div className="buttonRow">
                  <Link className="secondaryButton" to={`/requests/${request.id}`}>
                    Открыть
                  </Link>
                  <button
                    className="secondaryButton"
                    onClick={() => handleRequestEdit(request)}
                    type="button"
                  >
                    Редактировать
                  </button>
                  {request.status === 'MODERATION_BLOCKED' && (
                    <span className="statusNotice">Заблокирована модератором</span>
                  )}
                  {request.status === 'OPEN' && (
                    <button
                      className="secondaryButton"
                      onClick={() => handleRequestStatusChange(request, 'CLOSED')}
                      type="button"
                    >
                      Закрыть
                    </button>
                  )}
                  {request.status === 'CLOSED' && (
                    <button
                      className="secondaryButton"
                      onClick={() => handleRequestStatusChange(request, 'OPEN')}
                      type="button"
                    >
                      Открыть снова
                    </button>
                  )}
                  <button
                    className="secondaryButton dangerButton"
                    onClick={() => handleRequestDelete(request.id)}
                    type="button"
                  >
                    Удалить
                  </button>
                </div>
                {editingRequestId === request.id && (
                  <form className="requestEditForm" onSubmit={handleRequestEditSubmit}>
                    {/* Редактирование заголовка и описания заявки. */}
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
                        Сохранить заявку
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
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default ProfilePage;
