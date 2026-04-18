const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  const header = req.headers.authorization;

  // Проверка заголовка авторизации.
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Требуется авторизация'
    });
  }

  const token = header.split(' ')[1];

  try {
    // Декодирование JWT.
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    return next();
  } catch (error) {
    return res.status(401).json({
      message: 'Недействительный токен'
    });
  }
}

module.exports = auth;
