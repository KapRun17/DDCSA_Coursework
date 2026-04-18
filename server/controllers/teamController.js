const mongoose = require('mongoose');

const { Team } = require('../models');

async function getTeams(req, res) {
  const { game, isRecruiting } = req.query;

  // Параметры фильтрации.
  const filter = {};

  if (game) {
    filter.game = game;
  }

  if (typeof isRecruiting !== 'undefined') {
    filter.isRecruiting = isRecruiting === 'true';
  }

  // Выборка списка команд.
  const teams = await Team.find(filter)
    .populate('owner', 'username email')
    .sort({ createdAt: -1 });

  return res.json(teams);
}

async function getTeamById(req, res) {
  const { id } = req.params;

  // Проверка идентификатора.
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      message: 'Некорректный идентификатор команды'
    });
  }

  // Поиск команды.
  const team = await Team.findById(id).populate('owner', 'username email');

  if (!team) {
    return res.status(404).json({
      message: 'Команда не найдена'
    });
  }

  return res.json(team);
}

async function createTeam(req, res) {
  // Создание записи команды.
  const team = await Team.create(req.body);

  // Возврат команды со связями.
  const createdTeam = await Team.findById(team._id).populate('owner', 'username email');

  return res.status(201).json(createdTeam);
}

async function updateTeam(req, res) {
  const { id } = req.params;

  // Проверка идентификатора.
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      message: 'Некорректный идентификатор команды'
    });
  }

  // Обновление записи команды.
  const team = await Team.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true
  }).populate('owner', 'username email');

  if (!team) {
    return res.status(404).json({
      message: 'Команда не найдена'
    });
  }

  return res.json(team);
}

async function deleteTeam(req, res) {
  const { id } = req.params;

  // Проверка идентификатора.
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      message: 'Некорректный идентификатор команды'
    });
  }

  // Удаление записи команды.
  const team = await Team.findByIdAndDelete(id);

  if (!team) {
    return res.status(404).json({
      message: 'Команда не найдена'
    });
  }

  return res.json({
    message: 'Команда удалена'
  });
}

module.exports = {
  getTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam
};
