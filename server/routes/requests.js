const express = require('express');
const { body } = require('express-validator');

const requestController = require('../controllers/requestController');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const validate = require('../middleware/validate');

const router = express.Router();

// Правила создания заявки.
const createRequestValidationRules = [
  body('templateId')
    .trim()
    .notEmpty()
    .withMessage('Шаблон заявки обязателен'),
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Заголовок заявки обязателен')
    .isLength({ max: 120 })
    .withMessage('Заголовок заявки не должен превышать 120 символов'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Описание заявки обязательно')
    .isLength({ max: 2000 })
    .withMessage('Описание заявки не должно превышать 2000 символов')
];

// Правила обновления заявки.
const updateRequestValidationRules = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Заголовок заявки не может быть пустым')
    .isLength({ max: 120 })
    .withMessage('Заголовок заявки не должен превышать 120 символов'),
  body('description')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Описание заявки не может быть пустым')
    .isLength({ max: 2000 })
    .withMessage('Описание заявки не должно превышать 2000 символов'),
  body('status')
    .optional()
    .isIn(['OPEN', 'CLOSED'])
    .withMessage('Пользователь может установить только OPEN или CLOSED')
];

// Правила модерации статуса.
const moderationValidationRules = [
  body('status')
    .isIn(['OPEN', 'CLOSED', 'MODERATION_BLOCKED'])
    .withMessage('Некорректный статус заявки')
];

// Правила отклика.
const responseValidationRules = [
  body('text')
    .optional({ nullable: true })
    .isLength({ max: 1000 })
    .withMessage('Сообщение к отклику не должно превышать 1000 символов')
];

router.get('/', requestController.getRequests);
router.get('/:id', requestController.getRequestById);
router.post('/', auth, createRequestValidationRules, validate, requestController.createRequest);
router.put('/:id', auth, updateRequestValidationRules, validate, requestController.updateRequest);
router.patch(
  '/:id/moderation',
  auth,
  requireRole(['ADMIN']),
  moderationValidationRules,
  validate,
  requestController.moderateRequest
);
router.delete('/:id', auth, requestController.deleteRequest);
router.post('/:id/responses', auth, responseValidationRules, validate, requestController.respondToRequest);

module.exports = router;
