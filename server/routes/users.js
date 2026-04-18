const express = require('express');
const { body } = require('express-validator');

const userController = require('../controllers/userController');
const validate = require('../middleware/validate');

const router = express.Router();

// Правила валидации пользователей.
const userValidationRules = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Имя пользователя обязательно')
    .isLength({ min: 3, max: 30 })
    .withMessage('Имя пользователя должно содержать от 3 до 30 символов'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email обязателен')
    .isEmail()
    .withMessage('Некорректный формат email'),
  body('password')
    .optional({ values: 'falsy' })
    .isLength({ min: 6 })
    .withMessage('Пароль должен содержать не менее 6 символов'),
  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Роль должна быть user или admin'),
  body('profile.age')
    .optional()
    .isInt({ min: 13, max: 100 })
    .withMessage('Возраст должен быть в диапазоне от 13 до 100'),
  body('profile.bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Биография не должна превышать 500 символов'),
  body('isVerified')
    .optional()
    .isBoolean()
    .withMessage('Поле isVerified должно быть логическим значением')
];

// Список пользователей.
router.get('/', userController.getUsers);

// Пользователь по идентификатору.
router.get('/:id', userController.getUserById);

// Создание пользователя.
router.post(
  '/',
  [
    ...userValidationRules,
    body('password')
      .notEmpty()
      .withMessage('Пароль обязателен')
  ],
  validate,
  userController.createUser
);

// Обновление пользователя.
router.put('/:id', userValidationRules, validate, userController.updateUser);

// Удаление пользователя.
router.delete('/:id', userController.deleteUser);

module.exports = router;
