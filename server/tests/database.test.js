require('dotenv').config();

const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');

const prisma = require('../lib/prisma');

const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const emails = [
  `db-owner-${runId}@example.test`,
  `db-member-${runId}@example.test`,
  `db-outsider-${runId}@example.test`
];

let owner;
let member;
let outsider;
let ownerTemplate;
let orderedConversation;

function orderedPair(firstId, secondId) {
  return [firstId, secondId].sort();
}

before(async () => {
  await prisma.$connect();

  // Записи создаются напрямую через Prisma, минуя валидацию HTTP-маршрутов.
  [owner, member, outsider] = await Promise.all(
    emails.map((email, index) => prisma.user.create({
      data: {
        name: `db_user_${index}_${runId.slice(-6)}`,
        email,
        passwordHash: 'database-test-hash'
      }
    }))
  );

  ownerTemplate = await prisma.template.create({
    data: {
      userId: owner.id,
      templateType: 'PLAYER',
      gameName: 'Counter-Strike 2',
      title: 'Database constraint template'
    }
  });

  const [firstUserId, secondUserId] = orderedPair(owner.id, member.id);
  orderedConversation = await prisma.conversation.create({
    data: { firstUserId, secondUserId }
  });
});

after(async () => {
  await prisma.user.deleteMany({
    where: { email: { in: emails } }
  });
  await prisma.$disconnect();
});

test('database rejects a request created from another user template', async () => {
  await assert.rejects(
    prisma.request.create({
      data: {
        userId: member.id,
        templateId: ownerTemplate.id,
        title: 'Invalid ownership',
        description: 'The composite foreign key must reject this row'
      }
    })
  );
});

test('database rejects invalid conversation participant pairs', async () => {
  await assert.rejects(
    prisma.conversation.create({
      data: {
        firstUserId: owner.id,
        secondUserId: owner.id
      }
    })
  );

  const [firstUserId, secondUserId] = orderedPair(owner.id, outsider.id);
  await assert.rejects(
    prisma.conversation.create({
      data: {
        firstUserId: secondUserId,
        secondUserId: firstUserId
      }
    })
  );
});

test('database rejects a message from a user outside the conversation', async () => {
  await assert.rejects(
    prisma.message.create({
      data: {
        conversationId: orderedConversation.id,
        senderId: outsider.id,
        text: 'This sender is not a participant'
      }
    })
  );
});

test('database rejects responses that contradict the request and conversation', async () => {
  const closedRequest = await prisma.request.create({
    data: {
      userId: owner.id,
      templateId: ownerTemplate.id,
      title: 'Closed request',
      description: 'Responses are not accepted',
      status: 'CLOSED'
    }
  });

  await assert.rejects(
    prisma.response.create({
      data: {
        responderId: member.id,
        conversationId: orderedConversation.id,
        requestId: closedRequest.id
      }
    })
  );

  const openRequest = await prisma.request.create({
    data: {
      userId: owner.id,
      templateId: ownerTemplate.id,
      title: 'Open request',
      description: 'Conversation participants must match',
      status: 'OPEN'
    }
  });
  const [firstUserId, secondUserId] = orderedPair(member.id, outsider.id);
  const unrelatedConversation = await prisma.conversation.create({
    data: { firstUserId, secondUserId }
  });

  await assert.rejects(
    prisma.response.create({
      data: {
        responderId: member.id,
        conversationId: unrelatedConversation.id,
        requestId: openRequest.id
      }
    })
  );
});

test('database rejects blank required text values', async () => {
  await assert.rejects(
    prisma.message.create({
      data: {
        conversationId: orderedConversation.id,
        senderId: owner.id,
        text: '   '
      }
    })
  );
});
