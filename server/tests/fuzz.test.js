require('dotenv').config();

const app = require('../app');
const prisma = require('../lib/prisma');

const ITERATIONS = Number.parseInt(process.env.FUZZ_ITERATIONS ?? '12', 10);
const REQUEST_TIMEOUT_MS = Number.parseInt(process.env.FUZZ_TIMEOUT_MS ?? '2500', 10);
const SEED = Number.parseInt(process.env.FUZZ_SEED ?? '20260622', 10);
const PASSWORD = 'Fuzz12345!';

const runId = `${Date.now()}-${SEED}`;
const nameSuffix = Date.now().toString(36);
const emailPrefix = `fuzz-${runId}`;
const fixtureEmails = {
  admin: `${emailPrefix}-admin@example.test`,
  owner: `${emailPrefix}-owner@example.test`,
  responder: `${emailPrefix}-responder@example.test`
};

let random = createRandom(SEED);

// Детерминированный генератор обеспечивает воспроизводимость найденных ошибок.
function createRandom(seed) {
  return function nextRandom() {
    let value = seed += 0x6D2B79F5;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

function randomInt(min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function randomItem(values) {
  return values[randomInt(0, values.length - 1)];
}

function randomString(maxLength = 256) {
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 _-@.!?<>[]{}\u0000';
  const length = randomInt(0, maxLength);
  let value = '';

  for (let index = 0; index < length; index += 1) {
    value += characters[randomInt(0, characters.length - 1)];
  }

  return value;
}

function randomHeaderString(maxLength = 256) {
  return randomString(maxLength).replace(/[\u0000\r\n]/g, 'x');
}

function nestedObject(depth) {
  let value = 'leaf';

  for (let index = 0; index < depth; index += 1) {
    value = { nested: value };
  }

  return value;
}

function edgeValue() {
  const factories = [
    () => null,
    () => true,
    () => false,
    () => 0,
    () => -2147483649,
    () => Number.MAX_SAFE_INTEGER,
    () => '',
    () => '   ',
    () => randomString(512),
    () => 'Ж𠜎🎮'.repeat(80),
    () => '<script>alert(1)</script>',
    () => "' OR 1=1 --",
    () => 'A'.repeat(150000),
    () => [],
    () => [null, true, { value: 'nested' }],
    () => ({ value: randomString(100) }),
    () => nestedObject(25),
    () => ({ __proto__: { isAdmin: true }, constructor: { prototype: { role: 'ADMIN' } } })
  ];

  return randomItem(factories)();
}

function mutatePayload(basePayload, fields, iteration) {
  const payload = { ...basePayload };
  const field = fields[iteration % fields.length];
  payload[field] = edgeValue();

  if (iteration % 3 === 0) {
    payload.unknownField = edgeValue();
  }

  return payload;
}

function fuzzPathId(iteration) {
  const values = [
    'not-a-uuid',
    '0',
    'null',
    '../admin',
    '00000000-0000-0000-0000-000000000000',
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    'A'.repeat(300),
    `invalid-${iteration}-${randomString(20)}`
  ];

  return encodeURIComponent(values[iteration % values.length]);
}

async function startServer() {
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      resolve({
        server,
        baseUrl: `http://127.0.0.1:${server.address().port}`
      });
    });
  });
}

async function stopServer(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

async function requestApi(baseUrl, request) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const headers = { ...(request.headers ?? {}) };

  if (request.token) {
    headers.Authorization = `Bearer ${request.token}`;
  }

  let body;
  if (request.rawBody !== undefined) {
    body = request.rawBody;
    headers['Content-Type'] ??= 'application/json';
  } else if (request.body !== undefined) {
    body = JSON.stringify(request.body);
    headers['Content-Type'] ??= 'application/json';
  }

  const startedAt = performance.now();

  try {
    const response = await fetch(`${baseUrl}${request.path}`, {
      method: request.method ?? 'GET',
      headers,
      body,
      signal: controller.signal
    });
    const elapsedMs = performance.now() - startedAt;
    const responseText = await response.text();
    const contentType = response.headers.get('content-type') ?? '';
    let payload = null;

    if (responseText && contentType.includes('application/json')) {
      payload = JSON.parse(responseText);
    }

    return {
      contentType,
      elapsedMs,
      payload,
      responseText,
      status: response.status
    };
  } finally {
    clearTimeout(timeout);
  }
}

