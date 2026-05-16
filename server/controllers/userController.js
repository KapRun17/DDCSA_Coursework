const prisma = require('../lib/prisma');

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true
};

async function getUsers(req, res) {
  // Список пользователей для административной панели.
  const users = await prisma.user.findMany({
    select: userSelect,
    orderBy: {
      createdAt: 'desc'
    }
  });

  return res.json(users);
}

async function getUserById(req, res) {
  const { id } = req.params;

  // Публичная карточка пользователя.
  const user = await prisma.user.findUnique({
    where: {
      id
    },
    select: {
      ...userSelect,
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

async function updateUser(req, res) {
  const { id } = req.params;
  const { name, email } = req.body;

  // Проверка существования профиля.
  const existingUser = await prisma.user.findUnique({
    where: {
      id
    }
  });

  if (!existingUser) {
    return res.status(404).json({
      message: 'Пользователь не найден'
    });
  }

  // Изменение профиля владельцем или администратором.
  if (req.user.id !== id && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      message: 'Недостаточно прав для изменения пользователя'
    });
  }

  const user = await prisma.user.update({
    where: {
      id
    },
    data: {
      name,
      email
    },
    select: userSelect
  });

  return res.json(user);
}

async function deleteUser(req, res) {
  const { id } = req.params;

  // Удаление профиля администратором.
  const existingUser = await prisma.user.findUnique({
    where: {
      id
    }
  });

  if (!existingUser) {
    return res.status(404).json({
      message: 'Пользователь не найден'
    });
  }

  await prisma.user.delete({
    where: {
      id
    }
  });

  return res.json({
    message: 'Пользователь удален'
  });
}

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser
};
