const mongoose = require('mongoose');

const { User } = require('../models');

async function getUsers(req, res) {
  const { game, isVerified } = req.query;

  // Параметры фильтрации.
  const filter = {};

  if (game) {
    filter['games.gameName'] = game;
  }

  if (typeof isVerified !== 'undefined') {
    filter.isVerified = isVerified === 'true';
  }

  // Выборка списка пользователей.
  const users = await User.find(filter)
    .select('-password')
    .sort({ createdAt: -1 });

  return res.json(users);
}

async function getUserById(req, res) {
  const { id } = req.params;

  // Проверка идентификатора.
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      message: 'Некорректный идентификатор пользователя'
    });
  }

  // Поиск пользователя.
  const user = await User.findById(id).select('-password');

  if (!user) {
    return res.status(404).json({
      message: 'Пользователь не найден'
    });
  }

  return res.json(user);
}

async function createUser(req, res) {
  // Создание записи пользователя.
  const user = await User.create(req.body);

  // Возврат пользователя без пароля.
  const createdUser = await User.findById(user._id).select('-password');

  return res.status(201).json(createdUser);
}

async function updateUser(req, res) {
  const { id } = req.params;

  // Проверка идентификатора.
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      message: 'Некорректный идентификатор пользователя'
    });
  }

  const payload = { ...req.body };

  // Пароль обновляется отдельным сценарием.
  delete payload.password;

  // Обновление записи пользователя.
  const user = await User.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true
  }).select('-password');

  if (!user) {
    return res.status(404).json({
      message: 'Пользователь не найден'
    });
  }

  return res.json(user);
}

async function deleteUser(req, res) {
  const { id } = req.params;

  // Проверка идентификатора.
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      message: 'Некорректный идентификатор пользователя'
    });
  }

  // Удаление записи пользователя.
  const user = await User.findByIdAndDelete(id);

  if (!user) {
    return res.status(404).json({
      message: 'Пользователь не найден'
    });
  }

  return res.json({
    message: 'Пользователь удален'
  });
}

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