function ensureSafeResponse(result) {
  if (result.status >= 500) {
    throw new Error(`Получен серверный статус ${result.status}`);
  }

  if (result.elapsedMs > REQUEST_TIMEOUT_MS) {
    throw new Error(`Превышен лимит времени: ${Math.round(result.elapsedMs)} мс`);
  }

  if (result.responseText && !result.contentType.includes('application/json')) {
    throw new Error(`API вернул неподдерживаемый Content-Type: ${result.contentType || 'не указан'}`);
  }
}

async function expectStatus(baseUrl, request, expectedStatus) {
  const result = await requestApi(baseUrl, request);

  if (result.status !== expectedStatus) {
    throw new Error(`${request.method ?? 'GET'} ${request.path}: ожидался ${expectedStatus}, получен ${result.status}`);
  }

  return result.payload;
}

async function createFixtures(baseUrl) {
  const owner = await expectStatus(baseUrl, {
    method: 'POST',
    path: '/api/auth/register',
    body: { name: `fuzz_owner_${nameSuffix}`, email: fixtureEmails.owner, password: PASSWORD }
  }, 201);
  const responder = await expectStatus(baseUrl, {
    method: 'POST',
    path: '/api/auth/register',
    body: { name: `fuzz_responder_${nameSuffix}`, email: fixtureEmails.responder, password: PASSWORD }
  }, 201);
  let admin = await expectStatus(baseUrl, {
    method: 'POST',
    path: '/api/auth/register',
    body: { name: `fuzz_admin_${nameSuffix}`, email: fixtureEmails.admin, password: PASSWORD }
  }, 201);

  await prisma.user.update({
    where: { id: admin.user.id },
    data: { role: 'ADMIN' }
  });

  admin = await expectStatus(baseUrl, {
    method: 'POST',
    path: '/api/auth/login',
    body: { email: fixtureEmails.admin, password: PASSWORD }
  }, 200);

  const template = await expectStatus(baseUrl, {
    method: 'POST',
    path: '/api/templates',
    token: owner.token,
    body: {
      templateType: 'PLAYER',
      gameName: 'Counter-Strike 2',
      title: 'Fuzz fixture template',
      preferredRole: 'AWPer',
      rank: 'Premier 10000-15000',
      schedule: 'Evenings',
      description: 'Template used by the API fuzzer'
    }
  }, 201);

  const request = await expectStatus(baseUrl, {
    method: 'POST',
    path: '/api/requests',
    token: owner.token,
    body: {
      templateId: template.id,
      title: 'Fuzz fixture request',
      description: 'Request used by the API fuzzer'
    }
  }, 201);

  const response = await expectStatus(baseUrl, {
    method: 'POST',
    path: `/api/requests/${request.id}/responses`,
    token: responder.token,
    body: { text: 'Fuzz fixture response' }
  }, 201);

  return {
    admin,
    conversationId: response.conversation.id,
    owner,
    request,
    responder,
    template
  };
}

