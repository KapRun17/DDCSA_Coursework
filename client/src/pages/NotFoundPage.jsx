import { Link } from 'react-router-dom';

import { readSession } from '../lib/session.js';

function NotFoundPage() {
  const session = readSession();

  return (
    <main className="page notFoundPage">
      <section className="card notFoundCard">
        <p className="eyebrow">Ошибка 404</p>
        <h1>Страница не найдена</h1>
        <p className="muted">
          Такой страницы нет или ссылка была изменена. Вернитесь на главную страницу,
          чтобы продолжить поиск игроков и команд.
        </p>
        <div className="buttonRow">
          <Link className="primaryButton" to="/">
            На главную
          </Link>
          {!session && (
            <Link className="secondaryButton" to="/login">
              Войти
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}

export default NotFoundPage;
