const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const TEST_PASSWORD = 'Test12345!';

function getConversationPair(firstId, secondId) {
  // Единый порядок участников для уникального диалога.
  return [firstId, secondId].sort();
}

async function upsertUser({ email, name, role }) {
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

  // Тестовые пользователи создаются повторяемо по email.
  return prisma.user.upsert({
    where: {
      email
    },
    update: {
      name,
      role
    },
    create: {
      email,
      name,
      role,
      passwordHash
    }
  });
}

async function upsertTemplate(ownerId, data) {
  // Шаблон ищется по автору, игре и названию.
  const existingTemplate = await prisma.template.findFirst({
    where: {
      userId: ownerId,
      gameName: data.gameName,
      title: data.title
    }
  });

  if (existingTemplate) {
    return prisma.template.update({
      where: {
        id: existingTemplate.id
      },
      data
    });
  }

  return prisma.template.create({
    data: {
      ...data,
      userId: ownerId
    }
  });
}

async function upsertRequest(ownerId, templateId, data) {
  // Заявка привязывается к конкретному шаблону автора.
  const existingRequest = await prisma.request.findFirst({
    where: {
      userId: ownerId,
      templateId,
      title: data.title
    }
  });

  if (existingRequest) {
    return prisma.request.update({
      where: {
        id: existingRequest.id
      },
      data
    });
  }

  return prisma.request.create({
    data: {
      ...data,
      userId: ownerId,
      templateId
    }
  });
}

async function createMessageIfMissing({ conversationId, senderId, text }) {
  const existingMessage = await prisma.message.findFirst({
    where: {
      conversationId,
      senderId,
      text
    }
  });

  if (existingMessage) {
    return existingMessage;
  }

  return prisma.message.create({
    data: {
      conversationId,
      senderId,
      text
    }
  });
}

async function main() {
  const admin = await upsertUser({
    email: 'admin@teamfinder.test',
    name: 'admin',
    role: 'ADMIN'
  });

  const player = await upsertUser({
    email: 'player@teamfinder.test',
    name: 'player_ivan',
    role: 'USER'
  });

  const captain = await upsertUser({
    email: 'captain@teamfinder.test',
    name: 'team_captain',
    role: 'USER'
  });

  const playerTemplate = await upsertTemplate(player.id, {
    templateType: 'PLAYER',
    gameName: 'Counter-Strike 2',
    title: 'Entry fragger ищет стак',
    preferredRole: 'Entry fragger',
    rank: 'Premier 10000-15000',
    schedule: 'Будни после 19:00',
    description: 'Играю на открывающих позициях, ищу спокойную команду для регулярных матчей.'
  });

  const teamTemplate = await upsertTemplate(captain.id, {
    templateType: 'TEAM',
    gameName: 'Counter-Strike 2',
    title: 'Команда ищет rifler',
    preferredRole: 'Rifler',
    rank: 'Premier 10000-15000',
    schedule: 'Понедельник, среда, пятница после 20:00',
    description: 'Нужен стабильный игрок для тренировок и участия в онлайн-турнирах.'
  });

  await upsertTemplate(player.id, {
    templateType: 'PLAYER',
    gameName: 'Dota 2',
    title: 'Support ищет пати',
    preferredRole: 'Support',
    rank: 'Legend',
    schedule: 'Выходные днем',
    description: 'Предпочитаю командную игру, могу играть на четвертой или пятой позиции.'
  });

  const playerRequest = await upsertRequest(player.id, playerTemplate.id, {
    title: 'Ищу команду для CS2',
    description: 'Хочу найти команду для регулярной игры вечером. Готов тренироваться несколько раз в неделю.',
    status: 'OPEN'
  });

  const teamRequest = await upsertRequest(captain.id, teamTemplate.id, {
    title: 'Нужен rifler в команду CS2',
    description: 'Ищем игрока с опытом командной игры. Важно соблюдать расписание и быть на связи.',
    status: 'OPEN'
  });

  const [firstUserId, secondUserId] = getConversationPair(player.id, captain.id);

  const conversation = await prisma.conversation.upsert({
    where: {
      firstUserId_secondUserId: {
        firstUserId,
        secondUserId
      }
    },
    update: {},
    create: {
      firstUserId,
      secondUserId
    }
  });

  await prisma.response.upsert({
    where: {
      responderId_requestId: {
        responderId: player.id,
        requestId: teamRequest.id
      }
    },
    update: {
      text: 'Привет, готов обсудить роль rifler и расписание тренировок.',
      conversationId: conversation.id
    },
    create: {
      responderId: player.id,
      requestId: teamRequest.id,
      conversationId: conversation.id,
      text: 'Привет, готов обсудить роль rifler и расписание тренировок.'
    }
  });

  await createMessageIfMissing({
    conversationId: conversation.id,
    senderId: player.id,
    text: 'Привет, готов обсудить роль rifler и расписание тренировок.'
  });

  await createMessageIfMissing({
    conversationId: conversation.id,
    senderId: captain.id,
    text: 'Привет! Напиши, пожалуйста, в какие дни тебе удобнее играть.'
  });

  console.log('Тестовые данные подготовлены.');
  console.log(`Администратор: ${admin.email} / ${TEST_PASSWORD}`);
  console.log(`Пользователь: ${player.email} / ${TEST_PASSWORD}`);
  console.log(`Пользователь: ${captain.email} / ${TEST_PASSWORD}`);
  console.log(`Создана тестовая заявка: ${playerRequest.title}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
