const express = require('express');
const cors = require('cors');

const authRouter = require('./routes/auth');
const healthRouter = require('./routes/health');
const messagesRouter = require('./routes/messages');
const requestsRouter = require('./routes/requests');
const templatesRouter = require('./routes/templates');
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

// Служебные и прикладные маршруты.
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/requests', requestsRouter);
app.use('/api/messages', messagesRouter);

// Единый формат серверных ошибок.
app.use(errorHandler);

module.exports = app;
