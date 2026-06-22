function errorHandler(error, req, res, next) {
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      message: 'Некорректный формат JSON'
    });
  }

  if (error.type === 'entity.too.large') {
    return res.status(413).json({
      message: 'Размер тела запроса превышает допустимый предел'
    });
  }

  // Конфликты уникальных ограничений Prisma.
  if (error.code === 'P2002') {
    return res.status(409).json({
      message: 'Запись с такими данными уже существует'
    });
  }

  // Нарушения внешних ключей и дополнительных ограничений PostgreSQL.
  if (error.code === 'P2003' || error.code === 'P2004') {
    return res.status(409).json({
      message: 'Операция нарушает ограничения целостности данных'
    });
  }

  // Отсутствие записи при операциях обновления.
  if (error.code === 'P2025') {
    return res.status(404).json({
      message: 'Запись не найдена'
    });
  }

  if (
    error.code === 'P2000'
    || error.code === 'P2023'
    || error.name === 'PrismaClientValidationError'
  ) {
    return res.status(400).json({
      message: 'Некорректные данные запроса'
    });
  }

  // Непредвиденные ошибки журналируются для последующей диагностики.
  console.error(error);

  return res.status(500).json({
    message: 'Внутренняя ошибка сервера'
  });
}

module.exports = errorHandler;
