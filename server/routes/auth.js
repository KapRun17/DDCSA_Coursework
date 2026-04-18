const express = require('express');
const { body } = require('express-validator');

const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// Правила регистрации.
const registerValidationRules = [
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
    .notEmpty()
    .withMessage('Пароль обязателен')
    .isLength({ min: 6 })
    .withMessage('Пароль должен содержать не менее 6 символов')
];

// Правила входа.
const loginValidationRules = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email обязателен')
    .isEmail()
    .withMessage('Некорректный формат email'),
  body('password')
    .notEmpty()
    .withMessage('Пароль обязателен')
];

// Регистрация пользователя.
router.post('/register', registerValidationRules, validate, authController.register);

// Вход пользователя.
router.post('/login', loginValidationRules, validate, authController.login);

// Текущий пользователь.
router.get('/me', auth, authController.me);

module.exports = router;
