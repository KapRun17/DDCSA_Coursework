const { validationResult } = require('express-validator');

function validate(req, res, next) {
  const errors = validationResult(req);

  // Ответ при ошибках входных данных.
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Некорректные данные запроса',
      errors: errors.array()
    });
  }

  return next();
}

module.exports = validate;
