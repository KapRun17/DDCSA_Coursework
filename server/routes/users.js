const express = require('express');
const { body, param } = require('express-validator');

const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const validate = require('../middleware/validate');

const router = express.Router();

// Проверка изменяемых данных профиля.
const userValidationRules = [
  body('name')
    .optional()
    .isString()
    .withMessage('Имя пользователя должно быть строкой')
    .bail()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Имя пользователя должно содержать от 3 до 30 символов'),
  body('email')
    .optional()
    .isString()
    .withMessage('Email должен быть строкой')
    .bail()
    .trim()
    .isEmail()
    .withMessage('Некорректный формат email')
];

const idValidationRules = [
  param('id').isUUID().withMessage('Некорректный идентификатор пользователя')
];

router.get('/', auth, requireRole(['ADMIN']), userController.getUsers);
router.get('/:id', auth, idValidationRules, validate, userController.getUserById);
router.put('/:id', auth, idValidationRules, userValidationRules, validate, userController.updateUser);
router.delete('/:id', auth, requireRole(['ADMIN']), idValidationRules, validate, userController.deleteUser);

module.exports = router;
