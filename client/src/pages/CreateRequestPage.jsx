import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { createRequest } from '../api/requestApi.js';
import { createTemplate, getTemplates } from '../api/templateApi.js';

function CreateRequestPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [templateForm, setTemplateForm] = useState({
    templateType: 'PLAYER',
    gameName: '',
    title: '',
    preferredRole: '',
    rank: '',
    schedule: '',
    description: ''
  });
  const [requestForm, setRequestForm] = useState({
    templateId: '',
    title: '',
    description: ''
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    loadTemplates();
  }, []);

  // Обновление формы шаблона.
  function handleTemplateChange(event) {
    const { name, value } = event.target;

    setTemplateForm((currentForm) => ({
      ...currentForm,
      [name]: value
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

  // Создание шаблона без ухода со страницы.
  async function handleTemplateSubmit(event) {
    event.preventDefault();

    try {
      setErrorMessage('');
      const template = await createTemplate(templateForm);

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

  return (
    <main className="page">
      <header className="topBar">
        <Link className="brand" to="/">
          Team Finder
        </Link>
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
            <input name="gameName" value={templateForm.gameName} onChange={handleTemplateChange} />
          </label>

          <label className="field">
            <span>Название шаблона</span>
            <input name="title" value={templateForm.title} onChange={handleTemplateChange} />
          </label>

          <label className="field">
            <span>Роль</span>
            <input
              name="preferredRole"
              value={templateForm.preferredRole}
              onChange={handleTemplateChange}
            />
          </label>

          <label className="field">
            <span>Ранг</span>
            <input name="rank" value={templateForm.rank} onChange={handleTemplateChange} />
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
