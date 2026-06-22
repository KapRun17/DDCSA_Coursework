require('dotenv').config();

const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');

const app = require('../app');
const prisma = require('../lib/prisma');

const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const shortId = Math.random().toString(16).slice(2, 10);
const testEmails = [
  `owner-${runId}@example.test`,
  `member-${runId}@example.test`,
  `outsider-${runId}@example.test`,
  `admin-${runId}@example.test`
];
const password = 'Test12345!';

let server;
let baseUrl;
let owner;
let member;
let outsider;
let admin;
let ownerTemplate;
let memberTemplate;
let ownerRequest;
let conversationId;

async function api(path, { method = 'GET', token, body } = {}) {
  const headers = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const payload = await response.json();

  return { response, payload };
}

async function register(name, email) {
  const { response, payload } = await api('/api/auth/register', {
    method: 'POST',
    body: { name, email, password }
  });

  assert.equal(response.status, 201);
  return payload;
}

before(async () => {
  await prisma.$connect();

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });

  owner = await register(`owner_${shortId}`, testEmails[0]);
  member = await register(`member_${shortId}`, testEmails[1]);
  outsider = await register(`outsider_${shortId}`, testEmails[2]);
  admin = await register(`admin_${shortId}`, testEmails[3]);

  await prisma.user.update({
    where: { id: admin.user.id },
    data: { role: 'ADMIN' }
  });

  const adminLogin = await api('/api/auth/login', {
    method: 'POST',
    body: { email: testEmails[3], password }
  });
  assert.equal(adminLogin.response.status, 200);
  admin = adminLogin.payload;
});

after(async () => {
  await prisma.user.deleteMany({
    where: {
      email: { in: testEmails }
    }
  });
  await prisma.$disconnect();

  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
});

test('RBAC restricts the user list to administrators', async () => {
  const denied = await api('/api/users', { token: owner.token });
  assert.equal(denied.response.status, 403);

  const allowed = await api('/api/users', { token: admin.token });
  assert.equal(allowed.response.status, 200);
  assert.ok(Array.isArray(allowed.payload));
});

test('profile ownership prevents editing another user', async () => {
  const ownerUpdate = await api(`/api/users/${owner.user.id}`, {
    method: 'PUT',
    token: owner.token,
    body: { name: `owner_updated_${shortId}` }
  });
  assert.equal(ownerUpdate.response.status, 200);
  assert.equal(ownerUpdate.payload.name, `owner_updated_${shortId}`);

  const denied = await api(`/api/users/${member.user.id}`, {
    method: 'PUT',
    token: owner.token,
    body: { name: `forbidden_${shortId}` }
  });
  assert.equal(denied.response.status, 403);

  const allowed = await api(`/api/users/${member.user.id}`, {
    method: 'PUT',
    token: admin.token,
    body: { name: `member_updated_${shortId}` }
  });
  assert.equal(allowed.response.status, 200);
  assert.equal(allowed.payload.name, `member_updated_${shortId}`);
});

test('template ownership is enforced for users and bypassed by an administrator', async () => {
  const ownerCreated = await api('/api/templates', {
    method: 'POST',
    token: owner.token,
    body: {
      templateType: 'PLAYER',
      gameName: 'Counter-Strike 2',
      title: 'Owner template',
      preferredRole: 'AWPer',
      rank: 'Premier 10000-15000',
      schedule: 'Evenings',
      description: 'Owner test template'
    }
  });
  assert.equal(ownerCreated.response.status, 201);
  ownerTemplate = ownerCreated.payload;

  const memberCreated = await api('/api/templates', {
    method: 'POST',
    token: member.token,
    body: {
      templateType: 'TEAM',
      gameName: 'Counter-Strike 2',
      title: 'Member template',
      preferredRole: 'Rifler',
      rank: 'Premier 10000-15000',
      schedule: 'Weekends',
      description: 'Member test template'
    }
  });
  assert.equal(memberCreated.response.status, 201);
  memberTemplate = memberCreated.payload;

  const denied = await api(`/api/templates/${memberTemplate.id}`, {
    method: 'PUT',
    token: owner.token,
    body: {
      templateType: memberTemplate.templateType,
      gameName: memberTemplate.gameName,
      title: 'Forbidden update'
    }
  });
  assert.equal(denied.response.status, 403);

  const allowed = await api(`/api/templates/${memberTemplate.id}`, {
    method: 'PUT',
    token: admin.token,
    body: {
      templateType: memberTemplate.templateType,
      gameName: memberTemplate.gameName,
      title: 'Moderated template'
    }
  });
  assert.equal(allowed.response.status, 200);
  assert.equal(allowed.payload.title, 'Moderated template');

  const disposable = await api('/api/templates', {
    method: 'POST',
    token: owner.token,
    body: {
      templateType: 'PLAYER',
      gameName: 'Dota 2',
      title: 'Disposable template'
    }
  });
  assert.equal(disposable.response.status, 201);

  const foreignDelete = await api(`/api/templates/${disposable.payload.id}`, {
    method: 'DELETE',
    token: member.token
  });
  assert.equal(foreignDelete.response.status, 403);

  const ownerDelete = await api(`/api/templates/${disposable.payload.id}`, {
    method: 'DELETE',
    token: owner.token
  });
  assert.equal(ownerDelete.response.status, 200);
});

