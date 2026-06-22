function containsNullByte(value, visited = new Set()) {
  if (typeof value === 'string') {
    return value.includes('\u0000');
  }

  if (!value || typeof value !== 'object' || visited.has(value)) {
    return false;
  }

  visited.add(value);
  return Object.values(value).some((nestedValue) => containsNullByte(nestedValue, visited));
}

// Нулевые байты отклоняются до передачи данных драйверу PostgreSQL.
function rejectInvalidCharacters(req, res, next) {
  if (containsNullByte(req.body) || containsNullByte(req.query)) {
    return res.status(400).json({
      message: 'Данные запроса содержат недопустимые символы'
    });
  }

  return next();
}

module.exports = rejectInvalidCharacters;
