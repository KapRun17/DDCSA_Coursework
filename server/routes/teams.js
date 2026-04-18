const express = require('express');
const { body } = require('express-validator');

const teamController = require('../controllers/teamController');
const validate = require('../middleware/validate');

const router = express.Router();

// Правила валидации команд.
const teamValidationRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Название команды обязательно')
    .isLength({ max: 50 })
    .withMessage('Название команды не должно превышать 50 символов'),
  body('game')
    .trim()
    .notEmpty()
    .withMessage('Игра обязательна'),
  body('owner')
    .notEmpty()
    .withMessage('Идентификатор владельца обязателен')
    .isMongoId()
    .withMessage('Некорректный идентификатор владельца'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Описание не должно превышать 500 символов'),
  body('maxMembers')
    .optional()
    .isInt({ min: 2, max: 50 })
    .withMessage('Количество участников должно быть от 2 до 50'),
  body('isRecruiting')
    .optional()
    .isBoolean()
    .withMessage('Поле isRecruiting должно быть логическим значением')
];

// Список команд.
router.get('/', teamController.getTeams);

// Команда по идентификатору.
router.get('/:id', teamController.getTeamById);

// Создание команды.
router.post('/', teamValidationRules, validate, teamController.createTeam);

// Обновление команды.
router.put('/:id', teamValidationRules, validate, teamController.updateTeam);

// Удаление команды.
router.delete('/:id', teamController.deleteTeam);

module.exports = router;
