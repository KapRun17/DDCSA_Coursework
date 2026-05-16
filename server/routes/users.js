const express = require('express');
const { body } = require('express-validator');

const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const validate = require('../middleware/validate');

const router = express.Router();

// Правила обновления профиля.
const userValidationRules = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Имя пользователя должно содержать от 3 до 30 символов'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Некорректный формат email')
];

router.get('/', auth, requireRole(['ADMIN']), userController.getUsers);
router.get('/:id', auth, userController.getUserById);
router.put('/:id', auth, userValidationRules, validate, userController.updateUser);
router.delete('/:id', auth, requireRole(['ADMIN']), userController.deleteUser);

module.exports = router;
