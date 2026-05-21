import { createServer, type Server } from 'node:http';

import { createApp } from '../src/app.js';
import { ensureStorageStructure } from '../src/config/storage.js';
import { initializeSqlite } from '../src/db/sqlite.js';

function listen(app: ReturnType<typeof createApp>): Promise<{ server: Server; baseUrl: string }> {
  const server = createServer(app);

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();

      if (address && typeof address === 'object') {
        resolve({
          server,
          baseUrl: `http://127.0.0.1:${address.port}`,
        });
      }
    });
  });
}

function closeServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

describe('auth routes', () => {
  beforeAll(() => {
    ensureStorageStructure();
    initializeSqlite();
  });

  it('registers a user, restores session from cookie and logs out', async () => {
    const { server, baseUrl } = await listen(createApp());

    try {
      const email = `owner-${Date.now()}@businesspulse.test`;
      const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        body: JSON.stringify({
          email,
          password: 'password-123',
          businessType: 'ecommerce',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(registerResponse.status).toBe(201);
      const cookie = registerResponse.headers.get('set-cookie');
      expect(cookie).toContain('bp_access_token');

      const sessionResponse = await fetch(`${baseUrl}/api/auth/me`, {
        headers: {
          Cookie: cookie ?? '',
        },
      });
      const sessionBody = (await sessionResponse.json()) as {
        data: { email: string; businessType: string };
      };

      expect(sessionResponse.status).toBe(200);
      expect(sessionBody.data.email).toBe(email);
      expect(sessionBody.data.businessType).toBe('ecommerce');

      const logoutResponse = await fetch(`${baseUrl}/api/auth/logout`, {
        method: 'POST',
        headers: {
          Cookie: cookie ?? '',
        },
      });

      expect(logoutResponse.status).toBe(204);
    } finally {
      await closeServer(server);
    }
  });
});
