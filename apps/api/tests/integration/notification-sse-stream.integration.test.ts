import type { Server } from 'node:http';
import http from 'node:http';
import express, { type RequestHandler } from 'express';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createNotificationsRouter } from '../../src/modules/notifications/presentation/notifications.routes';

vi.mock('../../src/queues', () => ({
  notificationsQueue: {
    add: vi.fn().mockResolvedValue({}),
  },
  invoicesQueue: {
    add: vi.fn().mockResolvedValue({}),
  },
}));
import { NotificationsController } from '../../src/modules/notifications/presentation/notifications.controller';
import { NotificationEventHub } from '../../src/modules/notifications/infrastructure/services/notification-event-hub';
import {
  CreateAndSendNotificationUseCase,
  ListNotificationsUseCase,
  GetMyNotificationsUseCase,
  GetUnreadCountUseCase,
  MarkNotificationAsReadUseCase,
  MarkAllAsReadUseCase,
} from '../../src/modules/notifications/application/notifications.use-cases';
import {
  NotificationChannel,
  NotificationPriority,
  NotificationType,
  INotification,
  INotificationRepository,
} from '../../src/modules/notifications/domain/notifications.types';
import { errorHandlerMiddleware } from '../../src/core/exceptions';

class InMemoryNotificationRepository implements INotificationRepository {
  public items: INotification[] = [];
  private idCounter = 1;

