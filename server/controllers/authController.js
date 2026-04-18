const jwt = require('jsonwebtoken');

const { User } = require('../models');

function createToken(user) {
  // Полезная нагрузка JWT.
  return jwt.sign(
    {
      id: user._id,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '7d'
    }
  );
}

async function register(req, res) {
  const { username, email, password } = req.body;

  // Создание учетной записи.
  const user = await User.create({
    username,
    email,
    password
  });

  // Токен для новой сессии.
  const token = createToken(user);

  return res.status(201).json({
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    }
  });
}

async function login(req, res) {
  const { email, password } = req.body;

  // Поиск пользователя с паролем.
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return res.status(401).json({
      message: 'Неверный email или пароль'
    });
  }

  // Проверка пароля.
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    return res.status(401).json({
      message: 'Неверный email или пароль'
    });
  }

  // Токен для активной сессии.
  const token = createToken(user);

  return res.json({
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    }
  });
}

async function me(req, res) {
  // Данные текущего пользователя.
  const user = await User.findById(req.user.id).select('-password');

  if (!user) {
    return res.status(404).json({
      message: 'Пользователь не найден'
    });
  }

  return res.json(user);
}

module.exports = {
  register,
  login,
  me
};
