import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { registerUser } from '../api/authApi.js';
import { saveSession } from '../lib/session.js';

function RegisterPage() {
  const navigate = useNavigate();
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Обновление формы регистрации.
  function handleInputChange(event) {
    const { name, value } = event.target;

    setFormState((currentState) => ({
      ...currentState,
      [name]: value
    }));
  }

  // Создание учетной записи.
  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setErrorMessage('');

      const session = await registerUser(formState);
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
        <h1>Регистрация</h1>
        <form className="formStack" onSubmit={handleSubmit}>
          {/* Поля новой учетной записи. */}
          <label className="field">
            <span>Имя пользователя</span>
            <input
              name="name"
              value={formState.name}
              onChange={handleInputChange}
              placeholder="Nickname"
              type="text"
            />
          </label>

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
              placeholder="Минимум 6 символов"
              type="password"
            />
          </label>

          {errorMessage && <div className="errorCard">{errorMessage}</div>}

          <button className="primaryButton" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Создание...' : 'Зарегистрироваться'}
          </button>
        </form>

        <Link className="secondaryButton" to="/login">
          Уже есть аккаунт
        </Link>
      </section>
    </main>
  );
}

export default RegisterPage;
