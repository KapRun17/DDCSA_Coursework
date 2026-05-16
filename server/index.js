require('dotenv').config();

const app = require('./app');
const prisma = require('./lib/prisma');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Проверка подключения к PostgreSQL.
    await prisma.$connect();
    console.log('PostgreSQL connected');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
  }
}

startServer();
