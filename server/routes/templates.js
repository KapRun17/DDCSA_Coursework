const express = require('express');
const { body, param } = require('express-validator');

const templateController = require('../controllers/templateController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// Проверка полей игрового шаблона.
const templateValidationRules = [
  body('templateType')
    .isString()
    .withMessage('Тип шаблона должен быть строкой')
    .bail()
    .isIn(['PLAYER', 'TEAM'])
    .withMessage('Тип шаблона должен быть PLAYER или TEAM'),
  body('gameName')
    .isString()
    .withMessage('Название игры должно быть строкой')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('Название игры обязательно')
    .isLength({ max: 120 })
    .withMessage('Название игры не должно превышать 120 символов'),
  body('title')
    .isString()
    .withMessage('Название шаблона должно быть строкой')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('Название шаблона обязательно')
    .isLength({ max: 120 })
    .withMessage('Название шаблона не должно превышать 120 символов'),
  body('preferredRole')
    .optional({ nullable: true })
    .isString()
    .withMessage('Роль должна быть строкой')
    .bail()
    .isLength({ max: 100 })
    .withMessage('Роль не должна превышать 100 символов'),
  body('rank')
    .optional({ nullable: true })
    .isString()
    .withMessage('Ранг должен быть строкой')
    .bail()
    .isLength({ max: 100 })
    .withMessage('Ранг не должен превышать 100 символов'),
  body('schedule')
    .optional({ nullable: true })
    .isString()
    .withMessage('Расписание должно быть строкой')
    .bail()
    .isLength({ max: 255 })
    .withMessage('Расписание не должно превышать 255 символов'),
  body('description')
    .optional({ nullable: true })
    .isString()
    .withMessage('Описание должно быть строкой')
    .bail()
    .isLength({ max: 2000 })
    .withMessage('Описание не должно превышать 2000 символов')
];

const idValidationRules = [
  param('id').isUUID().withMessage('Некорректный идентификатор шаблона')
];

router.get('/', auth, templateController.getTemplates);
router.post('/', auth, templateValidationRules, validate, templateController.createTemplate);
router.put('/:id', auth, idValidationRules, templateValidationRules, validate, templateController.updateTemplate);
router.delete('/:id', auth, idValidationRules, validate, templateController.deleteTemplate);

module.exports = router;
