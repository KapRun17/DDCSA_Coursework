function requireRole(roles) {
  return (req, res, next) => {
    // Проверка роли текущего пользователя.
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Недостаточно прав доступа'
      });
    }

    return next();
  };
}

module.exports = requireRole;
