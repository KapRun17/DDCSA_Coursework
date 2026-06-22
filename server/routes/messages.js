const express = require('express');
const { body, param } = require('express-validator');

const messageController = require('../controllers/messageController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// Проверка текста нового сообщения.
const messageValidationRules = [
  body('text')
    .isString()
    .withMessage('Текст сообщения должен быть строкой')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('Текст сообщения обязателен')
    .isLength({ max: 1000 })
    .withMessage('Текст сообщения не должен превышать 1000 символов')
];

const idValidationRules = [
  param('id').isUUID().withMessage('Некорректный идентификатор диалога')
];

router.get('/conversations', auth, messageController.getConversations);
router.get('/conversations/:id', auth, idValidationRules, validate, messageController.getConversationById);
router.post(
  '/conversations/:id/messages',
  auth,
  idValidationRules,
  messageValidationRules,
  validate,
  messageController.createMessage
);

module.exports = router;
