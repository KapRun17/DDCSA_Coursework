import { Route, Routes } from 'react-router-dom';

import AdminPage from './pages/AdminPage.jsx';
import CreateRequestPage from './pages/CreateRequestPage.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import MessagesPage from './pages/MessagesPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import RequestPage from './pages/RequestPage.jsx';

function App() {
  return (
    <Routes>
      {/* Основные маршруты пользовательского сценария. */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/messages" element={<MessagesPage />} />
      <Route path="/messages/:id" element={<MessagesPage />} />
      <Route path="/requests/new" element={<CreateRequestPage />} />
      <Route path="/requests/:id" element={<RequestPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