function buildScenarios(fixtures) {
  const templateBase = {
    templateType: 'PLAYER',
    gameName: 'Counter-Strike 2',
    title: 'Fuzzed template',
    preferredRole: 'AWPer',
    rank: 'Premier 10000-15000',
    schedule: 'Evenings',
    description: 'Fuzzed template description'
  };
  const requestBase = {
    templateId: fixtures.template.id,
    title: 'Fuzzed request',
    description: 'Fuzzed request description'
  };

  return [
    {
      name: 'Malformed JSON parser',
      build: (iteration) => ({
        method: 'POST',
        path: '/api/auth/register',
        rawBody: randomItem(['{', '{"name":', '[1,', `{"x":"${'A'.repeat(iteration * 10)}"`])
      })
    },
    {
      name: 'Registration body',
      build: (iteration) => ({
        method: 'POST',
        path: '/api/auth/register',
        body: mutatePayload({
          name: `fuzz_${nameSuffix}_${iteration}`,
          email: `${emailPrefix}-generated-${iteration}@example.test`,
          password: PASSWORD
        }, ['name', 'email', 'password'], iteration)
      })
    },
    {
      name: 'Login body',
      build: (iteration) => ({
        method: 'POST',
        path: '/api/auth/login',
        body: mutatePayload({ email: fixtureEmails.owner, password: PASSWORD }, ['email', 'password'], iteration)
      })
    },
    {
      name: 'Authorization header',
      build: (iteration) => ({
        path: '/api/auth/me',
        headers: {
          Authorization: randomItem([
            '',
            'Bearer',
            `Bearer ${randomHeaderString(500)}`,
            'Basic Zm9vOmJhcg==',
            `bearer ${fixtures.owner.token}`,
            `Bearer ${fixtures.owner.token} trailing-${iteration}`
          ])
        }
      })
    },
    {
      name: 'Public request query',
      build: (iteration) => {
        // URL ограничивается на стороне клиента, поэтому query-нагрузка тестируется отдельно от body-limit.
        const value = encodeURIComponent(String(edgeValue()).slice(0, 4096));
        const field = randomItem(['gameName', 'templateType', 'status', 'search']);
        return { path: `/api/requests?${field}=${value}` };
      }
    },
    {
      name: 'Request path parameter',
      build: (iteration) => ({ path: `/api/requests/${fuzzPathId(iteration)}` })
    },
    {
      name: 'User update body',
      build: (iteration) => ({
        method: 'PUT',
        path: `/api/users/${fixtures.owner.user.id}`,
        token: fixtures.owner.token,
        body: mutatePayload({ name: `fuzz_owner_${nameSuffix}`, email: fixtureEmails.owner }, ['name', 'email'], iteration)
      })
    },
    {
      name: 'User path parameter',
      build: (iteration) => ({
        path: `/api/users/${fuzzPathId(iteration)}`,
        token: fixtures.owner.token
      })
    },
    {
      name: 'Template creation body',
      build: (iteration) => ({
        method: 'POST',
        path: '/api/templates',
        token: fixtures.owner.token,
        body: mutatePayload(templateBase, Object.keys(templateBase), iteration)
      })
    },
    {
      name: 'Template update body',
      build: (iteration) => ({
        method: 'PUT',
        path: `/api/templates/${fixtures.template.id}`,
        token: fixtures.owner.token,
        body: mutatePayload(templateBase, Object.keys(templateBase), iteration)
      })
    },
    {
      name: 'Template path parameter',
      build: (iteration) => ({
        method: 'DELETE',
        path: `/api/templates/${fuzzPathId(iteration)}`,
        token: fixtures.owner.token
      })
    },
    {
      name: 'Request creation body',
      build: (iteration) => ({
        method: 'POST',
        path: '/api/requests',
        token: fixtures.owner.token,
        body: mutatePayload(requestBase, Object.keys(requestBase), iteration)
      })
    },
    {
      name: 'Request update body',
      build: (iteration) => ({
        method: 'PUT',
        path: `/api/requests/${fixtures.request.id}`,
        token: fixtures.owner.token,
        body: mutatePayload({
          title: 'Fuzzed request update',
          description: 'Fuzzed request update description',
          status: 'OPEN'
        }, ['title', 'description', 'status'], iteration)
      })
    },
    {
      name: 'Moderation body and RBAC',
      build: (iteration) => ({
        method: 'PATCH',
        path: `/api/requests/${fixtures.request.id}/moderation`,
        token: iteration % 2 === 0 ? fixtures.admin.token : fixtures.owner.token,
        body: { status: edgeValue() }
      })
    },
    {
      name: 'Response body',
      build: (iteration) => ({
        method: 'POST',
        path: `/api/requests/${fixtures.request.id}/responses`,
        token: fixtures.responder.token,
        body: { text: edgeValue() }
      })
    },
    {
      name: 'Response path parameter',
      build: (iteration) => ({
        method: 'POST',
        path: `/api/requests/${fuzzPathId(iteration)}/responses`,
        token: fixtures.responder.token,
        body: { text: randomString(200) }
      })
    },
    {
      name: 'Conversation path parameter',
      build: (iteration) => ({
        path: `/api/messages/conversations/${fuzzPathId(iteration)}`,
        token: fixtures.owner.token
      })
    },
    {
      name: 'Message body',
      build: (iteration) => ({
        method: 'POST',
        path: `/api/messages/conversations/${fixtures.conversationId}/messages`,
        token: fixtures.owner.token,
        body: { text: edgeValue() }
      })
    }
  ];
}

