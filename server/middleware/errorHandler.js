function errorHandler(error, req, res, next) {
  // Ошибки схемы данных.
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Ошибка валидации данных',
      errors: Object.values(error.errors).map((item) => ({
        field: item.path,
        message: item.message
      }))
    });
  }

  // Ошибки уникальных полей.
  if (error.code === 11000) {
    return res.status(409).json({
      message: 'Запись с такими данными уже существует'
    });
  }

  // Необработанные ошибки сервера.
  console.error(error);

  return res.status(500).json({
    message: 'Внутренняя ошибка сервера'
  });
}

module.exports = errorHandler;
