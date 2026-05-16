const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = require('../lib/prisma');

function createToken(user) {
  // Полезная нагрузка пользовательской сессии.
  return jwt.sign(
    {
      id: user.id,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '7d'
    }
  );
}

function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
}

async function register(req, res) {
  const { name, email, password } = req.body;

  // Проверка уникальности учетных данных.
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { name }]
    }
  });

  if (existingUser) {
    return res.status(409).json({
      message: 'Пользователь с таким именем или email уже существует'
    });
  }

  // Хранение только хеша пароля.
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash
    }
  });

  const token = createToken(user);

  return res.status(201).json({
    token,
    user: toPublicUser(user)
  });
}

async function login(req, res) {
  const { email, password } = req.body;

  // Поиск учетной записи по email.
  const user = await prisma.user.findUnique({
    where: {
      email
    }
  });

  if (!user) {
    return res.status(401).json({
      message: 'Неверный email или пароль'
    });
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    return res.status(401).json({
      message: 'Неверный email или пароль'
    });
  }

  const token = createToken(user);

  return res.json({
    token,
    user: toPublicUser(user)
  });
}

async function me(req, res) {
  // Данные активного пользователя.
  const user = await prisma.user.findUnique({
    where: {
      id: req.user.id
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      templates: {
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  });

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
