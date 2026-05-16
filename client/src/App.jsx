import { Route, Routes } from 'react-router-dom';

import CreateRequestPage from './pages/CreateRequestPage.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import RequestPage from './pages/RequestPage.jsx';

function App() {
  return (
    <Routes>
      {/* Основные маршруты пользовательского сценария. */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/requests/new" element={<CreateRequestPage />} />
      <Route path="/requests/:id" element={<RequestPage />} />
    </Routes>
  );
}

export default App;
