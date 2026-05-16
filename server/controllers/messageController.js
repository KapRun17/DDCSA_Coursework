const prisma = require('../lib/prisma');

function isConversationParticipant(conversation, userId) {
  return conversation.firstUserId === userId || conversation.secondUserId === userId;
}

async function getConversations(req, res) {
  // Диалоги текущего пользователя.
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [
        { firstUserId: req.user.id },
        { secondUserId: req.user.id }
      ]
    },
    include: {
      firstUser: {
        select: {
          id: true,
          name: true
        }
      },
      secondUser: {
        select: {
          id: true,
          name: true
        }
      },
      messages: {
        orderBy: {
          createdAt: 'desc'
        },
        take: 1
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return res.json(conversations);
}

async function getConversationById(req, res) {
  const { id } = req.params;

  // Диалог с историей сообщений.
  const conversation = await prisma.conversation.findUnique({
    where: {
      id
    },
    include: {
      firstUser: {
        select: {
          id: true,
          name: true
        }
      },
      secondUser: {
        select: {
          id: true,
          name: true
        }
      },
      messages: {
        include: {
          sender: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      }
    }
  });

  if (!conversation) {
    return res.status(404).json({
      message: 'Диалог не найден'
    });
  }

  if (!isConversationParticipant(conversation, req.user.id) && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      message: 'Недостаточно прав для просмотра диалога'
    });
  }

  return res.json(conversation);
}

async function createMessage(req, res) {
  const { id } = req.params;
  const { text } = req.body;

  // Проверка доступа к диалогу.
  const conversation = await prisma.conversation.findUnique({
    where: {
      id
    }
  });

  if (!conversation) {
    return res.status(404).json({
      message: 'Диалог не найден'
    });
  }

  if (!isConversationParticipant(conversation, req.user.id)) {
    return res.status(403).json({
      message: 'Недостаточно прав для отправки сообщения'
    });
  }

  const message = await prisma.message.create({
    data: {
      conversationId: id,
      senderId: req.user.id,
      text
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  return res.status(201).json(message);
}

module.exports = {
  getConversations,
  getConversationById,
  createMessage
};
