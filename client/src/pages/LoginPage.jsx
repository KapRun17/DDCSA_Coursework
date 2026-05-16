import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { loginUser } from '../api/authApi.js';
import { saveSession } from '../lib/session.js';

function LoginPage() {
  const navigate = useNavigate();
  const [formState, setFormState] = useState({
    email: '',
    password: ''
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Обновление формы авторизации.
  function handleInputChange(event) {
    const { name, value } = event.target;

    setFormState((currentState) => ({
      ...currentState,
      [name]: value
    }));
  }

  // Отправка данных входа.
  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setErrorMessage('');

      const session = await loginUser(formState);
      saveSession(session);
      navigate('/');
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page narrowPage">
      <section className="card authCard">
        <h1>Вход</h1>
        <form className="formStack" onSubmit={handleSubmit}>
          {/* Поля авторизации. */}
          <label className="field">
            <span>Email</span>
            <input
              name="email"
              value={formState.email}
              onChange={handleInputChange}
              placeholder="user@example.com"
              type="email"
            />
          </label>

          <label className="field">
            <span>Пароль</span>
            <input
              name="password"
              value={formState.password}
              onChange={handleInputChange}
              placeholder="Введите пароль"
              type="password"
            />
          </label>

          {errorMessage && <div className="errorCard">{errorMessage}</div>}

          <button className="primaryButton" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Выполняется вход...' : 'Войти'}
          </button>
        </form>

        <Link className="secondaryButton" to="/register">
          Создать аккаунт
        </Link>
      </section>
    </main>
  );
}

export default LoginPage;
