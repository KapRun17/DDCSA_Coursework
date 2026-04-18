const express = require('express');
const cors = require('cors');

const authRouter = require('./routes/auth');
const healthRouter = require('./routes/health');
const teamsRouter = require('./routes/teams');
const usersRouter = require('./routes/users');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Базовые middleware API.
app.use(cors());
app.use(express.json());

// Корневой маршрут API.
app.get('/', (req, res) => {
  res.json({
    message: 'DDCSA Coursework API'
  });
});

// Служебные маршруты.
app.use('/api/health', healthRouter);

// Маршруты аутентификации.
app.use('/api/auth', authRouter);

// Маршруты домена команд.
app.use('/api/teams', teamsRouter);

// Маршруты домена пользователей.
app.use('/api/users', usersRouter);

// Единый формат серверных ошибок.
app.use(errorHandler);

module.exports = app;
