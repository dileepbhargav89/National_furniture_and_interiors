import { Response } from 'express';
import { logger } from '../../../../core/logger';

export interface SseClient {
  id: string;
  userId: string;
  res: Response;
  roles: string[];
  permissions: string[];
  connectedAt: Date;
  heartbeatInterval: NodeJS.Timeout;
}

export class NotificationEventHub {
  private static instance: NotificationEventHub | null = null;
  private clients: Map<string, SseClient> = new Map();

  constructor() {
    // Enable singleton access if needed across modular use cases
    if (!NotificationEventHub.instance) {
      NotificationEventHub.instance = this;
    }
  }

  public static getInstance(): NotificationEventHub {
    if (!NotificationEventHub.instance) {
      NotificationEventHub.instance = new NotificationEventHub();
    }
    return NotificationEventHub.instance;
  }

  /**
   * Register a new client for Server-Sent Events stream
   */
  public registerClient(
    clientId: string,
    userId: string,
    res: Response,
    roles: string[] = [],
    permissions: string[] = [],
  ): SseClient {
    // Configure response headers for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx proxy buffering
    res.flushHeaders?.();

    // 25s keep-alive heartbeat comment to prevent proxy/browser timeout
    const heartbeatInterval = setInterval(() => {
      try {
        res.write(': heartbeat\n\n');
      } catch {
        this.removeClient(clientId);
      }
    }, 25000);

    const client: SseClient = {
      id: clientId,
      userId,
      res,
      roles,
      permissions,
      connectedAt: new Date(),
      heartbeatInterval,
    };

    this.clients.set(clientId, client);

    logger.info(
      { clientId, userId, activeConnections: this.clients.size },
      'SSE client registered to notification stream',
    );

    // Send initial connection handshake
    const handshake = {
      status: 'connected',
      clientId,
      userId,
      connectedAt: client.connectedAt.toISOString(),
    };
    this.sendEventToClient(client, 'connected', handshake);

    return client;
  }

  /**
   * Remove client on disconnection or error
   */
  public removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      clearInterval(client.heartbeatInterval);
      this.clients.delete(clientId);
      logger.info(
        { clientId, activeConnections: this.clients.size },
        'SSE client disconnected from notification stream',
      );
    }
  }

  /**
   * Send SSE event to a specific client
   */
  private sendEventToClient(client: SseClient, event: string, data: unknown): void {
    try {
      const payload = typeof data === 'string' ? data : JSON.stringify(data);
      client.res.write(`event: ${event}\ndata: ${payload}\n\n`);
    } catch (error) {
      logger.warn(
        { clientId: client.id, err: error },
        'Failed to write SSE event to client, terminating connection',
      );
      this.removeClient(client.id);
    }
  }

  /**
   * Broadcast real-time event to all staff members (with optional permission check)
   */
  public broadcastToStaff(event: string, data: unknown, requiredPermission?: string): void {
    let sentCount = 0;
    for (const client of this.clients.values()) {
      if (
        !requiredPermission ||
        client.permissions.includes('*') ||
        client.permissions.includes(requiredPermission)
      ) {
        this.sendEventToClient(client, event, data);
        sentCount++;
      }
    }
    logger.debug(
      { event, recipients: sentCount, totalClients: this.clients.size },
      'Broadcasted SSE notification to staff',
    );
  }

  /**
   * Send real-time event to a specific user
   */
  public sendToUser(userId: string, event: string, data: unknown): void {
    for (const client of this.clients.values()) {
      if (client.userId === userId) {
        this.sendEventToClient(client, event, data);
      }
    }
  }

  /**
   * Get active connection count
   */
  public getActiveClientCount(): number {
    return this.clients.size;
  }

  /**
   * Clear all active clients (for shutdown or test isolation)
   */
  public closeAll(): void {
    for (const client of this.clients.values()) {
      clearInterval(client.heartbeatInterval);
      try {
        client.res.end();
      } catch {
        // ignore
      }
    }
    this.clients.clear();
  }
}