async function runScenario(baseUrl, scenario) {
  const result = {
    endpoint: scenario.name,
    total: ITERATIONS,
    passed: 0,
    failed: 0,
    clientErrors: 0,
    successes: 0,
    statuses: {},
    totalMs: 0,
    maxMs: 0,
    failures: []
  };

  for (let iteration = 0; iteration < ITERATIONS; iteration += 1) {
    const request = scenario.build(iteration);

    try {
      const response = await requestApi(baseUrl, request);
      ensureSafeResponse(response);

      result.statuses[response.status] = (result.statuses[response.status] ?? 0) + 1;
      result.totalMs += response.elapsedMs;
      result.maxMs = Math.max(result.maxMs, response.elapsedMs);
      result.passed += 1;

      if (response.status >= 400) {
        result.clientErrors += 1;
      } else {
        result.successes += 1;
      }
    } catch (error) {
      result.failed += 1;
      result.failures.push({
        iteration,
        method: request.method ?? 'GET',
        path: request.path,
        error: error.message
      });
    }
  }

  const health = await requestApi(baseUrl, { path: '/api/health' });
  if (health.status !== 200) {
    result.failed += 1;
    result.failures.push({ error: `Сервер не прошёл health-check после сценария: ${health.status}` });
  }

  return result;
}

async function cleanupFixtures() {
  await prisma.user.deleteMany({
    where: {
      email: { startsWith: emailPrefix }
    }
  });
}

async function main() {
  random = createRandom(SEED);
  await prisma.$connect();
  await cleanupFixtures();
  const { server, baseUrl } = await startServer();

  try {
    const fixtures = await createFixtures(baseUrl);
    const scenarios = buildScenarios(fixtures);
    const results = [];

    for (const scenario of scenarios) {
      results.push(await runScenario(baseUrl, scenario));
    }

    console.table(results.map((result) => ({
      scenario: result.endpoint,
      total: result.total,
      passed: result.passed,
      failed: result.failed,
      success: result.successes,
      clientError: result.clientErrors,
      averageMs: Math.round(result.totalMs / Math.max(result.passed, 1)),
      maxMs: Math.round(result.maxMs),
      statuses: JSON.stringify(result.statuses)
    })));

    const failures = results.flatMap((result) => result.failures.map((failure) => ({
      scenario: result.endpoint,
      ...failure
    })));

    console.log(`Fuzz seed: ${SEED}; scenarios: ${scenarios.length}; requests: ${scenarios.length * ITERATIONS}`);

    if (failures.length > 0) {
      console.error('Найдены нарушения инвариантов API:');
      console.error(failures.slice(0, 20));
      process.exitCode = 1;
    }
  } finally {
    await stopServer(server);
    await cleanupFixtures();
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
