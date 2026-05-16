const express = require('express');
const { body } = require('express-validator');

const templateController = require('../controllers/templateController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// Правила валидации игровых шаблонов.
const templateValidationRules = [
  body('templateType')
    .isIn(['PLAYER', 'TEAM'])
    .withMessage('Тип шаблона должен быть PLAYER или TEAM'),
  body('gameName')
    .trim()
    .notEmpty()
    .withMessage('Название игры обязательно'),
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Название шаблона обязательно')
    .isLength({ max: 120 })
    .withMessage('Название шаблона не должно превышать 120 символов'),
  body('preferredRole')
    .optional({ nullable: true })
    .isLength({ max: 100 })
    .withMessage('Роль не должна превышать 100 символов'),
  body('rank')
    .optional({ nullable: true })
    .isLength({ max: 100 })
    .withMessage('Ранг не должен превышать 100 символов'),
  body('schedule')
    .optional({ nullable: true })
    .isLength({ max: 255 })
    .withMessage('Расписание не должно превышать 255 символов'),
  body('description')
    .optional({ nullable: true })
    .isLength({ max: 2000 })
    .withMessage('Описание не должно превышать 2000 символов')
];

router.get('/', auth, templateController.getTemplates);
router.post('/', auth, templateValidationRules, validate, templateController.createTemplate);
router.put('/:id', auth, templateValidationRules, validate, templateController.updateTemplate);
router.delete('/:id', auth, templateController.deleteTemplate);

module.exports = router;
