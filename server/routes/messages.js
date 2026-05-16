const express = require('express');
const { body } = require('express-validator');

const messageController = require('../controllers/messageController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// Правила отправки сообщения.
const messageValidationRules = [
  body('text')
    .trim()
    .notEmpty()
    .withMessage('Текст сообщения обязателен')
    .isLength({ max: 1000 })
    .withMessage('Текст сообщения не должен превышать 1000 символов')
];

router.get('/conversations', auth, messageController.getConversations);
router.get('/conversations/:id', auth, messageController.getConversationById);
router.post('/conversations/:id/messages', auth, messageValidationRules, validate, messageController.createMessage);

module.exports = router;
