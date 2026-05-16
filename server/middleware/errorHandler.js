function errorHandler(error, req, res, next) {
  console.error(error);

  // Конфликты уникальных ограничений Prisma.
  if (error.code === 'P2002') {
    return res.status(409).json({
      message: 'Запись с такими данными уже существует'
    });
  }

  // Отсутствие записи при операциях обновления.
  if (error.code === 'P2025') {
    return res.status(404).json({
      message: 'Запись не найдена'
    });
  }

  return res.status(500).json({
    message: 'Внутренняя ошибка сервера'
  });
}

module.exports = errorHandler;
