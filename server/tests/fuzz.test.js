const app = require('../app');

const ITERATIONS = 30;
const REQUEST_TIMEOUT_MS = 1500;

const printableCharacters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 _-@.!?<>[]{}';

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomString(maxLength = 256) {
  const length = randomInt(0, maxLength);
  let value = '';

  for (let index = 0; index < length; index += 1) {
    value += printableCharacters[randomInt(0, printableCharacters.length - 1)];
  }

  return value;
}

function randomValue(depth = 0) {
  const factories = [
    () => null,
    () => undefined,
    () => true,
    () => false,
    () => randomInt(-1000, 1000),
    () => randomString(300),
    () => [],
    () => ({ value: randomString(80) })
  ];

  if (depth > 1) {
    return factories[randomInt(0, 5)]();
  }

  return factories[randomInt(0, factories.length - 1)]();
}

function buildRegisterPayload() {
  return {
    name: randomValue(),
    email: randomValue(),
    password: randomValue()
  };
}

function buildLoginPayload() {
  return {
    email: randomValue(),
    password: randomValue()
  };
}

function buildRequestPayload() {
  return {
    templateId: randomValue(),
    title: randomValue(),
    description: randomValue()
  };
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

async function postJson(url, payload) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function runScenario(name, url, payloadBuilder, allowedStatuses) {
  const result = {
    name,
    total: 0,
    passed: 0,
    failed: 0,
    statuses: {}
  };

  for (let index = 0; index < ITERATIONS; index += 1) {
    result.total += 1;

    try {
      const response = await postJson(url, payloadBuilder());
      const status = response.status;
      result.statuses[status] = (result.statuses[status] ?? 0) + 1;

      if (allowedStatuses.includes(status)) {
        result.passed += 1;
      } else {
        result.failed += 1;
      }
    } catch (error) {
      result.failed += 1;
      result.statuses[error.name] = (result.statuses[error.name] ?? 0) + 1;
    }
  }

  return result;
}

async function main() {
  const { server, baseUrl } = await startServer();

  try {
    const scenarios = [
      {
        name: 'Registration payload fuzzing',
        url: `${baseUrl}/api/auth/register`,
        payloadBuilder: buildRegisterPayload,
        allowedStatuses: [400, 409]
      },
      {
        name: 'Login payload fuzzing',
        url: `${baseUrl}/api/auth/login`,
        payloadBuilder: buildLoginPayload,
        allowedStatuses: [400, 401]
      },
      {
        name: 'Request creation payload fuzzing',
        url: `${baseUrl}/api/requests`,
        payloadBuilder: buildRequestPayload,
        allowedStatuses: [400, 401]
      }
    ];

    const results = [];

    for (const scenario of scenarios) {
      results.push(await runScenario(
        scenario.name,
        scenario.url,
        scenario.payloadBuilder,
        scenario.allowedStatuses
      ));
    }

    console.table(results.map((result) => ({
      scenario: result.name,
      total: result.total,
      passed: result.passed,
      failed: result.failed,
      statuses: JSON.stringify(result.statuses)
    })));

    const failed = results.reduce((sum, result) => sum + result.failed, 0);

    if (failed > 0) {
      process.exitCode = 1;
    }
  } finally {
    await stopServer(server);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
