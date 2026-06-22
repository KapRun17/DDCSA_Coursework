const express = require('express');
const { body, param, query } = require('express-validator');

const requestController = require('../controllers/requestController');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const validate = require('../middleware/validate');

const router = express.Router();

// Проверка идентификаторов заявок до обращения к PostgreSQL.
const idValidationRules = [
  param('id').isUUID().withMessage('Некорректный идентификатор заявки')
];

// Проверка фильтров каталога заявок.
const requestQueryValidationRules = [
  query('gameName')
    .optional()
    .isString()
    .withMessage('Название игры должно быть строкой')
    .bail()
    .isLength({ max: 120 })
    .withMessage('Название игры не должно превышать 120 символов'),
  query('templateType')
    .optional()
    .isString()
    .withMessage('Тип шаблона должен быть строкой')
    .bail()
    .isIn(['PLAYER', 'TEAM'])
    .withMessage('Некорректный тип шаблона'),
  query('status')
    .optional()
    .isString()
    .withMessage('Статус заявки должен быть строкой')
    .bail()
    .isIn(['OPEN', 'CLOSED', 'MODERATION_BLOCKED'])
    .withMessage('Некорректный статус заявки')
];

// Правила создания заявки.
const createRequestValidationRules = [
  body('templateId')
    .isString()
    .withMessage('Идентификатор шаблона должен быть строкой')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('Шаблон заявки обязателен')
    .bail()
    .isUUID()
    .withMessage('Некорректный идентификатор шаблона'),
  body('title')
    .isString()
    .withMessage('Заголовок заявки должен быть строкой')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('Заголовок заявки обязателен')
    .isLength({ max: 120 })
    .withMessage('Заголовок заявки не должен превышать 120 символов'),
  body('description')
    .isString()
    .withMessage('Описание заявки должно быть строкой')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('Описание заявки обязательно')
    .isLength({ max: 2000 })
    .withMessage('Описание заявки не должно превышать 2000 символов')
];

// Правила изменения заявки владельцем или администратором.
const updateRequestValidationRules = [
  body('title')
    .optional()
    .isString()
    .withMessage('Заголовок заявки должен быть строкой')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('Заголовок заявки не может быть пустым')
    .isLength({ max: 120 })
    .withMessage('Заголовок заявки не должен превышать 120 символов'),
  body('description')
    .optional()
    .isString()
    .withMessage('Описание заявки должно быть строкой')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('Описание заявки не может быть пустым')
    .isLength({ max: 2000 })
    .withMessage('Описание заявки не должно превышать 2000 символов'),
  body('status')
    .optional()
    .isString()
    .withMessage('Статус заявки должен быть строкой')
    .bail()
    .isIn(['OPEN', 'CLOSED'])
    .withMessage('Пользователь может установить только OPEN или CLOSED')
];

// Правила административной модерации заявки.
const moderationValidationRules = [
  body('status')
    .isString()
    .withMessage('Статус заявки должен быть строкой')
    .bail()
    .isIn(['OPEN', 'CLOSED', 'MODERATION_BLOCKED'])
    .withMessage('Некорректный статус заявки')
];

// Правила сообщения, прикрепляемого к отклику.
const responseValidationRules = [
  body('text')
    .optional({ nullable: true })
    .isString()
    .withMessage('Сообщение к отклику должно быть строкой')
    .bail()
    .isLength({ max: 1000 })
    .withMessage('Сообщение к отклику не должно превышать 1000 символов')
];

router.get('/', requestQueryValidationRules, validate, requestController.getRequests);
router.get('/:id', idValidationRules, validate, requestController.getRequestById);
router.post('/', auth, createRequestValidationRules, validate, requestController.createRequest);
router.put('/:id', auth, idValidationRules, updateRequestValidationRules, validate, requestController.updateRequest);
router.patch(
  '/:id/moderation',
  auth,
  requireRole(['ADMIN']),
  idValidationRules,
  moderationValidationRules,
  validate,
  requestController.moderateRequest
);
router.delete('/:id', auth, idValidationRules, validate, requestController.deleteRequest);
router.post(
  '/:id/responses',
  auth,
  idValidationRules,
  responseValidationRules,
  validate,
  requestController.respondToRequest
);

module.exports = router;
