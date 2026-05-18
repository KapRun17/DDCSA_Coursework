const prisma = require('../lib/prisma');

function getConversationPair(firstId, secondId) {
  // Стабильный порядок участников для уникального диалога.
  return [firstId, secondId].sort();
}

function buildRequestInclude() {
  return {
    user: {
      select: {
        id: true,
        name: true,
        role: true
      }
    },
    template: true,
    responses: {
      include: {
        responder: {
          select: {
            id: true,
            name: true
          }
        },
        conversation: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    }
  };
}

async function getRequests(req, res) {
  const { gameName, templateType, status } = req.query;

  // Фильтры каталога заявок.
  const where = {};

  if (status) {
    where.status = status;
  }

  if (gameName || templateType) {
    where.template = {};
  }

  if (gameName) {
    where.template.gameName = {
      contains: gameName,
      mode: 'insensitive'
    };
  }

  if (templateType) {
    where.template.templateType = templateType;
  }

  const requests = await prisma.request.findMany({
    where,
    include: buildRequestInclude(),
    orderBy: {
      createdAt: 'desc'
    }
  });

  return res.json(requests);
}

async function getRequestById(req, res) {
  const { id } = req.params;

  // Полная карточка заявки.
  const request = await prisma.request.findUnique({
    where: {
      id
    },
    include: buildRequestInclude()
  });

  if (!request) {
    return res.status(404).json({
      message: 'Заявка не найдена'
    });
  }

  return res.json(request);
}

async function createRequest(req, res) {
  const { templateId, title, description } = req.body;

  // Шаблон должен принадлежать автору заявки.
  const template = await prisma.template.findUnique({
    where: {
      id: templateId
    }
  });

  if (!template) {
    return res.status(404).json({
      message: 'Шаблон не найден'
    });
  }

  if (template.userId !== req.user.id) {
    return res.status(403).json({
      message: 'Нельзя создать заявку по чужому шаблону'
    });
  }

  const request = await prisma.request.create({
    data: {
      userId: req.user.id,
      templateId,
      title,
      description
    },
    include: buildRequestInclude()
  });

  return res.status(201).json(request);
}

async function updateRequest(req, res) {
  const { id } = req.params;
  const { title, description, status } = req.body;

  // Проверка владельца заявки.
  const existingRequest = await prisma.request.findUnique({
    where: {
      id
    }
  });

  if (!existingRequest) {
    return res.status(404).json({
      message: 'Заявка не найдена'
    });
  }

  if (existingRequest.userId !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      message: 'Недостаточно прав для изменения заявки'
    });
  }

  // Заблокированная модератором заявка изменяется только администратором.
  if (existingRequest.status === 'MODERATION_BLOCKED' && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      message: 'Заявка заблокирована модератором и не может быть изменена пользователем'
    });
  }

  const request = await prisma.request.update({
    where: {
      id
    },
    data: {
      title,
      description,
      status
    },
    include: buildRequestInclude()
  });

  return res.json(request);
}

async function deleteRequest(req, res) {
  const { id } = req.params;

  // Проверка прав на удаление заявки.
  const existingRequest = await prisma.request.findUnique({
    where: {
      id
    }
  });

  if (!existingRequest) {
    return res.status(404).json({
      message: 'Заявка не найдена'
    });
  }

  if (existingRequest.userId !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      message: 'Недостаточно прав для удаления заявки'
    });
  }

  await prisma.request.delete({
    where: {
      id
    }
  });

  return res.json({
    message: 'Заявка удалена'
  });
}

async function moderateRequest(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  // Административное изменение статуса заявки.
  const request = await prisma.request.update({
    where: {
      id
    },
    data: {
      status
    },
    include: buildRequestInclude()
  });

  return res.json(request);
}

async function respondToRequest(req, res) {
  const { id } = req.params;
  const { text = '' } = req.body;

  // Заявка вместе с автором.
  const request = await prisma.request.findUnique({
    where: {
      id
    }
  });

  if (!request) {
    return res.status(404).json({
      message: 'Заявка не найдена'
    });
  }

  if (request.userId === req.user.id) {
    return res.status(400).json({
      message: 'Нельзя откликнуться на собственную заявку'
    });
  }

  const [firstUserId, secondUserId] = getConversationPair(req.user.id, request.userId);

  const response = await prisma.$transaction(async (tx) => {
    const conversation = await tx.conversation.upsert({
      where: {
        firstUserId_secondUserId: {
          firstUserId,
          secondUserId
        }
      },
      create: {
        firstUserId,
        secondUserId
      },
      update: {}
    });

    const createdResponse = await tx.response.create({
      data: {
        requestId: id,
        responderId: req.user.id,
        conversationId: conversation.id,
        text
      },
      include: {
        responder: {
          select: {
            id: true,
            name: true
          }
        },
        conversation: true
      }
    });

    if (text.trim()) {
      await tx.message.create({
        data: {
          conversationId: conversation.id,
          senderId: req.user.id,
          text
        }
      });
    }

    return createdResponse;
  });

  return res.status(201).json(response);
}

module.exports = {
  getRequests,
  getRequestById,
  createRequest,
  updateRequest,
  deleteRequest,
  moderateRequest,
  respondToRequest
};
