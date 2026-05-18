import { useNavigate } from 'react-router-dom';

import { clearSession } from '../lib/session.js';

function LogoutButton() {
  const navigate = useNavigate();

  // Завершение локальной пользовательской сессии.
  function handleLogout() {
    clearSession();
    navigate('/login');
  }

  return (
    <button className="secondaryButton" onClick={handleLogout} type="button">
      Выйти
    </button>
  );
}

export default LogoutButton;
