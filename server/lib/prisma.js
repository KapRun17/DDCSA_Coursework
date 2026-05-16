const { PrismaClient } = require('@prisma/client');

// Единый экземпляр клиента базы данных.
const prisma = new PrismaClient();

module.exports = prisma;
