const prisma = require('../lib/prisma');

function buildTemplateSelect() {
  return {
    id: true,
    userId: true,
    templateType: true,
    gameName: true,
    title: true,
    preferredRole: true,
    rank: true,
    schedule: true,
    description: true,
    createdAt: true,
    updatedAt: true
  };
}

async function getTemplates(req, res) {
  const { gameName, templateType } = req.query;

  // Фильтрация шаблонов текущего пользователя.
  const where = {
    userId: req.user.id
  };

  if (gameName) {
    where.gameName = {
      contains: gameName,
      mode: 'insensitive'
    };
  }

  if (templateType) {
    where.templateType = templateType;
  }

  const templates = await prisma.template.findMany({
    where,
    select: buildTemplateSelect(),
    orderBy: {
      createdAt: 'desc'
    }
  });

  return res.json(templates);
}

async function createTemplate(req, res) {
  const {
    templateType,
    gameName,
    title,
    preferredRole,
    rank,
    schedule,
    description
  } = req.body;

  // Новый игровой шаблон пользователя.
  const template = await prisma.template.create({
    data: {
      userId: req.user.id,
      templateType,
      gameName,
      title,
      preferredRole,
      rank,
      schedule,
      description
    },
    select: buildTemplateSelect()
  });

  return res.status(201).json(template);
}

async function updateTemplate(req, res) {
  const { id } = req.params;

  // Проверка владельца шаблона.
  const existingTemplate = await prisma.template.findUnique({
    where: {
      id
    }
  });

  if (!existingTemplate) {
    return res.status(404).json({
      message: 'Шаблон не найден'
    });
  }

  if (existingTemplate.userId !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      message: 'Недостаточно прав для изменения шаблона'
    });
  }

  const template = await prisma.template.update({
    where: {
      id
    },
    data: req.body,
    select: buildTemplateSelect()
  });

  return res.json(template);
}

async function deleteTemplate(req, res) {
  const { id } = req.params;

  // Проверка владельца шаблона.
  const existingTemplate = await prisma.template.findUnique({
    where: {
      id
    }
  });

  if (!existingTemplate) {
    return res.status(404).json({
      message: 'Шаблон не найден'
    });
  }

  if (existingTemplate.userId !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      message: 'Недостаточно прав для удаления шаблона'
    });
  }

  await prisma.template.delete({
    where: {
      id
    }
  });

  return res.json({
    message: 'Шаблон удален'
  });
}

module.exports = {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate
};
