import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NotificationEventHub } from '../../../src/modules/notifications/infrastructure/services/notification-event-hub';
import type { Response } from 'express';

describe('NotificationEventHub', () => {
  let hub: NotificationEventHub;
  let mockRes: {
    setHeader: ReturnType<typeof vi.fn>;
    flushHeaders: ReturnType<typeof vi.fn>;
    write: ReturnType<typeof vi.fn>;
    end: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.useFakeTimers();
    hub = new NotificationEventHub();
    mockRes = {
      setHeader: vi.fn(),
      flushHeaders: vi.fn(),
      write: vi.fn(),
      end: vi.fn(),
    };
  });

  afterEach(() => {
    hub.closeAll();
    vi.useRealTimers();
  });

  it('sets up SSE response headers and sends connected handshake', () => {
    const client = hub.registerClient(
      'client-1',
      'user-101',
      mockRes as unknown as Response,
      ['ADMIN'],
      ['*'],
    );

    expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
    expect(mockRes.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache, no-transform');
    expect(mockRes.setHeader).toHaveBeenCalledWith('Connection', 'keep-alive');
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-Accel-Buffering', 'no');
    expect(mockRes.flushHeaders).toHaveBeenCalled();

    expect(client.id).toBe('client-1');
    expect(client.userId).toBe('user-101');
    expect(hub.getActiveClientCount()).toBe(1);

    // Initial handshake event written to stream
    expect(mockRes.write).toHaveBeenCalledWith(
      expect.stringContaining('event: connected\ndata: {"status":"connected"'),
    );
  });

  it('sends keepalive heartbeat comments periodically', () => {
    hub.registerClient('client-1', 'user-101', mockRes as unknown as Response);

    vi.advanceTimersByTime(25000);
    expect(mockRes.write).toHaveBeenCalledWith(': heartbeat\n\n');

    vi.advanceTimersByTime(25000);
    expect(mockRes.write).toHaveBeenCalledTimes(3); // 1 connected handshake + 2 heartbeats
  });

  it('sends targeted events to specific userId via sendToUser', () => {
    const mockRes2 = {
      setHeader: vi.fn(),
      flushHeaders: vi.fn(),
      write: vi.fn(),
      end: vi.fn(),
    };

    hub.registerClient('client-1', 'user-101', mockRes as unknown as Response);
    hub.registerClient('client-2', 'user-202', mockRes2 as unknown as Response);

    const testPayload = { id: 'notif-1', title: 'Consultation Scheduled' };
    hub.sendToUser('user-101', 'notification', testPayload);

    expect(mockRes.write).toHaveBeenCalledWith(
      `event: notification\ndata: ${JSON.stringify(testPayload)}\n\n`,
    );
    expect(mockRes2.write).not.toHaveBeenCalledWith(
      expect.stringContaining('Consultation Scheduled'),
    );
  });

  it('broadcasts events to all staff with permission filtering', () => {
    const mockResStaffNoPerm = {
      setHeader: vi.fn(),
      flushHeaders: vi.fn(),
      write: vi.fn(),
      end: vi.fn(),
    };
    const mockResStaffWithPerm = {
      setHeader: vi.fn(),
      flushHeaders: vi.fn(),
      write: vi.fn(),
      end: vi.fn(),
    };

    hub.registerClient(
      'c1',
      'user-1',
      mockResStaffNoPerm as unknown as Response,
      ['STAFF'],
      ['leads.read'],
    );
    hub.registerClient(
      'c2',
      'user-2',
      mockResStaffWithPerm as unknown as Response,
      ['STAFF'],
      ['leads.read', 'projects.write'],
    );

    const snagAlert = { id: 'snag-99', title: 'Snag Alert' };
    hub.broadcastToStaff('notification', snagAlert, 'projects.write');

    expect(mockResStaffWithPerm.write).toHaveBeenCalledWith(
      `event: notification\ndata: ${JSON.stringify(snagAlert)}\n\n`,
    );
    expect(mockResStaffNoPerm.write).not.toHaveBeenCalledWith(
      expect.stringContaining('Snag Alert'),
    );
  });

  it('removes client gracefully on removeClient or write failure', () => {
    hub.registerClient('client-1', 'user-101', mockRes as unknown as Response);
    expect(hub.getActiveClientCount()).toBe(1);

    hub.removeClient('client-1');
    expect(hub.getActiveClientCount()).toBe(0);
  });

  it('clears all clients on closeAll', () => {
    hub.registerClient('client-1', 'user-101', mockRes as unknown as Response);
    hub.registerClient('client-2', 'user-202', mockRes as unknown as Response);
    expect(hub.getActiveClientCount()).toBe(2);

    hub.closeAll();
    expect(hub.getActiveClientCount()).toBe(0);
  });
});
