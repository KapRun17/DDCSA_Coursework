import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { getRequests } from '../api/requestApi.js';
import { readSession } from '../lib/session.js';

function RequestCard({ request }) {
  return (
    <article className="requestCard">
      <div className="requestMeta">
        <span className="requestTypeTag">
          {request.template.templateType === 'PLAYER' ? 'Анкета игрока' : 'Анкета команды'}
        </span>
        <span className="requestGameTag">{request.template.gameName}</span>
      </div>
      <h2>{request.title}</h2>
      <p className="muted">{request.description}</p>
      <div className="templateLine">
        <span>{request.template.preferredRole || 'Роль не указана'}</span>
        <span>{request.template.rank || 'Ранг не указан'}</span>
      </div>
      <div className="requestFooter">
        <span className="muted">
          Автор: <strong>{request.user.name}</strong>
        </span>
        <Link className="primaryButton" to={`/requests/${request.id}`}>
          Открыть
        </Link>
      </div>
    </article>
  );
}

function HomePage() {
  const session = readSession();
  const [filters, setFilters] = useState({
    gameName: '',
    templateType: '',
    status: 'OPEN'
  });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Загрузка каталога заявок.
  useEffect(() => {
    let cancelled = false;

    async function loadRequests() {
      try {
        setLoading(true);
        setErrorMessage('');

        const data = await getRequests(filters);

        if (!cancelled) {
          setRequests(data);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadRequests();

    return () => {
      cancelled = true;
    };
  }, [filters]);

  // Обновление фильтров каталога.
  function handleFilterChange(event) {
    const { name, value } = event.target;

    setFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value
    }));
  }

  return (
    <main className="page">
      <header className="topBar">
        <Link className="brand" to="/">
          Team Finder
        </Link>
        <nav className="navActions">
          {session ? (
            <>
              <span className="muted">{session.user.name}</span>
              <Link className="primaryButton" to="/requests/new">
                Создать заявку
              </Link>
            </>
          ) : (
            <>
              <Link className="secondaryButton" to="/login">
                Войти
              </Link>
              <Link className="primaryButton" to="/register">
                Регистрация
              </Link>
            </>
          )}
        </nav>
      </header>

      <section className="catalogSection" id="requests">
        <div className="sectionHeader">
          <div>
            <p className="eyebrow">Каталог заявок</p>
            <h1>Поиск игроков и команд</h1>
          </div>
          <p className="muted">
            Заявки создаются на основе игровых шаблонов, поэтому в карточках сразу видны игра,
            роль и уровень подготовки.
          </p>
        </div>

        <form className="filterPanel">
          {/* Фильтры каталога заявок. */}
          <label className="field">
            <span>Игра</span>
            <input
              name="gameName"
              value={filters.gameName}
              onChange={handleFilterChange}
              placeholder="Например, CS2"
              type="text"
            />
          </label>

          <label className="field">
            <span>Тип шаблона</span>
            <select name="templateType" value={filters.templateType} onChange={handleFilterChange}>
              <option value="">Все</option>
              <option value="PLAYER">Игрок</option>
              <option value="TEAM">Команда</option>
            </select>
          </label>

          <label className="field">
            <span>Статус</span>
            <select name="status" value={filters.status} onChange={handleFilterChange}>
              <option value="OPEN">Открыта</option>
              <option value="CLOSED">Закрыта</option>
              <option value="">Все</option>
            </select>
          </label>
        </form>

        {/* Состояния каталога заявок. */}
        {loading && <div className="card">Загрузка заявок...</div>}
        {!loading && errorMessage && <div className="card errorCard">{errorMessage}</div>}
        {!loading && !errorMessage && requests.length === 0 && (
          <div className="card">По выбранным фильтрам заявки не найдены.</div>
        )}

        {!loading && !errorMessage && requests.length > 0 && (
          <div className="requestGrid">
            {requests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default HomePage;
