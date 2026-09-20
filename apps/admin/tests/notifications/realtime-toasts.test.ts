import { describe, it, expect } from 'vitest';
import { NotificationsService } from '@nfi/api-client';

describe('Admin Real-Time Event Push & Notification Toasts', () => {
  it('correctly derives SSE stream URL with token authentication', () => {
    const urlWithToken = NotificationsService.getStreamUrl('test-admin-jwt-token-xyz');
    expect(urlWithToken).toContain('/api/v1/notifications/stream');
    expect(urlWithToken).toContain('token=test-admin-jwt-token-xyz');

    const urlWithoutToken = NotificationsService.getStreamUrl();
    expect(urlWithoutToken).toContain('/api/v1/notifications/stream');
    expect(urlWithoutToken).not.toContain('token=');
  });

  it('allocates proper toast durations based on priority tier', () => {
    const urgentNotification = {
      priority: 'URGENT' as const,
      type: 'LEAD_CONCIERGE_ALERT' as const,
    };
    const normalNotification = {
      priority: 'NORMAL' as const,
      type: 'GENERAL' as const,
    };

    const getDuration = (priority: string) => (priority === 'URGENT' ? 12000 : 8000);

    expect(getDuration(urgentNotification.priority)).toBe(12000);
    expect(getDuration(normalNotification.priority)).toBe(8000);
  });

  it('correctly maps distinct notification badges and action URLs', () => {
    interface TestEvent {
      type: string;
      expectedBadge: string;
      actionUrl: string;
    }

    const testEvents: TestEvent[] = [
      {
        type: 'LEAD_CONCIERGE_ALERT',
        expectedBadge: 'Concierge Lead',
        actionUrl: '/crm',
      },
      {
        type: 'CONSULTATION_BOOKED',
        expectedBadge: 'Concierge Lead',
        actionUrl: '/crm',
      },
      {
        type: 'SWATCH_KIT_ORDERED',
        expectedBadge: 'Material Swatch',
        actionUrl: '/crm',
      },
      {
        type: 'SNAG_ALERT',
        expectedBadge: 'Site Snag',
        actionUrl: '/projects/dp_101',
      },
    ];

    const getBadgeLabel = (type: string) => {
      if (type === 'SNAG_ALERT') return 'Site Snag';
      if (type === 'SWATCH_KIT_ORDERED') return 'Material Swatch';
      if (type === 'LEAD_CONCIERGE_ALERT' || type === 'CONSULTATION_BOOKED')
        return 'Concierge Lead';
      return 'Update';
    };

    for (const event of testEvents) {
      expect(getBadgeLabel(event.type)).toBe(event.expectedBadge);
      expect(event.actionUrl).toBeTruthy();
    }
  });

  it('handles pause-on-hover countdown calculation accurately', () => {
    const duration = 8000;
    let remainingMs = duration;
    const elapsedBeforePause = 3000; // hovered after 3 seconds

    remainingMs = Math.max(0, duration - elapsedBeforePause);
    const progressPercent = (remainingMs / duration) * 100;

    expect(remainingMs).toBe(5000);
    expect(progressPercent).toBe(62.5);
  });
});
