import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { createRequest } from '../api/requestApi.js';
import { createTemplate, getTemplates } from '../api/templateApi.js';
import LogoutButton from '../components/LogoutButton.jsx';
import { readSession } from '../lib/session.js';
import {
  GAME_OPTIONS,
  buildSelectOptions,
  getTemplateOptions,
  normalizeOptionalValue
} from '../lib/templateOptions.js';

const initialTemplateForm = {
  templateType: 'PLAYER',
  gameName: GAME_OPTIONS[0],
  title: '',
  preferredRole: '',
  rank: '',
  schedule: '',
  description: ''
};

function CreateRequestPage() {
  const navigate = useNavigate();
  const session = readSession();
  const [templates, setTemplates] = useState([]);
  const [templateForm, setTemplateForm] = useState(initialTemplateForm);
  const [requestForm, setRequestForm] = useState({
    templateId: '',
    title: '',
    description: ''
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const templateOptions = getTemplateOptions(templateForm.gameName);
  const roleOptions = buildSelectOptions(templateOptions.roles, templateForm.preferredRole);
  const rankOptions = buildSelectOptions(templateOptions.ranks, templateForm.rank);

  // Загрузка шаблонов пользователя.
  useEffect(() => {
    async function loadTemplates() {
      try {
        const data = await getTemplates();
        setTemplates(data);
      } catch (error) {
        setErrorMessage(error.message);
      }
    }

    if (session?.user.id) {
      loadTemplates();
    }
  }, [session?.user.id]);

  // Обновление формы игрового шаблона.
  function handleTemplateChange(event) {
    const { name, value } = event.target;

    setTemplateForm((currentForm) => ({
      ...currentForm,
      [name]: value,
      ...(name === 'gameName' ? { preferredRole: '', rank: '' } : {})
    }));
  }

  // Обновление формы заявки.
  function handleRequestChange(event) {
    const { name, value } = event.target;

    setRequestForm((currentForm) => ({
      ...currentForm,
      [name]: value
    }));
  }

  // Подготовка данных шаблона перед отправкой на сервер.
  function buildTemplatePayload() {
    return {
      ...templateForm,
      preferredRole: normalizeOptionalValue(templateForm.preferredRole),
      rank: normalizeOptionalValue(templateForm.rank)
    };
  }

  // Создание шаблона без ухода со страницы.
  async function handleTemplateSubmit(event) {
    event.preventDefault();

    try {
      setErrorMessage('');
      const template = await createTemplate(buildTemplatePayload());

      setTemplates((currentTemplates) => [template, ...currentTemplates]);
      setRequestForm((currentForm) => ({
        ...currentForm,
        templateId: template.id
      }));
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  // Публикация заявки на основе выбранного шаблона.
  async function handleRequestSubmit(event) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setErrorMessage('');

      const request = await createRequest(requestForm);
      navigate(`/requests/${request.id}`);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!session) {
    return (
      <main className="page narrowPage">
        <section className="card authCard">
          <h1>Создание заявки</h1>
          <p className="muted">Для создания игровых шаблонов и заявок необходимо войти в систему.</p>
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
          <LogoutButton />
        </nav>
      </header>

      <section className="workspaceGrid">
        <form className="card formStack" onSubmit={handleTemplateSubmit}>
          <h1>Шаблон</h1>
          {/* Поля игрового шаблона. */}
          <label className="field">
            <span>Тип</span>
            <select
              name="templateType"
              value={templateForm.templateType}
              onChange={handleTemplateChange}
            >
              <option value="PLAYER">Игрок</option>
              <option value="TEAM">Команда</option>
            </select>
          </label>

          <label className="field">
            <span>Игра</span>
            <select name="gameName" value={templateForm.gameName} onChange={handleTemplateChange}>
              {GAME_OPTIONS.map((game) => (
                <option key={game} value={game}>
                  {game}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Название шаблона</span>
            <input name="title" value={templateForm.title} onChange={handleTemplateChange} />
          </label>

          <label className="field">
            <span>Роль</span>
            <select
              name="preferredRole"
              value={templateForm.preferredRole}
              onChange={handleTemplateChange}
            >
              {roleOptions.map((role) => (
                <option key={role} value={role === 'Не указывать' ? '' : role}>
                  {role}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Ранг</span>
            <select name="rank" value={templateForm.rank} onChange={handleTemplateChange}>
              {rankOptions.map((rank) => (
                <option key={rank} value={rank === 'Не указывать' ? '' : rank}>
                  {rank}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Расписание</span>
            <input name="schedule" value={templateForm.schedule} onChange={handleTemplateChange} />
          </label>

          <label className="field">
            <span>Описание</span>
            <textarea
              name="description"
              value={templateForm.description}
              onChange={handleTemplateChange}
              rows="4"
            />
          </label>

          <button className="secondaryButton" type="submit">
            Сохранить шаблон
          </button>
        </form>

        <form className="card formStack" onSubmit={handleRequestSubmit}>
          <h1>Заявка</h1>
          {/* Публикация заявки на основе шаблона. */}
          <label className="field">
            <span>Выбор шаблона</span>
            <select name="templateId" value={requestForm.templateId} onChange={handleRequestChange}>
              <option value="">Выберите шаблон</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.title} - {template.gameName}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Заголовок</span>
            <input name="title" value={requestForm.title} onChange={handleRequestChange} />
          </label>

          <label className="field">
            <span>Описание заявки</span>
            <textarea
              name="description"
              value={requestForm.description}
              onChange={handleRequestChange}
              rows="8"
            />
          </label>

          {errorMessage && <div className="errorCard">{errorMessage}</div>}

          <button className="primaryButton" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Публикация...' : 'Опубликовать заявку'}
          </button>
        </form>
      </section>
    </main>
  );
}

export default CreateRequestPage;