  async create(
    notification: Omit<INotification, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<INotification> {
    const item: INotification = {
      ...notification,
      id: `notif_${this.idCounter++}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.items.push(item);
    return JSON.parse(JSON.stringify(item));
  }

  async findById(id: string): Promise<INotification | null> {
    const found = this.items.find((n) => n.id === id);
    return found ? JSON.parse(JSON.stringify(found)) : null;
  }

  async findByRecipient(recipientId: string, limit = 20, offset = 0): Promise<INotification[]> {
    return this.items
      .filter((n) => n.recipientId === recipientId || n.recipientId === null)
      .slice(offset, offset + limit);
  }

  async findAll(limit = 20, offset = 0, userId?: string): Promise<INotification[]> {
    if (userId) {
      return this.findByRecipient(userId, limit, offset);
    }
    return this.items.slice(offset, offset + limit);
  }

  async markAsRead(id: string): Promise<void> {
    const found = this.items.find((n) => n.id === id);
    if (found) {
      found.readAt = new Date();
    }
  }

  async markAllAsRead(recipientId: string): Promise<number> {
    let count = 0;
    for (const item of this.items) {
      if (item.recipientId === recipientId && !item.readAt) {
        item.readAt = new Date();
        count++;
      }
    }
    return count;
  }

  async countUnread(recipientId: string): Promise<number> {
    return this.items.filter(
      (n) => (n.recipientId === recipientId || n.recipientId === null) && !n.readAt,
    ).length;
  }

  async markSent(id: string): Promise<void> {
    const found = this.items.find((n) => n.id === id);
    if (found) found.sentAt = new Date();
  }

  async markFailed(id: string, reason: string): Promise<void> {
    const found = this.items.find((n) => n.id === id);
    if (found) {
      found.failureReason = reason;
      found.retryCount = (found.retryCount || 0) + 1;
    }
  }
}

describe('Notification SSE Stream & Real-time Push Integration', () => {
  let server: Server;
  let baseUrl: string;
  let eventHub: NotificationEventHub;
  let repo: InMemoryNotificationRepository;

  beforeAll(async () => {
    const app = express();
    app.use(express.json());

    repo = new InMemoryNotificationRepository();
    eventHub = new NotificationEventHub();

    const controller = new NotificationsController(
      new ListNotificationsUseCase(repo),
      new MarkNotificationAsReadUseCase(repo),
      new CreateAndSendNotificationUseCase(repo),
      new GetMyNotificationsUseCase(repo),
      new GetUnreadCountUseCase(repo),
      new MarkAllAsReadUseCase(repo),
      undefined,
      undefined,
      eventHub,
    );

    const testAuthMiddleware: RequestHandler = (req, _res, next) => {
      req.auth = {
        sub: 'usr_admin_ananya',
        userType: 'STAFF',
        roleId: 'role-admin',
        roleName: 'ADMIN',
        permissions: ['*'],
      };
      next();
    };

    const testRequirePermission = (): RequestHandler => (_req, _res, next) => {
      next();
    };

    const router = createNotificationsRouter(controller, testAuthMiddleware, testRequirePermission);
    app.use('/api/v1/notifications', router);
    app.use(errorHandlerMiddleware);

    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => resolve());
    });

    const address = server.address();
    if (!address || typeof address === 'string') {
      throw new Error('Failed to bind server port');
    }
    baseUrl = `http://127.0.0.1:${address.port}/api/v1/notifications`;
  });

  afterAll(async () => {
    eventHub.closeAll();
    if (server) {
      const srv = server as unknown as { closeAllConnections?: () => void };
      if (typeof srv.closeAllConnections === 'function') {
        srv.closeAllConnections();
      }
      await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    }
  });

  function connectStream(url: string): Promise<{
    chunks: string[];
    close: () => void;
    waitForMatch: (pattern: string, timeoutMs?: number) => Promise<string>;
  }> {
    return new Promise((resolve, reject) => {
      const chunks: string[] = [];
      let isConnected = false;

      const req = http.get(url, (res) => {
        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toBe('text/event-stream');

        res.on('data', (chunk) => {
          const text = chunk.toString();
          chunks.push(text);
          if (!isConnected && text.includes('event: connected')) {
            isConnected = true;
            resolve({
              chunks,
              close: () => {
                try {
                  res.destroy();
                  req.destroy();
                } catch {
                  // ignore
                }
              },
              waitForMatch: (pattern: string, timeoutMs = 2500) => {
                return new Promise((resMatch, rejMatch) => {
                  const check = () => {
                    const combined = chunks.join('');
                    if (combined.includes(pattern)) {
                      return resMatch(combined);
                    }
                  };
                  check();
                  const interval = setInterval(() => {
                    const combined = chunks.join('');
                    if (combined.includes(pattern)) {
                      clearInterval(interval);
                      clearTimeout(timer);
                      resMatch(combined);
                    }
                  }, 25);
                  const timer = setTimeout(() => {
                    clearInterval(interval);
                    rejMatch(
                      new Error(
                        `Timed out waiting for pattern: ${pattern}. Received: ${chunks.join('')}`,
                      ),
                    );
                  }, timeoutMs);
                });
              },
            });
          }
        });
      });

      req.on('error', (err) => {
        if (!isConnected) reject(err);
      });
    });
  }

  it('connects to /stream and receives SSE connected handshake', async () => {
    const stream = await connectStream(`${baseUrl}/stream`);
    expect(stream.chunks.join('')).toContain('event: connected');
    expect(stream.chunks.join('')).toContain('"status":"connected"');
    expect(stream.chunks.join('')).toContain('usr_admin_ananya');
    stream.close();
  });

  it('receives real-time push event when notification is created', async () => {
    const stream = await connectStream(`${baseUrl}/stream`);

    // Post in-app notification to the connected admin user
    const createRes = await fetch(`${baseUrl}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientId: 'usr_admin_ananya',
        channel: NotificationChannel.IN_APP,
        type: NotificationType.LEAD_ASSIGNED,
        priority: NotificationPriority.HIGH,
        title: 'VIP Consultation Lead Assigned',
        message: 'Dr. Arvind Swaminathan scheduled a consultation for a 4BHK Villa.',
        actionUrl: '/crm',
        actionLabel: 'View in CRM',
      }),
    });

    expect(createRes.status).toBe(201);
    const body = await createRes.json();
    expect(body.success).toBe(true);

    const received = await stream.waitForMatch('VIP Consultation Lead Assigned');
    expect(received).toContain('event: notification');
    expect(received).toContain('Dr. Arvind Swaminathan');
    stream.close();
  });

  it('receives broadcast event on staff stream', async () => {
    const stream = await connectStream(`${baseUrl}/stream`);

    const broadcastRes = await fetch(`${baseUrl}/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel: NotificationChannel.IN_APP,
        priority: NotificationPriority.URGENT,
        title: 'Heirloom Autumn Collection Launch',
        message: 'Showroom staff briefing starts in 15 minutes in Indiranagar Studio.',
        actionUrl: '/catalog',
        actionLabel: 'Briefing Docs',
      }),
    });

    expect(broadcastRes.status).toBe(201);

    const received = await stream.waitForMatch('Heirloom Autumn Collection Launch');
    expect(received).toContain('event: notification');
    expect(received).toContain('Showroom staff briefing');
    stream.close();
  });
});
