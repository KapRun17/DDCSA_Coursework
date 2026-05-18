const express = require('express');
const { body } = require('express-validator');

const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// Правила проверки данных при регистрации.
const registerValidationRules = [
  body('name')
    .isString()
    .withMessage('Имя пользователя должно быть строкой')
    .trim()
    .notEmpty()
    .withMessage('Имя пользователя обязательно')
    .isLength({ min: 3, max: 30 })
    .withMessage('Имя пользователя должно содержать от 3 до 30 символов'),
  body('email')
    .isString()
    .withMessage('Email должен быть строкой')
    .trim()
    .notEmpty()
    .withMessage('Email обязателен')
    .isEmail()
    .withMessage('Некорректный формат email'),
  body('password')
    .isString()
    .withMessage('Пароль должен быть строкой')
    .notEmpty()
    .withMessage('Пароль обязателен')
    .isLength({ min: 6 })
    .withMessage('Пароль должен содержать не менее 6 символов')
];

// Правила проверки данных при авторизации.
const loginValidationRules = [
  body('email')
    .isString()
    .withMessage('Email должен быть строкой')
    .trim()
    .notEmpty()
    .withMessage('Email обязателен')
    .isEmail()
    .withMessage('Некорректный формат email'),
  body('password')
    .isString()
    .withMessage('Пароль должен быть строкой')
    .notEmpty()
    .withMessage('Пароль обязателен')
];

router.post('/register', registerValidationRules, validate, authController.register);
router.post('/login', loginValidationRules, validate, authController.login);
router.get('/me', auth, authController.me);

module.exports = router;