test('a request can only be created from the current user template', async () => {
  const denied = await api('/api/requests', {
    method: 'POST',
    token: owner.token,
    body: {
      templateId: memberTemplate.id,
      title: 'Foreign template request',
      description: 'This request must be rejected'
    }
  });
  assert.equal(denied.response.status, 403);

  const allowed = await api('/api/requests', {
    method: 'POST',
    token: owner.token,
    body: {
      templateId: ownerTemplate.id,
      title: 'Owner request',
      description: 'Request used by business-rule tests'
    }
  });
  assert.equal(allowed.response.status, 201);
  ownerRequest = allowed.payload;
});

test('request ownership and moderation rules are enforced', async () => {
  const ownerUpdate = await api(`/api/requests/${ownerRequest.id}`, {
    method: 'PUT',
    token: owner.token,
    body: {
      title: 'Updated owner request',
      description: 'Updated by the request owner',
      status: 'OPEN'
    }
  });
  assert.equal(ownerUpdate.response.status, 200);
  assert.equal(ownerUpdate.payload.title, 'Updated owner request');

  const foreignUpdate = await api(`/api/requests/${ownerRequest.id}`, {
    method: 'PUT',
    token: member.token,
    body: { title: 'Forbidden request update' }
  });
  assert.equal(foreignUpdate.response.status, 403);

  const foreignDelete = await api(`/api/requests/${ownerRequest.id}`, {
    method: 'DELETE',
    token: member.token
  });
  assert.equal(foreignDelete.response.status, 403);

  const userModeration = await api(`/api/requests/${ownerRequest.id}/moderation`, {
    method: 'PATCH',
    token: owner.token,
    body: { status: 'MODERATION_BLOCKED' }
  });
  assert.equal(userModeration.response.status, 403);

  const blocked = await api(`/api/requests/${ownerRequest.id}/moderation`, {
    method: 'PATCH',
    token: admin.token,
    body: { status: 'MODERATION_BLOCKED' }
  });
  assert.equal(blocked.response.status, 200);
  assert.equal(blocked.payload.status, 'MODERATION_BLOCKED');

  const blockedOwnerUpdate = await api(`/api/requests/${ownerRequest.id}`, {
    method: 'PUT',
    token: owner.token,
    body: { status: 'OPEN' }
  });
  assert.equal(blockedOwnerUpdate.response.status, 403);

  const reopened = await api(`/api/requests/${ownerRequest.id}/moderation`, {
    method: 'PATCH',
    token: admin.token,
    body: { status: 'OPEN' }
  });
  assert.equal(reopened.response.status, 200);
  assert.equal(reopened.payload.status, 'OPEN');
});

test('response rules reject self-response and duplicate response', async () => {
  const closed = await api(`/api/requests/${ownerRequest.id}`, {
    method: 'PUT',
    token: owner.token,
    body: { status: 'CLOSED' }
  });
  assert.equal(closed.response.status, 200);

  const closedResponse = await api(`/api/requests/${ownerRequest.id}/responses`, {
    method: 'POST',
    token: member.token,
    body: { text: 'Response to a closed request' }
  });
  assert.equal(closedResponse.response.status, 409);

  const reopened = await api(`/api/requests/${ownerRequest.id}`, {
    method: 'PUT',
    token: owner.token,
    body: { status: 'OPEN' }
  });
  assert.equal(reopened.response.status, 200);

  const selfResponse = await api(`/api/requests/${ownerRequest.id}/responses`, {
    method: 'POST',
    token: owner.token,
    body: { text: 'Self response' }
  });
  assert.equal(selfResponse.response.status, 400);

  const created = await api(`/api/requests/${ownerRequest.id}/responses`, {
    method: 'POST',
    token: member.token,
    body: { text: 'Interested in the request' }
  });
  assert.equal(created.response.status, 201);
  conversationId = created.payload.conversation.id;

  const duplicate = await api(`/api/requests/${ownerRequest.id}/responses`, {
    method: 'POST',
    token: member.token,
    body: { text: 'Duplicate response' }
  });
  assert.equal(duplicate.response.status, 409);
});

test('conversation access is limited to participants and read-only for an outside administrator', async () => {
  const outsiderRead = await api(`/api/messages/conversations/${conversationId}`, {
    token: outsider.token
  });
  assert.equal(outsiderRead.response.status, 403);

  const adminRead = await api(`/api/messages/conversations/${conversationId}`, {
    token: admin.token
  });
  assert.equal(adminRead.response.status, 200);

  const outsiderWrite = await api(`/api/messages/conversations/${conversationId}/messages`, {
    method: 'POST',
    token: outsider.token,
    body: { text: 'Forbidden outsider message' }
  });
  assert.equal(outsiderWrite.response.status, 403);

  const adminWrite = await api(`/api/messages/conversations/${conversationId}/messages`, {
    method: 'POST',
    token: admin.token,
    body: { text: 'Forbidden administrator message' }
  });
  assert.equal(adminWrite.response.status, 403);

  const participantWrite = await api(`/api/messages/conversations/${conversationId}/messages`, {
    method: 'POST',
    token: member.token,
    body: { text: 'Participant message' }
  });
  assert.equal(participantWrite.response.status, 201);
  assert.equal(participantWrite.payload.text, 'Participant message');
});

test('only an administrator can delete another user profile', async () => {
  const denied = await api(`/api/users/${outsider.user.id}`, {
    method: 'DELETE',
    token: owner.token
  });
  assert.equal(denied.response.status, 403);

  const allowed = await api(`/api/users/${outsider.user.id}`, {
    method: 'DELETE',
    token: admin.token
  });
  assert.equal(allowed.response.status, 200);
});
